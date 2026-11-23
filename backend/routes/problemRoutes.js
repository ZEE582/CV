const express=require('express');const controller=require('../controllers/problemController');const {authenticate}=require('../middleware/auth');const router=express.Router();
router.use((_req,res,next)=>{res.set('Cache-Control','no-store');next();});
router.get('/',controller.getProblems);router.get('/starter',controller.getStarters);router.get('/:id',controller.getProblemById);router.post('/:id/check',authenticate,controller.check);
module.exports=router;
/**
 * @swagger
 * /api/problems:
 *   get:
 *     summary: فهرس مسائل ببحث حرفي وصفحات، دون إجابات أو نسب نجاح
 *     tags: [Practice]
 *     parameters:
 *       - { in: query, name: search, schema: { type: string, maxLength: 120 } }
 *       - { in: query, name: type, schema: { type: string, enum: [all, coding, quiz] } }
 *       - { in: query, name: difficulty, schema: { type: string, enum: [all, Easy, Medium, Hard, Unspecified] } }
 *       - { in: query, name: page, schema: { type: integer, minimum: 1, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 50, default: 12 } }
 *     responses:
 *       200: { description: ملخصات فقط، وصفحة مصححة ضمن النطاق }
 * /api/problems/starter:
 *   get:
 *     summary: خمسة تدريبات تمهيدية أصلية للقراءة دون إنشاء سجلات
 *     tags: [Practice]
 *     responses:
 *       200: { description: ثلاث أسئلة ومسألتان برمجيتان دون الإجابات }
 * /api/problems/{id}:
 *   get:
 *     summary: نص التدريب وخياراته ورابط مصدر آمن دون التصحيح
 *     tags: [Practice]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, maxLength: 160 } }
 *     responses:
 *       200: { description: تفاصيل السؤال وcan_check دون مفتاح الإجابة }
 *       404: { description: التدريب غير موجود }
 * /api/problems/{id}/check:
 *   post:
 *     summary: تصحيح اختيار للتعلّم دون حفظ محاولة أو منح نقاط
 *     tags: [Practice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, maxLength: 160 } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [answer_index]
 *             properties:
 *               answer_index: { type: integer, minimum: 0, maximum: 25 }
 *     responses:
 *       200: { description: correct وcorrect_index والشرح وawards_points=false }
 *       401: { description: يجب تسجيل الدخول }
 *       422: { description: السؤال غير جاهز للتصحيح }
 */
