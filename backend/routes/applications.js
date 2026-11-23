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
router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });

/**
 * @swagger
 * /api/applications:
 *   post:
 *     summary: التقديم على وظيفة (seeker فقط)
 *     description: تُحفظ نسخة محدودة من الإعلان الذي قرأه الخادم أثناء استقبال الطلب؛ لا يقبل job_snapshot من العميل.
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [job_id, cv_file]
 *             properties:
 *               job_id: { type: string }
 *               cover_letter: { type: string, maxLength: 10000 }
 *               cv_file: { type: string, format: binary, description: ملف PDF واحد حتى 5MiB؛ لا يُرسل مع cv_url }
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
router.post('/', authenticate, requireRole('seeker'), require('../middleware/applicationUpload').createApplicationUpload(), validate(schemas.application), ctrl.apply);

/**
 * @swagger
 * /api/applications/{id}/cv:
 *   get:
 *     summary: تنزيل PDF المرفق لصاحب الطلب أو الشركة المعنية أو المدير؛ لا يوجد رابط عام
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: ملف PDF خاص كتنزيل، مع منع التخزين المؤقت
 *         content:
 *           application/pdf:
 *             schema: { type: string, format: binary }
 *       404: { description: لا يوجد مرفق متاح لهذا الحساب }
 */
router.get('/:id/cv', authenticate, requireRole('seeker', 'company', 'admin'), ctrl.downloadCv);

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
 * /api/applications/{id}/report:
 *   get:
 *     summary: بيانات نسخة مراجعة الطلب من قراءة واحدة لوثيقة صاحبه، دون إنشاء ملف أو تغيير الحالة
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: بيانات الطلب والنسخة المحفوظة والسجل المحدود؛ لا تشمل رمز الجلسة أو معرف الموظف }
 *       401: { description: يلزم تسجيل الدخول }
 *       403: { description: صاحب الطلب الباحث فقط }
 *       404: { description: الطلب غير موجود أو لا يخص الحساب }
 *       503: { description: تعذر التحقق من سجل الطلب }
 */
router.get('/:id/report', authenticate, requireRole('seeker'), ctrl.getMyReport);

/**
 * @swagger
 * /api/applications/{id}/history:
 *   get:
 *     summary: آخر 100 حدث لحالة الطلب لصاحبه فقط؛ السجل القديم لا يُنشأ بأثر رجعي
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: الحالة الحالية والعدد الكلي وأحداث محدودة دون معرفات الموظفين أو أسمائهم }
 *       401: { description: يلزم تسجيل الدخول }
 *       403: { description: حساب الباحث عن عمل فقط }
 *       404: { description: الطلب غير موجود أو لا يخص الحساب }
 *       503: { description: تعذر التحقق من سجل الطلب }
 */
router.get('/:id/history', authenticate, requireRole('seeker'), ctrl.getMyHistory);

/**
 * @swagger
 * /api/applications/{id}/job:
 *   get:
 *     summary: الإعلان الحالي والنسخة المحفوظة مع الطلب لصاحب الطلب فقط
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: job للإعلان الحالي أو null؛ snapshot للنسخة المحفوظة مع الطلبات الجديدة أو null للقديمة، والراتب غير المعلن عند الالتقاط محجوب }
 *       401: { description: يلزم تسجيل الدخول }
 *       403: { description: حساب باحث عن عمل فقط }
 *       404: { description: الطلب غير موجود أو لا يخص الحساب الحالي }
 */
router.get('/:id/job', authenticate, requireRole('seeker'), ctrl.getMyJobDetails);

/**
 * @swagger
 * /api/applications/job/{jobId}:
 *   get:
 *     summary: تقديمات وظيفة معينة مع البحث والتصفية والصفحات (company مالكة | admin)
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
router.get('/job/:jobId', authenticate, requireRole('company', 'admin'), require('../middleware/applicantsQuery'), ctrl.getJobApplications);

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
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               expected_version: { type: integer, minimum: 0, description: نسخة الطلب المحملة لمنع سحب نسخة تغيّرت منذ عرضها }
 *     responses:
 *       200: { description: تم السحب }
 *       409: { description: تغيّر الطلب؛ يلزم إعادة تحميله قبل السحب }
 *       400: { description: لا يمكن سحب طلب تمت مراجعته }
 *       404: { description: الطلب غير موجود }
 */
router.delete('/:id/withdraw', authenticate, requireRole('seeker'), validate(schemas.applicationWithdraw), ctrl.withdraw);

module.exports = router;
