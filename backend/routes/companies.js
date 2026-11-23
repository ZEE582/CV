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
const { authenticate, requireRole, requireCompanyOwnerOrAdmin } = require('../middleware/auth');
const Company = require('../models/Company');
const overview = require('../controllers/companyOverviewController');
const management = require('../controllers/companyManagementController');
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
const privateResponse = (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); };
router.get('/manage/list', privateResponse, authenticate, requireRole('admin'), management.list);
router.get('/manage/:id', privateResponse, authenticate, requireRole('admin'), management.detail);
router.get('/manage', authenticate, requireRole('admin'), overview.managedCompanies);
router.get('/my', authenticate, requireRole('company'), ctrl.getMyCompany);
router.get('/:id/overview', authenticate, requireRole('company', 'admin'), requireCompanyOwnerOrAdmin(Company), overview.overview);

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
router.post('/', privateResponse, authenticate, requireRole('admin'), validate(schemas.company), ctrl.create);

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
 *             $ref: '#/components/schemas/CompanyUpdateInput'
 *     responses:
 *       200: { description: تم التعديل }
 *       403: { description: ليس مالك الشركة }
 */
router.put('/:id', privateResponse, authenticate, requireRole('company', 'admin'), validate(schemas.companyUpdate), ctrl.update);

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
router.patch('/:id/verify', privateResponse, authenticate, requireRole('admin'), validate(schemas.companyVerification), ctrl.verify);

/**
 * @swagger
 * /api/companies/{id}:
 *   delete:
 *     summary: إيقاف شركة مع الاحتفاظ ببياناتها (admin فقط)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: تم إيقاف الشركة والاحتفاظ ببياناتها }
 *       403: { description: admin فقط }
 */
router.delete('/:id', privateResponse, authenticate, requireRole('admin'), validate(schemas.companyArchive), ctrl.remove);

module.exports = router;
