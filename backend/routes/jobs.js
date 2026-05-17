/**
 * @file routes/jobs.js
 * @description مسارات الوظائف
 */
const express = require('express');
const Job     = require('../models/Job');
const Company = require('../models/Company');
const { authenticate, requireRole, optionalAuth } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

const router = express.Router();

// GET /api/jobs
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { field, region, type, exp, search, sort = 'newest', page = 1, limit = 50 } = req.query;

    const filter = { is_active: true };
    if (field)  filter.field = field;
    if (region) filter.region = region;
    if (type)   filter.job_type = type;
    if (exp)    filter.experience_level = exp;
    if (search) filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { field: { $regex: search, $options: 'i' } }
    ];

    const sortMap = { newest: { createdAt: -1 }, featured: { is_featured: -1, createdAt: -1 }, salary: { salary_max: -1 } };
    const sortOpt = sortMap[sort] || { createdAt: -1 };

    const pageNum  = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit) || 50));
    const skip     = (pageNum - 1) * limitNum;

    const [total, jobs] = await Promise.all([
      Job.countDocuments(filter),
      Job.find(filter)
        .sort(sortOpt)
        .skip(skip)
        .limit(limitNum)
        .populate('company_id', 'name_ar name_en color is_verified logo_url')
        .lean()
    ]);

    // إعادة تسمية company_id → company لسهولة الاستخدام في الفرونتإند
    const formatted = jobs.map(j => ({
      ...j,
      company_name: j.company_id?.name_ar,
      company_name_en: j.company_id?.name_en,
      color: j.company_id?.color,
      company_verified: j.company_id?.is_verified,
      logo_url: j.company_id?.logo_url,
      company_id: j.company_id?._id
    }));

    res.json({ success: true, total, jobs: formatted });
  } catch (err) { next(err); }
});

// GET /api/jobs/:id
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, is_active: true })
      .populate('company_id', 'name_ar name_en color is_verified website email about_ar sector size location')
      .lean();

    if (!job) return res.status(404).json({ success: false, message: 'الوظيفة غير موجودة أو غير متاحة', code: 'JOB_NOT_FOUND' });

    Job.findByIdAndUpdate(req.params.id, { $inc: { views_count: 1 } }).catch(() => {});

    res.json({ success: true, job });
  } catch (err) { next(err); }
});

// POST /api/jobs
router.post('/', authenticate, requireRole('company', 'admin'), validate(schemas.job), async (req, res, next) => {
  try {
    let coId = req.body.company_id;
    if (req.user.role === 'company') {
      const co = await Company.findOne({ user_id: req.user.id });
      if (!co) return res.status(403).json({ success: false, message: 'لا توجد شركة مرتبطة بحسابك', code: 'NO_COMPANY_LINKED' });
      coId = co._id;
    }
    if (!coId) return res.status(400).json({ success: false, message: 'معرف الشركة مطلوب', code: 'COMPANY_ID_REQUIRED' });

    await Job.create({ ...req.body, company_id: coId });
    res.status(201).json({ success: true, message: 'تم نشر الوظيفة بنجاح وستظهر للباحثين فوراً' });
  } catch (err) { next(err); }
});

// PUT /api/jobs/:id
router.put('/:id', authenticate, requireRole('company', 'admin'), validate(schemas.job), async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'الوظيفة غير موجودة', code: 'JOB_NOT_FOUND' });

    if (req.user.role === 'company') {
      const co = await Company.findOne({ user_id: req.user.id });
      if (!co || !co._id.equals(job.company_id))
        return res.status(403).json({ success: false, message: 'ليس لديك صلاحية تعديل هذه الوظيفة', code: 'NOT_JOB_OWNER' });
    }

    await Job.findByIdAndUpdate(req.params.id, req.body);
    res.json({ success: true, message: 'تم تعديل الوظيفة بنجاح' });
  } catch (err) { next(err); }
});

// DELETE /api/jobs/:id
router.delete('/:id', authenticate, requireRole('company', 'admin'), async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'الوظيفة غير موجودة', code: 'JOB_NOT_FOUND' });

    if (req.user.role === 'company') {
      const co = await Company.findOne({ user_id: req.user.id });
      if (!co || !co._id.equals(job.company_id))
        return res.status(403).json({ success: false, message: 'ليس لديك صلاحية حذف هذه الوظيفة', code: 'NOT_JOB_OWNER' });
    }

    await Job.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'تم حذف الوظيفة بنجاح' });
  } catch (err) { next(err); }
});

module.exports = router;
