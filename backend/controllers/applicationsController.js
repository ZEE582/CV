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
const { isValidObjectId } = require('mongoose');
const Job         = require('../models/Job');
const Company     = require('../models/Company');
const User = require('../models/User');
const { literalSearch } = require('../services/publicJobs');
const { captureJobSnapshot, savedJobSnapshot, jobDetails } = require('../services/applicationJobSnapshot');
const { initialHistory, statusUpdate, historyResponse } = require('../services/applicationHistory');
const { applicationReport } = require('../services/applicationReport');
const versionWhere = version => version === 0 ? { $or: [{ __v: 0 }, { __v: { $exists: false } }] } : { __v: version };

// ── التقديم على وظيفة ─────────────────────────────────────────
exports.apply = async (req, res, next) => {
  try {
    const { job_id, cover_letter, cv_url } = req.body;
    if (req.cvAttachment && cv_url) return res.status(400).json({ success: false, code: 'CV_SOURCE_CONFLICT', message: 'اختر ملف السيرة أو رابطها، ولا ترسلهما معًا.' });

    const job = await Job.findOne({ _id: job_id, is_active: true });
    if (!job)
      return res.status(404).json({ success: false, message: 'الوظيفة غير موجودة أو مغلقة', code: 'JOB_NOT_FOUND' });
    if (job.deadline && job.deadline < new Date())
      return res.status(400).json({ success: false, message: 'انتهى موعد التقديم لهذه الوظيفة', code: 'JOB_EXPIRED' });
    const company = await Company.findOne({ _id: job.company_id, is_active: true }).select('name_ar');
    if (!company)
      return res.status(404).json({ success: false, message: 'الشركة غير متاحة', code: 'COMPANY_NOT_FOUND' });

    const exists = await Application.findOne({ job_id, user_id: req.user.id });
    if (exists)
      return res.status(409).json({ success: false, message: 'لقد تقدمت لهذه الوظيفة مسبقاً', code: 'ALREADY_APPLIED' });

    const submittedAt = new Date();
    const app = await Application.create({
      job_id,
      user_id:    req.user.id,
      company_id: job.company_id,
      cover_letter,
      cv_url,
      ...(req.cvAttachment ? { cv_file: req.cvAttachment.meta, cv_file_data: req.cvAttachment.data } : {}),
      job_snapshot: captureJobSnapshot(job, company, submittedAt),
      createdAt: submittedAt,
      ...initialHistory(req.user.id, submittedAt)
    });

    // رفع عداد التقديمات
    Job.findByIdAndUpdate(job_id, { $inc: { applications_count: 1 } }).catch(() => {});

    res.status(201).json({ success: true, message: 'تم إرسال طلبك بنجاح', application_id: app._id, ...(app.cv_file ? { cv_file: { name: app.cv_file.name, size: app.cv_file.size } } : {}) });
  } catch (err) { next(err); }
};

exports.downloadCv = async (req, res, next) => {
  try {
    const scope = { _id: req.params.id };
    if (req.user.role === 'seeker') scope.user_id = req.user.id;
    if (req.user.role === 'company') {
      const owned = await Company.find({ user_id: req.user.id }).select('_id').lean();
      scope.company_id = { $in: owned.map(company => company._id) };
    }
    const application = await Application.findOne(scope).select('cv_file +cv_file_data');
    if (!application?.cv_file || !application.cv_file_data) return res.status(404).json({ success: false, message: 'ملف السيرة غير متاح لهذا الطلب.' });
    const data = Buffer.from(application.cv_file_data);
    if (data.length !== application.cv_file.size) return res.status(503).json({ success: false, message: 'تعذر قراءة ملف السيرة. حاول لاحقًا.' });
    res.set({ 'Cache-Control': 'private, no-store', 'Content-Type': 'application/pdf', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "sandbox; default-src 'none'", 'Content-Length': String(data.length) });
    res.attachment(application.cv_file.name).send(data);
  } catch (error) { next(error); }
};

