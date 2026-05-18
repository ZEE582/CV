/**
 * @file controllers/applicationsController.js
 * @description منطق التقديم على الوظائف
 *
 * الصلاحيات:
 *  apply       → seeker فقط
 *  getMyApps   → seeker (تقديماته)
 *  getJobApps  → company (مالكة الوظيفة) | admin
 *  updateStatus→ company (مالكة الوظيفة) | admin
 *  withdraw    → seeker (يسحب تقديمه)
 */
const Application = require('../models/Application');
const Job         = require('../models/Job');
const Company     = require('../models/Company');

// ── التقديم على وظيفة ─────────────────────────────────────────
exports.apply = async (req, res, next) => {
  try {
    const { job_id, cover_letter, cv_url } = req.body;

    const job = await Job.findOne({ _id: job_id, is_active: true });
    if (!job)
      return res.status(404).json({ success: false, message: 'الوظيفة غير موجودة أو مغلقة', code: 'JOB_NOT_FOUND' });

    const exists = await Application.findOne({ job_id, user_id: req.user.id });
    if (exists)
      return res.status(409).json({ success: false, message: 'لقد تقدمت لهذه الوظيفة مسبقاً', code: 'ALREADY_APPLIED' });

    const app = await Application.create({
      job_id,
      user_id:    req.user.id,
      company_id: job.company_id,
      cover_letter,
      cv_url
    });

    // رفع عداد التقديمات
    Job.findByIdAndUpdate(job_id, { $inc: { applications_count: 1 } }).catch(() => {});

    res.status(201).json({ success: true, message: 'تم إرسال طلبك بنجاح', application_id: app._id });
  } catch (err) { next(err); }
};

// ── تقديماتي (seeker) ─────────────────────────────────────────
exports.getMyApplications = async (req, res, next) => {
  try {
    const apps = await Application.find({ user_id: req.user.id })
      .sort({ createdAt: -1 })
      .populate('job_id', 'title field job_type is_active')
      .populate('company_id', 'name_ar logo_url color')
      .lean();

    res.json({ success: true, total: apps.length, applications: apps });
  } catch (err) { next(err); }
};

// ── تقديمات وظيفة (company | admin) ──────────────────────────
exports.getJobApplications = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job)
      return res.status(404).json({ success: false, message: 'الوظيفة غير موجودة', code: 'JOB_NOT_FOUND' });

    if (req.user.role === 'company') {
      const co = await Company.findOne({ user_id: req.user.id });
      if (!co || !co._id.equals(job.company_id))
        return res.status(403).json({ success: false, message: 'ليس لديك صلاحية', code: 'NOT_JOB_OWNER' });
    }

    const apps = await Application.find({ job_id: req.params.jobId })
      .sort({ createdAt: -1 })
      .populate('user_id', 'full_name email phone avatar_url')
      .lean();

    res.json({ success: true, total: apps.length, applications: apps });
  } catch (err) { next(err); }
};

// ── تحديث حالة التقديم (company | admin) ─────────────────────
exports.updateStatus = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id).populate('job_id');
    if (!application)
      return res.status(404).json({ success: false, message: 'الطلب غير موجود', code: 'APPLICATION_NOT_FOUND' });

    if (req.user.role === 'company') {
      const co = await Company.findOne({ user_id: req.user.id });
      if (!co || !co._id.equals(application.company_id))
        return res.status(403).json({ success: false, message: 'ليس لديك صلاحية', code: 'NOT_COMPANY_OWNER' });
    }

    application.status = req.body.status;
    await application.save();

    res.json({ success: true, message: 'تم تحديث حالة الطلب', status: application.status });
  } catch (err) { next(err); }
};

// ── سحب التقديم (seeker) ─────────────────────────────────────
exports.withdraw = async (req, res, next) => {
  try {
    const application = await Application.findOne({ _id: req.params.id, user_id: req.user.id });
    if (!application)
      return res.status(404).json({ success: false, message: 'الطلب غير موجود', code: 'APPLICATION_NOT_FOUND' });

    if (application.status !== 'pending')
      return res.status(400).json({ success: false, message: 'لا يمكن سحب طلب تمت مراجعته', code: 'CANNOT_WITHDRAW' });

    await Application.findByIdAndDelete(req.params.id);
    Job.findByIdAndUpdate(application.job_id, { $inc: { applications_count: -1 } }).catch(() => {});

    res.json({ success: true, message: 'تم سحب الطلب بنجاح' });
  } catch (err) { next(err); }
};
