/**
 * @file routes/jobs.js
 * @description مسارات الوظائف - CRUD كامل مع فلترة وترتيب وصلاحيات
 *
 * الصلاحيات:
 *   GET    /         - عام (optionalAuth)
 *   GET    /:id      - عام (optionalAuth)
 *   POST   /         - company أو admin
 *   PUT    /:id      - company (وظائف شركته فقط) أو admin (كل الوظائف)
 *   DELETE /:id      - company (وظائف شركته فقط) أو admin (كل الوظائف)
 */

const express  = require('express');
const { query } = require('../config/db');
const { authenticate, requireRole, optionalAuth } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * tags:
 *   name: Jobs
 *   description: إدارة الوظائف
 */

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: جلب قائمة الوظائف مع فلترة وترتيب وصفحات
 *     tags: [Jobs]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: field
 *         schema: { type: string }
 *         description: فلترة بالمجال (تكنولوجيا، صحة، ...)
 *       - in: query
 *         name: region
 *         schema: { type: string, enum: [ضفة, قدس, غزة, '48', remote] }
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *         description: نوع العمل
 *       - in: query
 *         name: exp
 *         schema: { type: string }
 *         description: مستوى الخبرة
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: بحث نصي في العنوان واسم الشركة والمجال
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [newest, featured, salary], default: newest }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50, maximum: 200 }
 *     responses:
 *       200:
 *         description: قائمة الوظائف
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 total:   { type: integer, description: العدد الكلي قبل الصفحات }
 *                 jobs:    { type: array, items: { $ref: '#/components/schemas/Job' } }
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const {
      field, region, type, exp, search,
      sort  = 'newest',
      page  = 1,
      limit = 50
    } = req.query;

    // بناء شرط WHERE ديناميكياً للحماية من SQL Injection
    const where  = ['j.is_active = 1'];
    const params = [];

    if (field)  { where.push('j.field = ?');            params.push(field); }
    if (region) { where.push('j.region = ?');           params.push(region); }
    if (type)   { where.push('j.job_type = ?');         params.push(type); }
    if (exp)    { where.push('j.experience_level = ?'); params.push(exp); }

    // البحث النصي في عدة حقول
    if (search) {
      where.push('(j.title LIKE ? OR c.name_ar LIKE ? OR c.name_en LIKE ? OR j.field LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    // ترتيب الوظائف - whitelist للحماية من injection
    const orderMap = {
      newest:   'j.created_at DESC',
      featured: 'j.is_featured DESC, j.created_at DESC',
      salary:   'j.salary_max DESC'
    };
    const order = orderMap[sort] || 'j.created_at DESC';

    const wsClause  = 'WHERE ' + where.join(' AND ');
    const pageNum   = Math.max(1, parseInt(page));
    const limitNum  = Math.min(200, Math.max(1, parseInt(limit)));
    const offset    = (pageNum - 1) * limitNum;

    // استعلام العدد الكلي للصفحات
    const [[{ total }]] = await query(
      `SELECT COUNT(*) AS total FROM jobs j
       JOIN companies c ON j.company_id = c.id
       ${wsClause}`,
      params
    );

    // الاستعلام الرئيسي مع بيانات الشركة
    const jobs = await query(
      `SELECT j.*,
              c.name_ar   AS company_name,
              c.name_en   AS company_name_en,
              c.color,
              c.is_verified AS company_verified,
              c.logo_url
       FROM jobs j
       JOIN companies c ON j.company_id = c.id
       ${wsClause}
       ORDER BY ${order}
       LIMIT ${limitNum} OFFSET ${offset}`,
      params
    );

    res.json({ success: true, total, jobs });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/jobs/{id}:
 *   get:
 *     summary: جلب تفاصيل وظيفة محددة
 *     tags: [Jobs]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: تفاصيل الوظيفة مع بيانات الشركة
 *       404:
 *         description: الوظيفة غير موجودة
 */
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT j.*,
              c.name_ar   AS company_name,
              c.name_en   AS company_name_en,
              c.color,
              c.is_verified AS company_verified,
              c.website,
              c.email     AS company_email,
              c.about_ar  AS company_about,
              c.sector,
              c.size,
              c.location  AS company_location
       FROM jobs j
       JOIN companies c ON j.company_id = c.id
       WHERE j.id = ? AND j.is_active = 1`,
      [req.params.id]
    );

    if (!rows[0]) {
      return res.status(404).json({
        success: false,
        message: 'الوظيفة غير موجودة أو غير متاحة',
        code: 'JOB_NOT_FOUND'
      });
    }

    // زيادة عداد المشاهدات بشكل غير متزامن (لا نحتاج انتظار النتيجة)
    query('UPDATE jobs SET views_count = views_count + 1 WHERE id = ?', [req.params.id])
      .catch(err => console.warn('Views count update failed:', err.message));

    res.json({ success: true, job: rows[0] });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/jobs:
 *   post:
 *     summary: نشر وظيفة جديدة
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description]
 *             properties:
 *               title:            { type: string, example: مطور Full Stack }
 *               description:      { type: string }
 *               requirements:     { type: array, items: { type: string } }
 *               benefits:         { type: array, items: { type: string } }
 *               location:         { type: string, example: رام الله }
 *               region:           { type: string, enum: [ضفة, قدس, غزة, '48', remote] }
 *               field:            { type: string }
 *               job_type:         { type: string }
 *               experience_level: { type: string }
 *               salary_min:       { type: integer }
 *               salary_max:       { type: integer }
 *               salary_currency:  { type: string, example: ₪ }
 *               salary_visible:   { type: boolean, default: true }
 *               deadline:         { type: string, format: date }
 *               is_featured:      { type: boolean, default: false }
 *               company_id:       { type: string, format: uuid, description: للأدمن فقط }
 *     responses:
 *       201:
 *         description: تم نشر الوظيفة بنجاح
 *       400:
 *         description: بيانات ناقصة أو خاطئة
 *       403:
 *         description: غير مصرح
 */
router.post('/', authenticate, requireRole('company', 'admin'), validate(schemas.job), async (req, res, next) => {
  try {
    const {
      title, description, requirements, benefits,
      location, region, field, job_type, experience_level,
      salary_min, salary_max, salary_currency,
      salary_visible, deadline, is_featured, company_id
    } = req.body;

    // الشركة تنشر تحت حسابها فقط - الأدمن يحدد الشركة يدوياً
    let coId = company_id;
    if (req.user.role === 'company') {
      const cos = await query('SELECT id FROM companies WHERE user_id = ?', [req.user.id]);
      if (!cos[0]) {
        return res.status(403).json({
          success: false,
          message: 'لا توجد شركة مرتبطة بحسابك. تواصل مع الإدارة',
          code: 'NO_COMPANY_LINKED'
        });
      }
      coId = cos[0].id;
    }

    if (!coId) {
      return res.status(400).json({
        success: false,
        message: 'معرف الشركة مطلوب',
        code: 'COMPANY_ID_REQUIRED'
      });
    }

    await query(
      `INSERT INTO jobs (
         id, company_id, title, description, requirements, benefits,
         location, region, field, job_type, experience_level,
         salary_min, salary_max, salary_currency, salary_visible,
         deadline, is_featured
       ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        coId, title, description,
        JSON.stringify(requirements || []),
        JSON.stringify(benefits || []),
        location || null, region || null, field || null,
        job_type || null, experience_level || null,
        salary_min || null, salary_max || null,
        salary_currency || '₪',
        salary_visible !== false ? 1 : 0,
        deadline || null,
        is_featured ? 1 : 0
      ]
    );

    res.status(201).json({
      success: true,
      message: 'تم نشر الوظيفة بنجاح وستظهر للباحثين فوراً'
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/jobs/{id}:
 *   put:
 *     summary: تعديل وظيفة
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Job'
 *     responses:
 *       200:
 *         description: تم التعديل بنجاح
 *       403:
 *         description: ليس لديك صلاحية تعديل هذه الوظيفة
 *       404:
 *         description: الوظيفة غير موجودة
 */
router.put('/:id', authenticate, requireRole('company', 'admin'), validate(schemas.job), async (req, res, next) => {
  try {
    const [job] = await query('SELECT company_id FROM jobs WHERE id = ?', [req.params.id]);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'الوظيفة غير موجودة',
        code: 'JOB_NOT_FOUND'
      });
    }

    // التحقق من ملكية الشركة للوظيفة (الأدمن يتجاوز هذا الفحص)
    if (req.user.role === 'company') {
      const [co] = await query('SELECT id FROM companies WHERE user_id = ?', [req.user.id]);
      if (!co || co.id !== job.company_id) {
        return res.status(403).json({
          success: false,
          message: 'ليس لديك صلاحية تعديل هذه الوظيفة',
          code: 'NOT_JOB_OWNER'
        });
      }
    }

    const {
      title, description, requirements, benefits,
      location, region, field, job_type, experience_level,
      salary_min, salary_max, salary_currency,
      salary_visible, deadline, is_featured, is_active
    } = req.body;

    await query(
      `UPDATE jobs SET
         title = ?, description = ?, requirements = ?, benefits = ?,
         location = ?, region = ?, field = ?, job_type = ?,
         experience_level = ?, salary_min = ?, salary_max = ?,
         salary_currency = ?, salary_visible = ?, deadline = ?,
         is_featured = ?, is_active = ?
       WHERE id = ?`,
      [
        title, description,
        JSON.stringify(requirements || []),
        JSON.stringify(benefits || []),
        location || null, region || null, field || null,
        job_type || null, experience_level || null,
        salary_min || null, salary_max || null,
        salary_currency || '₪',
        salary_visible !== false ? 1 : 0,
        deadline || null,
        is_featured ? 1 : 0,
        is_active !== false ? 1 : 0,
        req.params.id
      ]
    );

    res.json({ success: true, message: 'تم تعديل الوظيفة بنجاح' });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/jobs/{id}:
 *   delete:
 *     summary: حذف وظيفة
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: تم الحذف بنجاح
 *       403:
 *         description: ليس لديك صلاحية حذف هذه الوظيفة
 *       404:
 *         description: الوظيفة غير موجودة
 */
router.delete('/:id', authenticate, requireRole('company', 'admin'), async (req, res, next) => {
  try {
    const [job] = await query('SELECT company_id FROM jobs WHERE id = ?', [req.params.id]);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'الوظيفة غير موجودة',
        code: 'JOB_NOT_FOUND'
      });
    }

    if (req.user.role === 'company') {
      const [co] = await query('SELECT id FROM companies WHERE user_id = ?', [req.user.id]);
      if (!co || co.id !== job.company_id) {
        return res.status(403).json({
          success: false,
          message: 'ليس لديك صلاحية حذف هذه الوظيفة',
          code: 'NOT_JOB_OWNER'
        });
      }
    }

    await query('DELETE FROM jobs WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'تم حذف الوظيفة بنجاح' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
