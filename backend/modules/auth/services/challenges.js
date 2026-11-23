const { randomBytes, randomInt, createHmac, timingSafeEqual } = require('node:crypto');
const Challenge = require('../../../models/VerificationChallenge');
const { getJwtSecret } = require('../../../config/jwtConfig');
const { sendVerificationCode } = require('./email/emailService');
const COOKIE = 'ttwar_challenge';
const LIFETIME = 10 * 60 * 1000;
function cookieOptions() { return { httpOnly: true, signed: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/api/auth', maxAge: LIFETIME }; }
function hashCode(id, code) { return createHmac('sha256', getJwtSecret()).update(id + ':' + code).digest('hex'); }
async function issueChallenge(user, res) {
  const id = randomBytes(32).toString('hex');
  const code = String(randomInt(10000, 100000));
  const now = new Date();
  await Challenge.create({ _id: id, user_id: user._id, email: user.email, token_version: user.token_version || 0, codeHash: hashCode(id, code), expiresAt: new Date(+now + LIFETIME), lastSentAt: now });
  try { await sendVerificationCode(user.email, code); }
  catch (error) { await Challenge.deleteOne({ _id: id }); throw error; }
  res.cookie(COOKIE, id, cookieOptions());
}
async function resendChallenge(req) {
  const id = req.signedCookies?.[COOKIE];
  if (!id) return { status: 401, message: 'ابدأ بتسجيل الدخول أو إنشاء حساب' };
  const now = new Date();
  const code = String(randomInt(10000, 100000));
  const pending = await Challenge.findOneAndUpdate({ _id: id, email: req.body.email, expiresAt: { $gt: now }, attempts: { $lt: 5 }, lastSentAt: { $lte: new Date(+now - 60000) } }, { $set: { codeHash: hashCode(id, code), lastSentAt: now } }, { new: true });
  if (!pending) return { status: 429, message: 'انتظر دقيقة، أو ابدأ تسجيل الدخول مجددًا إذا انتهى التحدي' };
  await sendVerificationCode(pending.email, code);
  return { status: 200, message: 'تم إعادة إرسال الكود' };
}
async function consumeChallenge(req) {
  const id = req.signedCookies?.[COOKIE];
  if (!id || typeof req.body.code !== 'string' || !/^\d{5}$/.test(req.body.code)) return null;
  const pending = await Challenge.findOneAndUpdate({ _id: id, email: req.body.email, expiresAt: { $gt: new Date() }, attempts: { $lt: 5 } }, { $inc: { attempts: 1 } }, { new: true }).select('+codeHash');
  if (!pending) return null;
  const expected = Buffer.from(pending.codeHash, 'hex');
  const supplied = Buffer.from(hashCode(id, req.body.code), 'hex');
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
  // Atomic removal prevents concurrent successful requests from reusing a code.
  return Challenge.findOneAndDelete({ _id: id, codeHash: pending.codeHash, expiresAt: { $gt: new Date() } });
}
module.exports = { issueChallenge, resendChallenge, consumeChallenge, COOKIE, cookieOptions };
