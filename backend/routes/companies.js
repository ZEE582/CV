/**
 * @file routes/companies.js
 * @description مسارات الشركات - CRUD مع صلاحيات
 *
 * الصلاحيات:
 *   GET    /         - عام
 *   GET    /:id      - عام
 *   POST   /         - admin فقط
 *   PUT    /:id      - company (شركتها فقط) أو admin
 *   DELETE /:id      - admin فقط
 */

const express  = require('express');
const { query } = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * tags:
 *   name: Companies
 *   description: إدارة الشركات
 */

/**
 * @swagger
 * /api/companies:
 *   get:
 *     summary: جلب قائمة الشركات مع فلترة
 *     tags: [Companies]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: sector
 *         schema: { type: string }
 *       - in: query
 *         name: region
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: قائمة الشركات مع عدد الوظائف المتاحة
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:   { type: boolean }
 *                 companies: { type: array, items: { $ref: '#/components/schemas/Company' } }
 */
router.get('/', async (req, res, next) => {
  try {
    const { sector, region, search } = req.query;

    const where  = ['c.is_active = 1'];
    const params = [];

    if (sector) { where.push('c.sector = ?'); params.push(sector); }
    if (region) { where.push('c.region = ?'); params.push(region); }

    if (search) {
      where.push('(c.name_ar LIKE ? OR c.name_en LIKE ? OR c.sector LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    // جلب الشركات مع عدد الوظائف الفعّالة لكل شركة (subquery)
    const companies = await query(
      `SELECT c.*,
              (SELECT COUNT(*) FROM jobs j WHERE j.company_id = c.id AND j.is_active = 1) AS jobs_count
       FROM companies c
       WHERE ${where.join(' AND ')}
       ORDER BY c.is_verified DESC, c.name_ar ASC`,
      params
    );

    res.json({ success: true, companies });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/companies/{id}:
 *   get:
 *     summary: جلب تفاصيل شركة مع وظائفها
 *     tags: [Companies]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: تفاصيل الشركة مع قائمة وظائفها النشطة
 *       404:
 *         description: الشركة غير موجودة
 */
router.get('/:id', async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT c.*,
              (SELECT COUNT(*) FROM jobs j WHERE j.company_id = c.id AND j.is_active = 1) AS jobs_count
       FROM companies c
       WHERE c.id = ? AND c.is_active = 1`,
      [req.params.id]
    );

    if (!rows[0]) {
      return res.status(404).json({
        success: false,
        message: 'الشركة غير موجودة أو غير متاحة',
        code: 'COMPANY_NOT_FOUND'
      });
    }

    // جلب وظائف الشركة النشطة
    const jobs = await query(
      'SELECT * FROM jobs WHERE company_id = ? AND is_active = 1 ORDER BY created_at DESC',
      [req.params.id]
    );

    // تحديث عداد المشاهدات
    query('UPDATE companies SET views_count = views_count + 1 WHERE id = ?', [req.params.id])
      .catch(err => console.warn('Company views update failed:', err.message));

    res.json({ success: true, company: rows[0], jobs });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/companies:
 *   post:
 *     summary: إضافة شركة جديدة (admin فقط)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name_ar, about_ar]
 *             properties:
 *               name_ar:      { type: string }
 *               name_en:      { type: string }
 *               sector:       { type: string }
 *               size:         { type: string }
 *               founded_year: { type: integer }
 *               location:     { type: string }
 *               region:       { type: string }
 *               website:      { type: string }
 *               email:        { type: string }
 *               about_ar:     { type: string }
 *               color:        { type: string, example: '#1a7a4a' }
 *               is_verified:  { type: boolean }
 *               user_id:      { type: string, format: uuid, description: ربط بحساب مستخدم }
 *     responses:
 *       201:
 *         description: تمت إضافة الشركة بنجاح
 *       403:
 *         description: الأدمن فقط يمكنه إضافة شركات
 */
router.post('/', authenticate, requireRole('admin'), validate(schemas.company), async (req, res, next) => {
  try {
    const {
      name_ar, name_en, sector, size, founded_year,
      location, region, website, email, about_ar,
      color, is_verified, user_id
    } = req.body;

    await query(
      `INSERT INTO companies (
         id, user_id, name_ar, name_en, sector, size, founded_year,
         location, region, website, email, about_ar, color, is_verified
       ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id || null, name_ar, name_en || null,
        sector || null, size || null, founded_year || null,
        location || null, region || null, website || null,
        email || null, about_ar,
        color || '#1a7a4a',
        is_verified ? 1 : 0
      ]
    );

    res.status(201).json({ success: true, message: 'تمت إضافة الشركة بنجاح' });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/companies/{id}:
 *   put:
 *     summary: تعديل بيانات شركة
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: تم التعديل بنجاح
 *       403:
 *         description: ليس لديك صلاحية تعديل هذه الشركة
 */
router.put('/:id', authenticate, requireRole('company', 'admin'), validate(schemas.company), async (req, res, next) => {
  try {
    const rows = await query('SELECT user_id FROM companies WHERE id = ?', [req.params.id]);
    if (!rows[0]) {
      return res.status(404).json({
        success: false,
        message: 'الشركة غير موجودة',
        code: 'COMPANY_NOT_FOUND'
      });
    }

    // الشركة تستطيع تعديل بيانتها فقط
    if (req.user.role === 'company' && rows[0].user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية تعديل هذه الشركة',
        code: 'NOT_COMPANY_OWNER'
      });
    }

    const {
      name_ar, name_en, sector, size, location, region,
      website, email, about_ar, color, is_verified
    } = req.body;

    await query(
      `UPDATE companies SET
         name_ar = ?, name_en = ?, sector = ?, size = ?,
         location = ?, region = ?, website = ?, email = ?,
         about_ar = ?, color = ?, is_verified = ?
       WHERE id = ?`,
      [
        name_ar, name_en || null, sector || null, size || null,
        location || null, region || null, website || null, email || null,
        about_ar, color || '#1a7a4a',
        // الأدمن فقط يغير حالة التوثيق
        req.user.role === 'admin' ? (is_verified ? 1 : 0) : rows[0].is_verified,
        req.params.id
      ]
    );

    res.json({ success: true, message: 'تم تعديل بيانات الشركة بنجاح' });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/companies/{id}:
 *   delete:
 *     summary: حذف شركة (admin فقط) - يحذف جميع وظائفها تلقائياً
 *     tags: [Companies]
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
 *         description: الأدمن فقط يمكنه حذف الشركات
 */
router.delete('/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const [co] = await query('SELECT id FROM companies WHERE id = ?', [req.params.id]);
    if (!co) {
      return res.status(404).json({
        success: false,
        message: 'الشركة غير موجودة',
        code: 'COMPANY_NOT_FOUND'
      });
    }

    // الحذف سيُطبّق ON DELETE CASCADE على الوظائف والرسائل المرتبطة
    await query('DELETE FROM companies WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'تم حذف الشركة وجميع بياناتها بنجاح' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
