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
    const { template, personal_info, education, experience, skills, languages, summary, builder_data, expected_updated_at } = req.body;
    const filter = { user_id: req.user.id };
    const existing = await CV.findOne(filter).select('updatedAt');
    if (Object.hasOwn(req.body, 'expected_updated_at')) {
      const expected = expected_updated_at ? new Date(expected_updated_at).toISOString() : null;
      if ((existing?.updatedAt?.toISOString() || null) !== expected) return res.status(409).json({ success:false, code:'CV_CHANGED', message:'توجد نسخة أحدث من السيرة. استرجعها قبل حفظ تعديلات جديدة.' });
      if (existing) filter.updatedAt = existing.updatedAt;
    }
    const changes = { template, personal_info, education, experience, skills, languages, summary, user_id: req.user.id };
    const update = builder_data ? { $set: { ...changes, builder_data } } : { $set: changes, $unset: { builder_data: 1 } };

    // إن وُجد CV للمستخدم → حدّثه، وإلا → أنشئه
    const cv = await CV.findOneAndUpdate(
      filter,
      update,
      { upsert: !existing, new: true, runValidators: true }
    );

    if (!cv) return res.status(409).json({success:false, code:'CV_CHANGED', message:'تغيّرت النسخة المحفوظة. استرجعها قبل الحفظ.'});
    res.status(200).json({ success: true, message: 'تم حفظ السيرة الذاتية بنجاح', cv_id: cv._id, updatedAt: cv.updatedAt });
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
