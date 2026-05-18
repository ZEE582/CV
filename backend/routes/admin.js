/**
 * @file routes/admin.js
 * @description مسارات لوحة تحكم الأدمن — admin فقط
 *
 * @swagger
 * tags:
 *   name: Admin
 *   description: لوحة التحكم — admin فقط لجميع المسارات
 */

const express = require('express');
const ctrl    = require('../controllers/adminController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// جميع مسارات /api/admin تتطلب authenticate + admin
router.use(authenticate, requireRole('admin'));

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: إحصائيات لوحة التحكم
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: الإحصائيات الكاملة
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalUsers:          { type: integer }
 *                     totalCompanies:      { type: integer }
 *                     totalJobs:           { type: integer }
 *                     totalApplications:   { type: integer }
 *                     totalMessages:       { type: integer }
 *                     activeJobs:          { type: integer }
 *                     verifiedCompanies:   { type: integer }
 *                     pendingApplications: { type: integer }
 */
router.get('/stats', ctrl.getStats);

// ── Users ────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: قائمة المستخدمين مع فلترة
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: role,   schema: { type: string, enum: [seeker, company, admin] } }
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: page,   schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit,  schema: { type: integer, default: 20 } }
 *     responses:
 *       200:
 *         description: قائمة المستخدمين
 */
router.get('/users', ctrl.getUsers);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: تفاصيل مستخدم
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: بيانات المستخدم }
 *       404: { description: غير موجود }
 */
router.get('/users/:id', ctrl.getUser);

/**
 * @swagger
 * /api/admin/users/{id}/toggle:
 *   patch:
 *     summary: تفعيل/إيقاف حساب مستخدم
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: تم تغيير الحالة }
 *       400: { description: لا يمكن إيقاف admin }
 */
router.patch('/users/:id/toggle', ctrl.toggleUserActive);

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   patch:
 *     summary: تغيير دور مستخدم
 *     tags: [Admin]
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
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [seeker, company, admin] }
 *     responses:
 *       200: { description: تم تغيير الدور }
 */
router.patch('/users/:id/role', ctrl.changeUserRole);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: حذف مستخدم
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: تم الحذف }
 *       400: { description: لا يمكن حذف admin }
 */
router.delete('/users/:id', ctrl.deleteUser);

// ── Messages ─────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/messages:
 *   get:
 *     summary: جميع رسائل التواصل
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: is_read, schema: { type: boolean } }
 *       - { in: query, name: page,    schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit,   schema: { type: integer, default: 20 } }
 *     responses:
 *       200: { description: قائمة الرسائل }
 */
router.get('/messages', ctrl.getAllMessages);

/**
 * @swagger
 * /api/admin/messages/{id}/read:
 *   patch:
 *     summary: تعليم رسالة كمقروءة
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: تم التعليم }
 */
router.patch('/messages/:id/read', ctrl.markMessageRead);

// ── Applications ─────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/applications:
 *   get:
 *     summary: جميع طلبات التوظيف
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: status, schema: { type: string, enum: [pending, viewed, shortlisted, rejected, hired] } }
 *       - { in: query, name: page,   schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit,  schema: { type: integer, default: 20 } }
 *     responses:
 *       200: { description: قائمة الطلبات }
 */
router.get('/applications', ctrl.getAllApplications);

module.exports = router;
