/**
 * @file routes/companies.js
 * @description مسارات الشركات الموحدة
 *
 * @swagger
 * tags:
 *   name: Companies
 *   description: الشركات — قراءة عامة | إدارة للشركة والأدمن
 */

const express = require('express');
const ctrl    = require('../controllers/companiesController');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate, schemas }         = require('../middleware/validate');

const router = express.Router();

/**
 * @swagger
 * /api/companies:
 *   get:
 *     summary: قائمة الشركات مع فلترة
 *     tags: [Companies]
 *     security: []
 *     parameters:
 *       - { in: query, name: sector, schema: { type: string } }
 *       - { in: query, name: region, schema: { type: string } }
 *       - { in: query, name: search, schema: { type: string } }
 *     responses:
 *       200:
 *         description: قائمة الشركات
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 total:   { type: integer }
 *                 companies: { type: array, items: { $ref: '#/components/schemas/Company' } }
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/companies/my:
 *   get:
 *     summary: بيانات شركتي (company فقط)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: بيانات الشركة }
 *       404: { description: لا توجد شركة مرتبطة }
 */
router.get('/my', authenticate, requireRole('company'), ctrl.getMyCompany);

/**
 * @swagger
 * /api/companies/{id}:
 *   get:
 *     summary: تفاصيل شركة + وظائفها
 *     tags: [Companies]
 *     security: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: تفاصيل الشركة ووظائفها }
 *       404: { description: الشركة غير موجودة }
 */
router.get('/:id', ctrl.getOne);

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
 *             $ref: '#/components/schemas/CompanyInput'
 *     responses:
 *       201: { description: تمت إضافة الشركة }
 *       403: { description: admin فقط }
 */
router.post('/', authenticate, requireRole('admin'), validate(schemas.company), ctrl.create);

/**
 * @swagger
 * /api/companies/{id}:
 *   put:
 *     summary: تعديل شركة (company مالكة | admin)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CompanyInput'
 *     responses:
 *       200: { description: تم التعديل }
 *       403: { description: ليس مالك الشركة }
 */
router.put('/:id', authenticate, requireRole('company', 'admin'), validate(schemas.company), ctrl.update);

/**
 * @swagger
 * /api/companies/{id}/verify:
 *   patch:
 *     summary: توثيق شركة (admin فقط)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: تم التوثيق }
 *       403: { description: admin فقط }
 */
router.patch('/:id/verify', authenticate, requireRole('admin'), ctrl.verify);

/**
 * @swagger
 * /api/companies/{id}:
 *   delete:
 *     summary: حذف شركة وجميع بياناتها (admin فقط)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: تم الحذف }
 *       403: { description: admin فقط }
 */
router.delete('/:id', authenticate, requireRole('admin'), ctrl.remove);

module.exports = router;
