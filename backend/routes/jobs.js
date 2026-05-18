/**
 * @file routes/jobs.js
 * @description مسارات الوظائف الموحدة
 * تخدم: صفحة الوظائف، صفحة الشركة، لوحة التحكم
 *
 * @swagger
 * tags:
 *   name: Jobs
 *   description: الوظائف — قراءة عامة | نشر/تعديل/حذف للشركة والأدمن
 */

const express = require('express');
const ctrl    = require('../controllers/jobsController');
const { authenticate, optionalAuth, requireRole } = require('../middleware/auth');
const { validate, schemas }                        = require('../middleware/validate');

const router = express.Router();

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: قائمة الوظائف مع فلترة وصفحات
 *     tags: [Jobs]
 *     security: []
 *     parameters:
 *       - { in: query, name: field,  schema: { type: string }, description: المجال }
 *       - { in: query, name: region, schema: { type: string }, description: المنطقة }
 *       - { in: query, name: type,   schema: { type: string }, description: نوع الدوام }
 *       - { in: query, name: exp,    schema: { type: string }, description: الخبرة }
 *       - { in: query, name: search, schema: { type: string }, description: بحث نصي }
 *       - { in: query, name: sort,   schema: { type: string, enum: [newest, featured, salary] } }
 *       - { in: query, name: page,   schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit,  schema: { type: integer, default: 50 } }
 *     responses:
 *       200:
 *         description: قائمة الوظائف
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 total:   { type: integer }
 *                 jobs:    { type: array, items: { $ref: '#/components/schemas/Job' } }
 */
router.get('/', optionalAuth, ctrl.getAll);

/**
 * @swagger
 * /api/jobs/my:
 *   get:
 *     summary: وظائف شركتي (company فقط)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: وظائف الشركة }
 *       403: { description: company فقط }
 */
router.get('/my', authenticate, requireRole('company', 'admin'), ctrl.getMyJobs);

/**
 * @swagger
 * /api/jobs/{id}:
 *   get:
 *     summary: تفاصيل وظيفة واحدة
 *     tags: [Jobs]
 *     security: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: تفاصيل الوظيفة }
 *       404: { description: الوظيفة غير موجودة }
 */
router.get('/:id', optionalAuth, ctrl.getOne);

/**
 * @swagger
 * /api/jobs:
 *   post:
 *     summary: نشر وظيفة جديدة (company | admin)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JobInput'
 *     responses:
 *       201: { description: تم نشر الوظيفة }
 *       401: { description: توكن مطلوب }
 *       403: { description: company أو admin فقط }
 */
router.post('/', authenticate, requireRole('company', 'admin'), validate(schemas.job), ctrl.create);

/**
 * @swagger
 * /api/jobs/{id}:
 *   put:
 *     summary: تعديل وظيفة (company مالكة | admin)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JobInput'
 *     responses:
 *       200: { description: تم التعديل }
 *       403: { description: ليس مالك الوظيفة }
 *       404: { description: الوظيفة غير موجودة }
 */
router.put('/:id', authenticate, requireRole('company', 'admin'), validate(schemas.job), ctrl.update);

/**
 * @swagger
 * /api/jobs/{id}/toggle:
 *   patch:
 *     summary: تفعيل/إيقاف وظيفة
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: تم تغيير الحالة }
 */
router.patch('/:id/toggle', authenticate, requireRole('company', 'admin'), ctrl.toggleActive);

/**
 * @swagger
 * /api/jobs/{id}:
 *   delete:
 *     summary: حذف وظيفة (company مالكة | admin)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: تم الحذف }
 *       403: { description: ليس مالك الوظيفة }
 */
router.delete('/:id', authenticate, requireRole('company', 'admin'), ctrl.remove);

module.exports = router;
