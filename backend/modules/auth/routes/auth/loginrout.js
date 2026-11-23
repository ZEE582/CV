const express = require('express');
const Joi = require('joi');
const User = require('../../models/usermodel');
const { validate } = require('../../../../middleware/validate');
const { issueChallenge } = require('../../services/challenges');
const router = express.Router();
router.post('/login', validate(Joi.object({ email: Joi.string().email().lowercase().trim().required(), password: Joi.string().max(128).required() })), async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email }).select('+password +password_hash');
    if (!user || user.provider !== 'local' || !user.is_active || !(await user.matchPassword(req.body.password))) return res.status(401).json({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    await issueChallenge(user, res);
    res.json({ message: 'تم إرسال كود التحقق', requiresVerification: true, email: user.email });
  } catch (error) { next(error); }
});
module.exports = router;
