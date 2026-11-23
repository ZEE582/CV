/**
 * @file controllers/savedJobsController.js
 * @description منطق حفظ الوظائف المفضلة
 *
 * الصلاحيات: seeker | company | admin (مسجّل دخول)
 */
const SavedJob = require('../models/SavedJob');
const Job      = require('../models/Job');

// ── حفظ وظيفة ────────────────────────────────────────────────
exports.save = async (req, res, next) => {
  try {
    const { job_id } = req.body;

    const job = await Job.findOne({ _id: job_id, is_active: true });
    if (!job)
      return res.status(404).json({ success: false, message: 'الوظيفة غير موجودة', code: 'JOB_NOT_FOUND' });

    const exists = await SavedJob.findOne({ user_id: req.user.id, job_id });
    if (exists)
      return res.status(409).json({ success: false, message: 'الوظيفة محفوظة مسبقاً', code: 'ALREADY_SAVED' });

    await SavedJob.create({ user_id: req.user.id, job_id });
    res.status(201).json({ success: true, message: 'تم حفظ الوظيفة' });
  } catch (err) { next(err); }
};

// ── الوظائف المحفوظة ──────────────────────────────────────────
exports.getMySaved = async (req, res, next) => {
  try {
    const saved = await SavedJob.find({ user_id: req.user.id })
      .sort({ createdAt: -1 })
      .populate({
        path:     'job_id',
        match:    { is_active: true },
        populate: { path: 'company_id', select: 'name_ar color logo_url is_verified' }
      })
      .lean();

    // إزالة الوظائف المحذوفة أو المعطلة
    const valid = saved.filter(s => s.job_id !== null);

    res.json({ success: true, total: valid.length, saved_jobs: valid });
  } catch (err) { next(err); }
};

// ── إزالة وظيفة محفوظة ───────────────────────────────────────
exports.unsave = async (req, res, next) => {
  try {
    const result = await SavedJob.findOneAndDelete({ job_id: req.params.jobId, user_id: req.user.id });
    if (!result)
      return res.status(404).json({ success: false, message: 'الوظيفة غير محفوظة', code: 'NOT_SAVED' });

    res.json({ success: true, message: 'تم إزالة الوظيفة من المحفوظات' });
  } catch (err) { next(err); }
};
