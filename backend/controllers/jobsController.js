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

// ── قائمة الوظائف مع فلترة وصفحات ───────────────────────────
exports.getAll = async (req, res, next) => {
  try {
    const {
      field, region, type, exp, search,
      sort = 'newest', page = 1, limit = 50
    } = req.query;

    const filter = { is_active: true };
    if (field)  filter.field = field;
    if (region) filter.region = region;
    if (type)   filter.job_type = type;
    if (exp)    filter.experience_level = exp;
    if (search) filter.$or = [
      { title:       { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { field:       { $regex: search, $options: 'i' } }
    ];

    const sortMap = {
      newest:   { createdAt: -1 },
      featured: { is_featured: -1, createdAt: -1 },
      salary:   { salary_max: -1 }
    };

    const pageNum  = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit) || 50));

    const [total, jobs] = await Promise.all([
      Job.countDocuments(filter),
      Job.find(filter)
        .sort(sortMap[sort] || { createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .populate('company_id', 'name_ar name_en color is_verified logo_url')
        .lean()
    ]);

    const formatted = jobs.map(j => ({
      ...j,
      company_name:     j.company_id?.name_ar,
      company_name_en:  j.company_id?.name_en,
      color:            j.company_id?.color,
      company_verified: j.company_id?.is_verified,
      logo_url:         j.company_id?.logo_url,
      company_id:       j.company_id?._id
    }));

    res.json({ success: true, total, page: pageNum, limit: limitNum, jobs: formatted });
  } catch (err) { next(err); }
};

// ── تفاصيل وظيفة واحدة ───────────────────────────────────────
exports.getOne = async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, is_active: true })
      .populate('company_id', 'name_ar name_en color is_verified website email about_ar sector size location logo_url')
      .lean();

    if (!job)
      return res.status(404).json({ success: false, message: 'الوظيفة غير موجودة أو غير متاحة', code: 'JOB_NOT_FOUND' });

    Job.findByIdAndUpdate(req.params.id, { $inc: { views_count: 1 } }).catch(() => {});
    res.json({ success: true, job });
  } catch (err) { next(err); }
};

// ── وظائف شركتي (للشركة فقط) ─────────────────────────────────
exports.getMyJobs = async (req, res, next) => {
  try {
    const co = await Company.findOne({ user_id: req.user.id });
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

    const job = await Job.create({ ...req.body, company_id: coId });
    res.status(201).json({ success: true, message: 'تم نشر الوظيفة بنجاح', job_id: job._id });
  } catch (err) { next(err); }
};

// ── تعديل وظيفة ──────────────────────────────────────────────
exports.update = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job)
      return res.status(404).json({ success: false, message: 'الوظيفة غير موجودة', code: 'JOB_NOT_FOUND' });

    if (req.user.role === 'company') {
      const co = await Company.findOne({ user_id: req.user.id });
      if (!co || !co._id.equals(job.company_id))
        return res.status(403).json({ success: false, message: 'ليس لديك صلاحية تعديل هذه الوظيفة', code: 'NOT_JOB_OWNER' });
    }

    await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, message: 'تم تعديل الوظيفة بنجاح' });
  } catch (err) { next(err); }
};

// ── حذف وظيفة ────────────────────────────────────────────────
exports.remove = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job)
      return res.status(404).json({ success: false, message: 'الوظيفة غير موجودة', code: 'JOB_NOT_FOUND' });

    if (req.user.role === 'company') {
      const co = await Company.findOne({ user_id: req.user.id });
      if (!co || !co._id.equals(job.company_id))
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
      const co = await Company.findOne({ user_id: req.user.id });
      if (!co || !co._id.equals(job.company_id))
        return res.status(403).json({ success: false, message: 'ليس لديك صلاحية', code: 'NOT_JOB_OWNER' });
    }

    job.is_active = !job.is_active;
    await job.save();

    res.json({
      success: true,
      message: job.is_active ? 'تم تفعيل الوظيفة' : 'تم إيقاف الوظيفة',
      is_active: job.is_active
    });
  } catch (err) { next(err); }
};
