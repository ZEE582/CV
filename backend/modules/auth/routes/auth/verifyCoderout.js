const express = require('express');
const Joi = require('joi');
const User = require('../../models/usermodel');
const { validate } = require('../../../../middleware/validate');
const { signToken, versionQuery } = require('../../../../config/jwtConfig');
const { consumeChallenge, COOKIE, cookieOptions } = require('../../services/challenges');
const router = express.Router();
router.post('/verify-code', validate(Joi.object({ email: Joi.string().email().trim().lowercase().required(), code: Joi.string().pattern(/^\d{5}$/).required() })), async (req, res, next) => {
  try {
    const challenge = await consumeChallenge(req);
    if (!challenge) return res.status(400).json({ message: 'الكود غير صحيح أو انتهت صلاحيته؛ ابدأ تسجيل الدخول مجددًا عند تجاوز المحاولات' });
    const user = await User.findOneAndUpdate({ _id: challenge.user_id, is_active: true, ...versionQuery(challenge.token_version || 0) }, { $set: { isVerified: true, is_verified: true } }, { new: true });
    if (!user) return res.status(401).json({ message: 'الحساب غير متاح' });
    const { maxAge: _maxAge, ...options } = cookieOptions();
    res.clearCookie(COOKIE, options);
    res.json({ message: 'تم التحقق', token: signToken(user), user: user.toJSON() });
  } catch (error) { next(error); }
});
module.exports = router;
