const express = require('express');
const User = require('../../models/usermodel');
const requireAuth = require('../../middleware/authentication');
const userEvents = require('../../events/userEvents');
const { validate } = require('../../../../middleware/validate');
const { questionsSchema } = require('../../../../middleware/profileSchemas');
const router = express.Router();
router.post('/questions', requireAuth, validate(questionsSchema), async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.user.id, {
      $set: { hasCompletedQuestions: true, name: req.body.fullName, onboardingData: req.body },
    }, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });
    userEvents.emit('questionsCompleted', user);
    res.set('Cache-Control', 'no-store').json({ message: 'تم حفظ البيانات', user: user.toJSON() });
  } catch (error) { next(error); }
});
module.exports = router;
