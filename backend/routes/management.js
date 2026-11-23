const express = require('express');
const accounts = require('../controllers/adminUsersController');
const calendar = require('../controllers/calendarController');
const router = express.Router();
router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
router.get('/team', accounts.legacy(true));
router.get('/contacts', accounts.legacy(false));
router.get('/events', calendar.legacy);
router.get('/events/list', calendar.list);
router.get('/events/:id', calendar.detail);
router.post('/events', calendar.create);
router.put('/events/:id', calendar.edit);
router.patch('/events/:id/state', calendar.state);
router.delete('/events/:id', calendar.archive);
module.exports = router;

/**
 * @swagger
 * /api/management/events/list:
 *   get:
 *     summary: أنشطة الشهر واليوم مع صفحات وبحث وعدد لكل يوم
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: month, required: true, schema: { type: string, example: '2026-11' } }
 *       - { in: query, name: date, required: true, schema: { type: string, format: date, example: '2026-11-05' } }
 *       - { in: query, name: state, schema: { type: string, enum: [active, archived, all], default: active } }
 *       - { in: query, name: search, schema: { type: string, maxLength: 120 } }
 *       - { in: query, name: page, schema: { type: integer, minimum: 1, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 100, default: 12 } }
 *     responses:
 *       200: { description: أيام مطابقة وأعداد للشهر وأنشطة اليوم المختار }
 *       400: { description: تاريخ غير صالح أو يوم خارج الشهر }
 * /api/management/events:
 *   get:
 *     summary: قائمة التوافق القديمة، حتى 500 نشاط غير مؤرشف
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: مصفوفة ملخصات أنشطة؛ الواجهة الجديدة تستخدم list }
 *   post:
 *     summary: إضافة نشاط ليوم كامل، مع منع تكرار request_id للمدير نفسه
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, date]
 *             properties:
 *               title: { type: string, minLength: 1, maxLength: 200 }
 *               date: { type: string, format: date, description: يوم مدني من 1900 إلى 2199 دون وقت أو تحويل منطقة زمنية }
 *               color: { type: string, pattern: '^#[a-fA-F0-9]{6}$' }
 *               request_id: { type: string, format: uuid, description: UUID v4؛ تكراره بنفس البيانات يعيد أحدث السجل دون إضافة ثانية }
 *     responses:
 *       201: { description: نشاط جديد }
 *       200: { description: إعادة طلب محفوظ مسبقًا، وقد يكون السجل عُدّل أو أُرشف لاحقًا }
 *       409: { description: request_id استُخدم ببيانات مختلفة }
 * /api/management/events/{id}:
 *   get:
 *     summary: أحدث بيانات النشاط ونسخته
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: ملخص النشاط دون مفاتيح منع التكرار }
 *       404: { description: غير موجود }
 *   put:
 *     summary: تعديل نشاط غير مؤرشف بنسخة متوقعة إلزامية
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
 *             required: [expected_version]
 *             properties:
 *               title: { type: string, minLength: 1, maxLength: 200 }
 *               date: { type: string, format: date }
 *               color: { type: string, pattern: '^#[a-fA-F0-9]{6}$' }
 *               expected_version: { type: integer, minimum: 0 }
 *     responses:
 *       200: { description: بيانات النشاط المحفوظة ونسخته الجديدة }
 *       409: { description: تعارض نسخة أو نشاط مؤرشف }
 *   delete:
 *     summary: مسار توافق يؤرشف النشاط ويحفظ بياناته، لا حذف نهائي
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
 *             required: [expected_version]
 *             properties:
 *               expected_version: { type: integer, minimum: 0 }
 *     responses:
 *       200: { description: أُرشف السجل ويمكن استرجاعه من state }
 *       409: { description: تعارض نسخة }
 * /api/management/events/{id}/state:
 *   patch:
 *     summary: أرشفة أو استرجاع النشاط بنسخة متوقعة وحالة صريحة
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
 *             required: [expected_version, is_archived]
 *             properties:
 *               expected_version: { type: integer, minimum: 0 }
 *               is_archived: { type: boolean }
 *     responses:
 *       200: { description: النشاط بحالته ونسخته المحفوظتين }
 *       409: { description: تعارض نسخة }
 */
