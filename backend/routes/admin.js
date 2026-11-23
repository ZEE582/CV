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
router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
router.use(authenticate, requireRole('admin'));
const history = require('../controllers/managementHistoryController');
/**
 * @swagger
 * /api/admin/history:
 *   get:
 *     tags: [Admin]
 *     summary: البحث في العمليات المحفوظة للحسابات والشركات؛ ليس تاريخًا كاملًا
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: kind, schema: { type: string, enum: [all, account, company], default: all } }
 *       - { in: query, name: action, schema: { type: string, default: all } }
 *       - { in: query, name: search, description: بحث حرفي بالاسم الحالي للهدف دون البريد, schema: { type: string, maxLength: 120 } }
 *       - { in: query, name: actor_id, schema: { type: string } }
 *       - { in: query, name: target_id, schema: { type: string } }
 *       - { in: query, name: from, description: أول يوم مشمول بالتوقيت العالمي, schema: { type: string, format: date } }
 *       - { in: query, name: to, description: آخر يوم مشمول بالتوقيت العالمي, schema: { type: string, format: date } }
 *       - { in: query, name: page, schema: { type: integer, minimum: 1, maximum: 1000000, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 50, default: 20 } }
 *     responses:
 *       200: { description: صفحات نتائج من آخر100عملية المحفوظة لكل هدف؛ out_of_range يقتضي طلب آخر صفحة صالحة }
 *       400: { description: معايير غير صالحة أو نطاق تواريخ معكوس }
 *       401: { description: يلزم تسجيل الدخول }
 *       403: { description: المدير فقط }
 *       503: { description: تجاوزت عملية تجميع البحث مهلة3ثوانٍ؛ ضيّق الفلاتر }
 */
router.get('/history', require('../controllers/managementHistoryFeedController').list);
/**
 * @swagger
 * /api/admin/users/{id}/history:
 *   get:
 *     tags: [Admin]
 *     summary: سجل تغييرات حالة الحساب وصلاحيته؛ آخر 100 عملية منذ تفعيل السجل
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: سجل خاص بالمدير مع المنفذ والحالات دون كلمات مرور أو قيم نصية خاصة؛ no-store }
 *       401: { description: يلزم تسجيل الدخول }
 *       403: { description: المدير فقط }
 *       404: { description: الحساب غير موجود }
 * /api/admin/companies/{id}/history:
 *   get:
 *     tags: [Admin]
 *     summary: سجل عمليات الشركة المدعومة؛ آخر 100 عملية وليس تاريخًا كاملًا
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: سجل خاص بالمدير يشمل تغييرات المالك والمدير؛ no-store }
 *       401: { description: يلزم تسجيل الدخول }
 *       403: { description: المدير فقط }
 *       404: { description: الشركة غير موجودة }
 */
router.get('/users/:id/history', history.read('account'));
router.get('/companies/:id/history', history.read('company'));

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
 *                     openJobs: { type: integer, description: وظائف لشركات مفعلة وضمن الموعد }
 *                     reviewableApplications: { type: integer }
 *                     reviewablePendingApplications: { type: integer }
 *                     reviewableMessages: { type: integer }
 *                     unreadMessages: { type: integer }
 *                 generated_at: { type: string, format: date-time }
 *                 recordIssues:
 *                   type: object
 *                   description: أعداد سجلات الوظائف والطلبات والرسائل غير المرتبطة بنطاق صالح
 *                 companies:
 *                   type: array
 *                   items: { type: object }
 *                 recentJobs:
 *                   type: array
 *                   maxItems: 5
 *                   items: { type: object }
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
 *       - { in: query, name: scope, schema: { type: string, enum: [all, staff], default: all } }
 *       - { in: query, name: role, schema: { type: string, enum: [all, seeker, company, admin, unknown] } }
 *       - { in: query, name: state, schema: { type: string, enum: [all, active, paused] } }
 *       - { in: query, name: verification, schema: { type: string, enum: [all, verified, unverified] } }
 *       - { in: query, name: sort, schema: { type: string, enum: [newest, oldest, name] } }
 *       - { in: query, name: search, schema: { type: string, maxLength: 120 } }
 *       - { in: query, name: page,   schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 12, minimum: 1, maximum: 100 } }
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
 * /api/admin/users/{id}/access:
 *   patch:
 *     summary: حفظ حالة وصلاحية صريحتين مع إبطال الجلسات السابقة
 *     description: حسابات المديرين والحساب الحالي محمية. صلاحية الشركة تُدار من مسار الشركات. منح الإدارة يحتاج بريدًا مؤكدًا وحسابًا مفعّلًا. تتطلب المسارات القديمة toggle وrole وDELETE أيضًا expected_revision، ويتطلب toggle الحالة الصريحة is_active.
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
 *             required: [expected_revision]
 *             properties:
 *               expected_revision: { type: integer, minimum: 0 }
 *               role: { type: string, enum: [seeker, company, admin] }
 *               is_active: { type: boolean }
 *     responses:
 *       200: { description: تأكيد الهوية والنسخة والحالة والصلاحية وإبطال الجلسات }
 *       400: { description: بيانات غير صالحة أو حساب محمي أو لا يوجد تغيير }
 *       409: { description: تعارض النسخة أو الجلسة أو ارتباط الشركة أو شروط منح الإدارة }
 */
router.patch('/users/:id/access', require('../controllers/adminUsersController').access);

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
 *             required: [role, expected_revision]
 *             properties:
 *               role: { type: string, enum: [seeker, company, admin] }
 *               expected_revision: { type: integer, minimum: 0 }
 *     responses:
 *       200: { description: تم تغيير الدور }
 */
router.patch('/users/:id/role', ctrl.changeUserRole);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: إيقاف حساب مع الاحتفاظ بسجلاته
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: تم إيقاف الحساب والاحتفاظ بالسجلات }
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