// ── تقديماتي (seeker) ─────────────────────────────────────────
exports.getMyApplications = async (req, res, next) => {
  try {
    const apps = await Application.find({ user_id: req.user.id }).select('+job_snapshot')
      .sort({ createdAt: -1 })
      .lean();
    const summaries = new Map(apps.map(application => { const saved = savedJobSnapshot(application); return [String(application._id), saved ? { has_job_snapshot: true, snapshot_title: saved.job.title, snapshot_company_name: saved.company.name_ar } : { has_job_snapshot: false }]; }));
    await Application.populate(apps, [{ path: 'job_id', select: 'title field job_type is_active' }, { path: 'company_id', select: 'name_ar logo_url color' }]);
    const applications = apps.map(({ job_snapshot: _snapshot, ...application }) => ({ ...application, ...summaries.get(String(application._id)) }));
    res.json({ success: true, total: applications.length, applications });
  } catch (err) { next(err); }
};

exports.getMyReport = async (req, res, next) => {
  try {
    const application = await Application.findOne({ _id: req.params.id, user_id: req.user.id })
      .select('job_id company_id status __v createdAt cover_letter cv_url cv_file +job_snapshot +status_history +status_history_count +history_from_submission +history_started_at').lean();
    if (!application) return res.status(404).json({ success: false, code: 'APPLICATION_NOT_FOUND', message: 'الطلب غير موجود.' });
    const saved = savedJobSnapshot(application);
    const [job, company] = saved ? [null, null] : await Promise.all([
      isValidObjectId(application.job_id) && isValidObjectId(application.company_id) ? Job.findOne({ _id: application.job_id, company_id: application.company_id }).select('title').lean() : null,
      isValidObjectId(application.company_id) ? Company.findById(application.company_id).select('name_ar').lean() : null,
    ]);
    const report = applicationReport(application, { job_title: job?.title, company_name: company?.name_ar });
    if (!report) return res.status(503).json({ success: false, code: 'APPLICATION_REPORT_UNAVAILABLE', message: 'تعذر تجهيز نسخة الطلب. حدّث الطلبات وحاول مجددًا.' });
    res.json(report);
  } catch (error) { next(error); }
};

exports.getMyHistory = async (req, res, next) => {
  try {
    const application = await Application.findOne({ _id: req.params.id, user_id: req.user.id }).select('status createdAt __v +status_history +status_history_count +history_from_submission +history_started_at').lean();
    if (!application) return res.status(404).json({ success: false, code: 'APPLICATION_NOT_FOUND', message: 'الطلب غير موجود.' });
    const response = historyResponse(application);
    if (!response) return res.status(503).json({ success: false, code: 'APPLICATION_HISTORY_UNAVAILABLE', message: 'تعذر قراءة سجل الطلب. حدّث الصفحة وحاول مجددًا.' });
    res.json(response);
  } catch (error) { next(error); }
};

// Owner-only current details plus the server-captured advertisement, where available.
exports.getMyJobDetails = async (req, res, next) => {
  try {
    const application = await Application.findOne({ _id: req.params.id, user_id: req.user.id }).select('job_id company_id +job_snapshot').lean();
    if (!application) return res.status(404).json({ success: false, code: 'APPLICATION_NOT_FOUND', message: 'الطلب غير موجود.' });
    if (!isValidObjectId(application.job_id) || !isValidObjectId(application.company_id)) return res.status(404).json({ success: false, code: 'JOB_NOT_FOUND', message: 'تفاصيل الوظيفة غير متاحة.' });
    const [job, company] = await Promise.all([
      Job.findOne({ _id: application.job_id, company_id: application.company_id }).select('title description requirements benefits location region field job_type experience_level salary_min salary_max salary_currency salary_visible deadline is_active company_id').lean(),
      Company.findById(application.company_id).select('name_ar is_active').lean(),
    ]);
    res.json({ success: true, application_id: String(application._id), job_id: String(application.job_id), company_id: String(application.company_id), snapshot: savedJobSnapshot(application),
      company: company ? { _id: String(company._id), name_ar: company.name_ar, is_active: company.is_active === true } : null,
      job: job ? jobDetails(job) : null,
    });
  } catch (error) { next(error); }
};

