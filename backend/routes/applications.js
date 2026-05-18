/**
 * @file routes/applications.js
 * @description مسارات التقديم على الوظائف
 *
 * @swagger
 * tags:
 *   name: Applications
 *   description: التقديم على الوظائف وإدارة الطلبات
 */

const express = require('express');
const ctrl    = require('../controllers/applicationsController');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate, schemas }         = require('../middleware/validate');

const router = express.Router();

/**
 * @swagger
 * /api/applications:
 *   post:
 *     summary: التقديم على وظيفة (seeker فقط)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [job_id]
 *             properties:
 *               job_id:       { type: string, description: معرف الوظيفة }
 *               cover_letter: { type: string, description: رسالة التغطية }
 *               cv_url:       { type: string, format: uri, description: رابط السيرة الذاتية }
 *     responses:
 *       201:
 *         description: تم إرسال الطلب بنجاح
 *       409:
 *         description: تقدمت لهذه الوظيفة مسبقاً
 *       404:
 *         description: الوظيفة غير موجودة
 *       403:
 *         description: seeker فقط
 */
router.post('/', authenticate, requireRole('seeker'), validate(schemas.application), ctrl.apply);

/**
 * @swagger
 * /api/applications/my:
 *   get:
 *     summary: تقديماتي (seeker فقط)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: قائمة تقديماتي
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 total:   { type: integer }
 *                 applications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Application'
 */
router.get('/my', authenticate, requireRole('seeker'), ctrl.getMyApplications);

/**
 * @swagger
 * /api/applications/job/{jobId}:
 *   get:
 *     summary: تقديمات وظيفة معينة (company مالكة | admin)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: jobId, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: قائمة المتقدمين }
 *       403: { description: company أو admin فقط }
 *       404: { description: الوظيفة غير موجودة }
 */
router.get('/job/:jobId', authenticate, requireRole('company', 'admin'), ctrl.getJobApplications);

/**
 * @swagger
 * /api/applications/{id}/status:
 *   patch:
 *     summary: تحديث حالة طلب (company | admin)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, viewed, shortlisted, rejected, hired]
 *     responses:
 *       200: { description: تم التحديث }
 *       403: { description: ليس مالك الوظيفة }
 */
router.patch('/:id/status', authenticate, requireRole('company', 'admin'), validate(schemas.status), ctrl.updateStatus);

/**
 * @swagger
 * /api/applications/{id}/withdraw:
 *   delete:
 *     summary: سحب التقديم (seeker فقط - pending فقط)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: تم السحب }
 *       400: { description: لا يمكن سحب طلب تمت مراجعته }
 *       404: { description: الطلب غير موجود }
 */
router.delete('/:id/withdraw', authenticate, requireRole('seeker'), ctrl.withdraw);

module.exports = router;
