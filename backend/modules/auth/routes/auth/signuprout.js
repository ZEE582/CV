const express = require('express');
const Joi = require('joi');
const User = require('../../models/usermodel');
const { validate } = require('../../../../middleware/validate');
const { issueChallenge } = require('../../services/challenges');
const { ensureEmailConfigured } = require('../../services/email/emailService');
const router = express.Router();
const schema = Joi.object({ email: Joi.string().email().lowercase().trim().required(), password: Joi.string().min(8).max(128).required(), full_name: Joi.string().trim().min(2).max(200), phone: Joi.string().max(40).allow('') });
router.post(['/signup', '/register'], validate(schema), async (req, res, next) => {
  try {
    ensureEmailConfigured();
    if (await User.exists({ email: req.body.email })) return res.status(409).json({ message: 'البريد الإلكتروني مستخدم بالفعل' });
    const user = await User.create({ email: req.body.email, password: req.body.password, name: req.body.full_name || '', phone: req.body.phone || '', role: 'seeker' });
    await issueChallenge(user, res);
    res.status(201).json({ message: 'تم إنشاء الحساب وإرسال كود التحقق', requiresVerification: true, email: user.email });
  } catch (error) { next(error); }
});
module.exports = router;
