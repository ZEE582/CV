/**
 * @file controllers/cvController.js
 * @description منطق صفحة CV Builder
 *
 * الصلاحيات:
 *  create / getAll / getOne / remove → seeker | company | admin (مسجّل دخول)
 *  CV مخزّن لكل مستخدم بشكل خاص
 */

const CV = require('../models/CV');

// ── إنشاء / حفظ CV ────────────────────────────────────────────
exports.save = async (req, res, next) => {
  try {
    const { template, personal_info, education, experience, skills, languages, summary } = req.body;

    // إن وُجد CV للمستخدم → حدّثه، وإلا → أنشئه
    const cv = await CV.findOneAndUpdate(
      { user_id: req.user.id },
      { template, personal_info, education, experience, skills, languages, summary, user_id: req.user.id },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, message: 'تم حفظ السيرة الذاتية بنجاح', cv_id: cv._id });
  } catch (err) { next(err); }
};

// ── جلب CV المستخدم الحالي ────────────────────────────────────
exports.getMy = async (req, res, next) => {
  try {
    const cv = await CV.findOne({ user_id: req.user.id }).lean();
    if (!cv)
      return res.status(404).json({ success: false, message: 'لم تقم بإنشاء سيرة ذاتية بعد', code: 'CV_NOT_FOUND' });

    res.json({ success: true, cv });
  } catch (err) { next(err); }
};

// ── حذف CV ────────────────────────────────────────────────────
exports.remove = async (req, res, next) => {
  try {
    const cv = await CV.findOne({ user_id: req.user.id });
    if (!cv)
      return res.status(404).json({ success: false, message: 'السيرة الذاتية غير موجودة', code: 'CV_NOT_FOUND' });

    await CV.findByIdAndDelete(cv._id);
    res.json({ success: true, message: 'تم حذف السيرة الذاتية' });
  } catch (err) { next(err); }
};