// ── تقديمات وظيفة (company | admin) ──────────────────────────
exports.getJobApplications = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job)
      return res.status(404).json({ success: false, message: 'الوظيفة غير موجودة', code: 'JOB_NOT_FOUND' });

    if (req.user.role === 'company') {
      const co = await Company.exists({ _id: job.company_id, user_id: req.user.id });
      if (!co)
        return res.status(403).json({ success: false, message: 'ليس لديك صلاحية', code: 'NOT_JOB_OWNER' });
    }

    const { search, status, sort, page, limit } = req.applicantsQuery;
    const scope = { job_id: job._id, company_id: job.company_id };
    const filter = { ...scope };
    if (status) filter.status = status;
    if (search) {
      const expression = literalSearch(search);
      const users = await User.find({ $or: [{ name: { $regex: expression, $options: 'i' } }, { email: { $regex: expression, $options: 'i' } }] }).select('_id').lean();
      filter.user_id = { $in: users.map(user => user._id) };
    }
    const [total, groups] = await Promise.all([Application.countDocuments(filter), Application.aggregate([{ $match: scope }, { $group: { _id: '$status', count: { $sum: 1 } } }])]);
    const counts = { pending: 0, viewed: 0, shortlisted: 0, rejected: 0, hired: 0 };
    for (const item of groups) if (Object.hasOwn(counts, item._id)) counts[item._id] = item.count;
    const pages = Math.max(1, Math.ceil(total / limit)); const pageNumber = Math.min(page, pages); const direction = sort === 'oldest' ? 1 : -1;
    const apps = await Application.find(filter).sort({ createdAt: direction, _id: direction }).skip((pageNumber - 1) * limit).limit(limit).populate('user_id', 'name email phone').lean();
    res.json({ success: true, job_id: String(job._id), company_id: String(job.company_id), total, page: pageNumber, limit, pages, counts, applications: apps });
  } catch (err) { next(err); }
};

// ── تحديث حالة التقديم (company | admin) ─────────────────────
exports.updateStatus = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id).select('+history_from_submission +history_started_at').populate('job_id');
    if (!application)
      return res.status(404).json({ success: false, message: 'الطلب غير موجود', code: 'APPLICATION_NOT_FOUND' });

    if (req.user.role === 'company') {
      const co = await Company.exists({ _id: application.company_id, user_id: req.user.id });
      if (!co)
        return res.status(403).json({ success: false, message: 'ليس لديك صلاحية', code: 'NOT_COMPANY_OWNER' });
    }

    const job = application.job_id;
    if (!job) return res.status(404).json({ success: false, code: 'JOB_NOT_FOUND', message: 'الوظيفة لم تعد متاحة للمراجعة.' });
    if (String(job.company_id) !== String(application.company_id) || (req.body.job_id && req.body.job_id !== String(job._id)) || (req.body.company_id && req.body.company_id !== String(application.company_id))) return res.status(409).json({ success: false, code: 'APPLICATION_SCOPE_CHANGED', message: 'لا يتطابق الطلب مع الشركة والوظيفة المحددتين. حدّث القائمة.' });
    const expected = req.body.expected_version ?? application.__v ?? 0;
    if (expected !== (application.__v ?? 0)) return res.status(409).json({ success: false, code: 'APPLICATION_CHANGED', message: 'تغيّر الطلب. حدّث القائمة قبل تغيير حالته.' });
    const updated = await Application.findOneAndUpdate({ _id: application._id, job_id: job._id, company_id: application.company_id, status: application.status, ...versionWhere(expected) }, statusUpdate(application, req.body.status, req.user), { new: true, runValidators: true });
    if (!updated) return res.status(409).json({ success: false, code: 'APPLICATION_CHANGED', message: 'تغيّر الطلب أو سُحب منذ فتحه. حدّث القائمة وراجع أحدث حالته.' });
    res.json({ success: true, message: 'تم تحديث حالة الطلب', status: updated.status, application_id: String(updated._id), job_id: String(updated.job_id), company_id: String(updated.company_id), version: updated.__v, updatedAt: updated.updatedAt });
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

    const removed = await Application.findOneAndDelete({ _id: application._id, user_id: req.user.id, status: 'pending', ...versionWhere(req.body.expected_version ?? application.__v ?? 0) });
    if (!removed) return res.status(409).json({ success: false, message: 'تغيّرت حالة الطلب، حدّث الصفحة وحاول مجددًا', code: 'APPLICATION_CHANGED' });
    Job.updateOne({ _id: application.job_id, applications_count: { $gt: 0 } }, { $inc: { applications_count: -1 } }).catch(() => {});

    res.json({ success: true, message: 'تم سحب الطلب بنجاح', application_id: String(removed._id) });
  } catch (err) { next(err); }
};
