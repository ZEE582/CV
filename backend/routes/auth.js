const express = require('express');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const { rateLimit } = require('express-rate-limit');
const { signToken, versionQuery } = require('../config/jwtConfig');
const User = require('../models/User');
const Company = require('../models/Company');
const { companyVersion } = require('../services/companyRevision');
const history = require('../services/managementHistory');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { newPassword } = require('../middleware/passwordSchema');
const router = express.Router();
const passwordLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, keyGenerator: req => req.user.id, message: { message: 'محاولات كثيرة لتغيير كلمة المرور؛ حاول بعد ربع ساعة' } });
router.get('/providers', (_req, res) => res.json({
  google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  github: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
  linkedin: !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET),
}));
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = req.account.toJSON();
    if (req.user.role === 'company') user.company = await Company.findOne({ user_id: req.user.id }).select('_id name_ar name_en');
    res.json({ success: true, user });
  } catch (error) { next(error); }
});
router.post('/company-account', authenticate, requireRole('admin'), validate(Joi.object({ email: Joi.string().email().trim().lowercase().required(), password: Joi.string().min(8).max(128).required(), full_name: Joi.string().max(200).default('مدير الشركة'), company_id: Joi.string().hex().length(24), expected_version: Joi.number().integer().min(0).strict() })), async (req, res, next) => {
  try {
    const company = req.body.company_id ? await Company.findById(req.body.company_id) : null;
    if (req.body.company_id && (!company || !company.is_active)) return res.status(404).json({ message: 'الشركة غير موجودة أو معطلة' });
    if (company?.user_id) return res.status(409).json({ message: 'الشركة مرتبطة بحساب بالفعل' });
    const expected = req.body.expected_version ?? company?.__v ?? 0;
    if (company && expected !== (company.__v || 0)) return res.status(409).json({ message: 'تغيّرت بيانات الشركة. أعد تحميلها قبل إنشاء الحساب.' });
    const user = await User.create({ email: req.body.email, password: req.body.password, name: req.body.full_name, role: 'company', isVerified: true, is_verified: true });
    if (company) {
      try {
        const linked = await Company.findOneAndUpdate({ _id: company._id, user_id: null, is_active: true, ...companyVersion(expected) }, history.append({ $set: { user_id: user._id }, $inc: { __v: 1 } }, history.entry(req, 'company.link_account', expected + 1, ['user_id'], history.companyState(company), { ...history.companyState(company), account_linked: true })), { runValidators: true });
        if (!linked) { await User.deleteOne({ _id: user._id }); return res.status(409).json({ message: 'الشركة مرتبطة بحساب بالفعل' }); }
      } catch (error) { await User.deleteOne({ _id: user._id }); throw error; }
    }
    res.set('Cache-Control', 'no-store').status(201).json({ success: true, user: user.toJSON(), company_id: company ? String(company._id) : null, version: company ? expected + 1 : null });
  } catch (error) { next(error); }
});
router.put('/change-password', authenticate, passwordLimit, validate(Joi.object({
  current_password: Joi.string().max(128).required(),
  new_password: newPassword.required(),
})), async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password +password_hash');
    if (!user || !user.is_active) return res.status(401).json({ message: 'الحساب غير متاح' });
    if (user.provider !== 'local') return res.status(403).json({ message: 'تُدار كلمة مرور هذا الحساب لدى مزود تسجيل الدخول' });
    if (!(await user.matchPassword(req.body.current_password))) return res.status(401).json({ message: 'كلمة المرور الحالية غير صحيحة' });
    if (await user.matchPassword(req.body.new_password)) return res.status(400).json({ message: 'اختر كلمة مرور مختلفة عن الحالية' });
    const version = user.token_version || 0;
    const password = await bcrypt.hash(req.body.new_password, 12);
    // Compare and update atomically: concurrent changes cannot both reuse the old password.
    const updated = await User.findOneAndUpdate({ _id: user._id, is_active: true, ...versionQuery(version) }, { $set: { password, token_version: version + 1 }, $unset: { password_hash: 1 } }, { new: true, runValidators: true });
    if (!updated) return res.status(409).json({ message: 'تغيرت بيانات الحساب أثناء الطلب؛ سجل الدخول مجددًا' });
    res.set('Cache-Control', 'no-store').json({ success: true, message: 'تم تغيير كلمة المرور وإنهاء الجلسات السابقة', token: signToken(updated), user: updated.toJSON() });
  } catch (error) { next(error); }
});
router.post('/logout', authenticate, (_req, res) => res.json({ success: true }));
module.exports = router;
