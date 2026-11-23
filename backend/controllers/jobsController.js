/**
 * @file controllers/jobsController.js
 * @description منطق الوظائف الموحد — يخدم صفحة الوظائف وصفحة الشركة ولوحة التحكم
 *
 * الصلاحيات:
 *  getAll / getOne → عام (optionalAuth)
 *  create          → company | admin
 *  update          → company (مالك الوظيفة) | admin
 *  remove          → company (مالك الوظيفة) | admin
 *  getMyJobs       → company (وظائف شركتها فقط)
 */

const Job     = require('../models/Job');
const Company = require('../models/Company');
const { publicJob, literalSearch } = require('../services/publicJobs');

const versionWhere = version => version === 0 ? { $or: [{ __v: 0 }, { __v: { $exists: false } }] } : { __v: version };
const conflict = res => res.status(409).json({ success: false, code: 'JOB_CONFLICT', message: 'تغيّرت الوظيفة منذ فتحها. أعد تحميلها وراجع التغييرات قبل الحفظ.' });

// ── قائمة الوظائف مع فلترة وصفحات ───────────────────────────
exports.getAll = async (req, res, next) => {
  try {
    const { field, region, type, exp, search, sort, page, limit, availability, currency } = req.jobQuery;
    const companies = await Company.find({ is_active: true }).select('_id name_ar name_en').lean();
    const filter = { is_active: true, company_id: { $in: companies.map(company => company._id) } };
    if (field) filter.field = field;
    if (region) filter.region = region;
    if (type) filter.job_type = type;
    if (exp) filter.experience_level = exp;
    if (availability === 'open') filter.$and = [{ $or: [{ deadline: null }, { deadline: { $gte: new Date() } }] }];
    if (search) {
      const expression = literalSearch(search); const matcher = new RegExp(expression, 'i');
      const matchingCompanies = companies.filter(company => matcher.test(company.name_ar || '') || matcher.test(company.name_en || '')).map(company => company._id);
      filter.$or = ['title', 'description', 'field', 'location'].map(key => ({ [key]: { $regex: expression, $options: 'i' } }));
      filter.$or.push({ company_id: { $in: matchingCompanies } });
    }
    if (sort === 'salary') {
      filter.salary_visible = { $ne: false }; filter.salary_currency = currency;
      filter.$and = [...(filter.$and || []), { $or: [{ salary_min: { $gt: 0 } }, { salary_max: { $gt: 0 } }] }];
    }
    const total = await Job.countDocuments(filter); const pages = Math.max(1, Math.ceil(total / limit)); const pageNum = Math.min(page, pages);
    const populate = { path: 'company_id', select: 'name_ar name_en color is_verified logo_url' };
    let jobs;
    if (sort === 'salary') {
      jobs = await Job.aggregate([{ $match: filter }, { $addFields: { salary_sort: { $ifNull: ['$salary_max', '$salary_min'] } } }, { $sort: { salary_sort: -1, createdAt: -1, _id: -1 } }, { $skip: (pageNum - 1) * limit }, { $limit: limit }, { $project: { salary_sort: 0 } }]);
      jobs = await Job.populate(jobs, populate);
    } else jobs = await Job.find(filter).sort(sort === 'featured' ? { is_featured: -1, createdAt: -1, _id: -1 } : { createdAt: -1, _id: -1 }).skip((pageNum - 1) * limit).limit(limit).populate(populate).lean();
    const formatted = jobs.map(job => publicJob({ ...job, company_name: job.company_id?.name_ar, company_name_en: job.company_id?.name_en,
      color: job.company_id?.color, company_verified: job.company_id?.is_verified, logo_url: job.company_id?.logo_url, company_id: job.company_id?._id }));
    res.json({ success: true, total, page: pageNum, limit, pages, jobs: formatted });
  } catch (error) { next(error); }
};

// ── تفاصيل وظيفة واحدة ───────────────────────────────────────
exports.getOne = async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, is_active: true })
      .populate('company_id', 'name_ar name_en color is_verified website email about_ar sector size location logo_url is_active')
      .lean();

    if (!job || !job.company_id || !job.company_id.is_active)
      return res.status(404).json({ success: false, message: 'الوظيفة غير موجودة أو غير متاحة', code: 'JOB_NOT_FOUND' });

    Job.findByIdAndUpdate(req.params.id, { $inc: { views_count: 1 } }).catch(() => {});
    res.json({ success: true, job: publicJob(job) });
  } catch (err) { next(err); }
};

// ── وظائف شركتي (للشركة فقط) ─────────────────────────────────
exports.getMyJobs = async (req, res, next) => {
  try {
    const co = req.query.company_id
      ? await Company.findOne({ _id: req.query.company_id, ...(req.user.role === 'admin' ? {} : { user_id: req.user.id }) })
      : req.user.role === 'company' ? await Company.findOne({ user_id: req.user.id }) : null;
    if (!co)
      return res.status(404).json({ success: false, message: 'لا توجد شركة مرتبطة بحسابك', code: 'NO_COMPANY_LINKED' });

    const jobs = await Job.find({ company_id: co._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, total: jobs.length, jobs });
  } catch (err) { next(err); }
};

