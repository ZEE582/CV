const express = require('express');
const User = require('../../models/usermodel');
const requireAuth = require('../../middleware/authentication');
const userEvents = require('../../events/userEvents');
const { validate } = require('../../../../middleware/validate');
const { profileSchema } = require('../../../../middleware/profileSchemas');
const router = express.Router();
router.use('/profile', requireAuth, (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
router.get('/profile', (req, res) => res.json({ user: req.account.toJSON() }));
router.put('/profile', validate(profileSchema), async (req, res, next) => {
  try {
    const { name, avatar, phone, onboardingData } = req.body;
    const update = {};
    if (phone !== undefined) update.phone = phone;
    if (avatar !== undefined) { update.avatar = avatar; update.avatar_url = avatar; }
    for (const [key, value] of Object.entries(onboardingData || {})) update['onboardingData.' + key] = value;
    const fullName = name ?? onboardingData?.fullName;
    if (fullName !== undefined) { update.name = fullName; update['onboardingData.fullName'] = fullName; }
    const user = await User.findByIdAndUpdate(req.user.id, { $set: update }, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });
    userEvents.emit('profileUpdated', user);
    res.json({ message: 'تم تحديث الملف الشخصي', user: user.toJSON() });
  } catch (error) { next(error); }
});
module.exports = router;
