const express = require('express');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const { randomBytes, randomInt, createHash, createHmac, timingSafeEqual } = require('node:crypto');
const { rateLimit } = require('express-rate-limit');
const User = require('../../../../models/User');
const Reset = require('../../../../models/PasswordResetChallenge');
const { getJwtSecret, versionQuery } = require('../../../../config/jwtConfig');
const { validate } = require('../../../../middleware/validate');
const { newPassword } = require('../../../../middleware/passwordSchema');
const { ensureEmailConfigured, sendPasswordResetCode } = require('../../services/email/emailService');
const { COOKIE: LOGIN_COOKIE } = require('../../services/challenges');
function createPasswordRecoveryRouter() {
  const router = express.Router();
  const COOKIE = 'ttwar_password_reset';
  const LIFETIME = 10 * 60 * 1000;
  const emailSchema = Joi.string().email().trim().lowercase().max(254).required();
  const requestLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, message: { message: 'طلبات استعادة كثيرة؛ حاول بعد ربع ساعة' } });
  const resetLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false, message: { message: 'محاولات كثيرة؛ حاول بعد ربع ساعة' } });
  function options() { return { httpOnly: true, signed: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/api/auth', maxAge: LIFETIME }; }
  function digest(value) { return createHash('sha256').update(value).digest('hex'); }
  function keyed(value) { return createHmac('sha256', getJwtSecret()).update('password-reset:' + value).digest('hex'); }
  const invalid = res => res.status(400).json({ message: 'رمز الاستعادة غير صالح أو انتهى؛ اطلب رمزًا جديدًا من المتصفح نفسه' });
  router.use(['/forgot-password', '/reset-password'], (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  router.post('/forgot-password', requestLimit, validate(Joi.object({ email: emailSchema })), async (req, res, next) => {
    try {
      // Configuration errors have the same response regardless of account existence.
      ensureEmailConfigured();
      const user = await User.findOne({ email: req.body.email, provider: 'local', is_active: true });
      const nonce = randomBytes(32).toString('hex');
      const nonceHash = digest(nonce);
      const code = String(randomInt(100000, 1000000));
      const now = new Date();
      const id = keyed(req.body.email);
      try {
        await Reset.findOneAndUpdate({ _id: id, lastSentAt: { $lte: new Date(+now - 60000) } }, {
          $set: { user_id: user?._id || null, token_version: user?.token_version || 0, nonceHash, codeHash: keyed(nonce + ':' + code), attempts: 0, lastSentAt: now, expiresAt: new Date(+now + LIFETIME) },
        }, { upsert: true, runValidators: true });
      } catch (error) {
        if (error.code === 11000) return res.set('Retry-After', '60').status(429).json({ message: 'انتظر دقيقة قبل طلب رمز استعادة جديد' });
        throw error;
      }
      res.cookie(COOKIE, nonce, options());
      res.status(202).json({ message: 'تم استلام الطلب. إذا كان البريد لحساب محلي نشط، ستُحاول خدمة البريد إرسال رمز الاستعادة. راجع البريد غير المرغوب فيه إذا لم يصلك.', retry_after: 60 });
      // Acknowledge before SMTP to avoid exposing account existence through mail failures or delays.
      if (user) {
        try { await sendPasswordResetCode(user.email, code); }
        catch {
          console.warn('Password recovery email delivery failed');
          await Reset.updateOne({ _id: id, nonceHash }, { $set: { user_id: null } });
        }
      }
    } catch (error) { if (res.headersSent) console.error('Password recovery delivery cleanup failed'); else next(error); }
  });
  router.post('/reset-password', resetLimit, validate(Joi.object({ email: emailSchema, code: Joi.string().pattern(/^\d{6}$/).required(), new_password: newPassword.required() })), async (req, res, next) => {
    try {
      const nonce = req.signedCookies?.[COOKIE];
      if (typeof nonce !== 'string' || !/^[a-f0-9]{64}$/.test(nonce)) return invalid(res);
      const filter = { _id: keyed(req.body.email), nonceHash: digest(nonce), expiresAt: { $gt: new Date() }, attempts: { $lt: 5 } };
      const pending = await Reset.findOneAndUpdate(filter, { $inc: { attempts: 1 } }, { new: true }).select('+codeHash');
      if (!pending) return invalid(res);
      const expected = Buffer.from(pending.codeHash, 'hex');
      const supplied = Buffer.from(keyed(nonce + ':' + req.body.code), 'hex');
      if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied) || !pending.user_id) return invalid(res);
      // Consume atomically before hashing: only one concurrent request may use this code.
      const consumed = await Reset.findOneAndDelete({ _id: pending._id, nonceHash: digest(nonce), codeHash: pending.codeHash, expiresAt: { $gt: new Date() } });
      if (!consumed) return invalid(res);
      const password = await bcrypt.hash(req.body.new_password, 12);
      const version = consumed.token_version || 0;
      const updated = await User.findOneAndUpdate({ _id: consumed.user_id, email: req.body.email, provider: 'local', is_active: true, ...versionQuery(version) }, {
        $set: { password, token_version: version + 1 }, $unset: { password_hash: 1 },
      }, { new: true, runValidators: true });
      if (!updated) return invalid(res);
      const { maxAge: _maxAge, ...clearOptions } = options();
      res.clearCookie(COOKIE, clearOptions); res.clearCookie(LOGIN_COOKIE, clearOptions);
      res.json({ message: 'تم تعيين كلمة المرور وإنهاء الجلسات السابقة. سجل الدخول بالكلمة الجديدة ورمز البريد.' });
    } catch (error) { next(error); }
  });
  return router;
}
module.exports = createPasswordRecoveryRouter;