// ── إنشاء وظيفة ──────────────────────────────────────────────
exports.create = async (req, res, next) => {
  try {
    let coId = req.body.company_id;

    if (req.user.role === 'company') {
      const co = await Company.findOne({ user_id: req.user.id });
      if (!co)
        return res.status(403).json({ success: false, message: 'لا توجد شركة مرتبطة بحسابك', code: 'NO_COMPANY_LINKED' });
      coId = co._id;
    }

    if (!coId)
      return res.status(400).json({ success: false, message: 'معرف الشركة مطلوب', code: 'COMPANY_ID_REQUIRED' });
    if (!(await Company.exists({ _id: coId, is_active: true })))
      return res.status(404).json({ success: false, message: 'الشركة غير موجودة أو معطلة', code: 'COMPANY_NOT_FOUND' });

    const { expected_version: _expectedVersion, ...values } = req.body;
    if (values.is_active && values.deadline && new Date(values.deadline).getTime() < Date.now()) return res.status(400).json({ success: false, code: 'JOB_DEADLINE_PAST', message: 'موعد التقديم مضى. اختر موعدًا لاحقًا أو احفظ الوظيفة موقوفة.' });
    const job = await Job.create({ ...values, deadline: values.deadline || null, company_id: coId });
    res.status(201).json({ success: true, message: job.is_active ? 'تم نشر الوظيفة بنجاح' : 'تم حفظ الوظيفة موقوفة', job_id: job._id, version: job.__v });
  } catch (err) { next(err); }
};

// ── تعديل وظيفة ──────────────────────────────────────────────
exports.update = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job)
      return res.status(404).json({ success: false, message: 'الوظيفة غير موجودة', code: 'JOB_NOT_FOUND' });

    if (req.user.role === 'company') {
      const co = await Company.exists({ _id: job.company_id, user_id: req.user.id });
      if (!co)
        return res.status(403).json({ success: false, message: 'ليس لديك صلاحية تعديل هذه الوظيفة', code: 'NOT_JOB_OWNER' });
    }

    const { company_id: _companyId, expected_version, ...changes } = req.body;
    const expected = expected_version ?? job.__v ?? 0;
    if (changes.is_active && changes.deadline && new Date(changes.deadline).getTime() < Date.now() && new Date(changes.deadline).getTime() !== job.deadline?.getTime()) return res.status(400).json({ success: false, code: 'JOB_DEADLINE_PAST', message: 'موعد التقديم مضى. اختر موعدًا لاحقًا أو احفظ الوظيفة موقوفة.' });
    if (Object.hasOwn(changes, 'deadline')) changes.deadline = changes.deadline || null;
    const updated = await Job.findOneAndUpdate({ _id: job._id, ...versionWhere(expected) }, { $set: changes, $inc: { __v: 1 } }, { new: true, runValidators: true });
    if (!updated) return conflict(res);
    res.json({ success: true, message: 'تم تعديل الوظيفة بنجاح', job_id: updated._id, version: updated.__v });
  } catch (err) { next(err); }
};

// ── حذف وظيفة ────────────────────────────────────────────────
exports.remove = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job)
      return res.status(404).json({ success: false, message: 'الوظيفة غير موجودة', code: 'JOB_NOT_FOUND' });

    if (req.user.role === 'company') {
      const co = await Company.exists({ _id: job.company_id, user_id: req.user.id });
      if (!co)
        return res.status(403).json({ success: false, message: 'ليس لديك صلاحية حذف هذه الوظيفة', code: 'NOT_JOB_OWNER' });
    }

    await Job.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'تم حذف الوظيفة بنجاح' });
  } catch (err) { next(err); }
};

// ── تفعيل/تعطيل وظيفة (toggle) ───────────────────────────────
exports.toggleActive = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job)
      return res.status(404).json({ success: false, message: 'الوظيفة غير موجودة', code: 'JOB_NOT_FOUND' });

    if (req.user.role === 'company') {
      const co = await Company.exists({ _id: job.company_id, user_id: req.user.id });
      if (!co)
        return res.status(403).json({ success: false, message: 'ليس لديك صلاحية', code: 'NOT_JOB_OWNER' });
    }

    const expected = req.body.expected_version ?? job.__v ?? 0;
    const desired = req.body.is_active ?? !job.is_active;
    const updated = await Job.findOneAndUpdate({ _id: job._id, ...versionWhere(expected) }, { $set: { is_active: desired }, $inc: { __v: 1 } }, { new: true, runValidators: true });
    if (!updated) return conflict(res);

    res.json({
      success: true,
      message: updated.is_active ? 'تم تفعيل الوظيفة' : 'تم إيقاف الوظيفة',
      is_active: updated.is_active, job_id: updated._id, version: updated.__v
    });
  } catch (err) { next(err); }
};
