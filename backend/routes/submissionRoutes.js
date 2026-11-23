const express=require('express');const {rateLimit}=require('express-rate-limit');const {authenticate}=require('../middleware/auth');const controller=require('../controllers/submissionController');
module.exports=function createSubmissionRouter(){const router=express.Router();router.use((_req,res,next)=>{res.set('Cache-Control','no-store');next();});router.get('/status',controller.status);router.post('/run',authenticate,rateLimit({windowMs:60000,max:10,standardHeaders:true,legacyHeaders:false,message:{success:false,code:'RUN_RATE_LIMIT',message:'طلبات تشغيل كثيرة. انتظر قليلًا.'}}),controller.executeCode);return router;};
/**
 * @swagger
 * /api/submissions/status:
 *   get:
 *     summary: فحص اتصال خدمة التنفيذ واللغات المثبتة دون تشغيل كود أو كشف الرموز
 *     tags: [Practice]
 *     responses:
 *       200:
 *         description: لقطة اتصال ولغات حتى 5 ثوانٍ؛ available تعني وجود لغة مدعومة واحدة على الأقل
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [success, configured, available, host, languages, installed_languages, state, checked_at, max_code_chars, max_stdin_chars]
 *               properties:
 *                 success: { type: boolean, enum: [true] }
 *                 configured: { type: boolean }
 *                 available: { type: boolean }
 *                 host: { type: string, nullable: true, maxLength: 255 }
 *                 languages: { type: array, minItems: 5, maxItems: 5, items: { type: string, enum: [javascript, python, java, c, 'c++'] } }
 *                 installed_languages: { type: array, maxItems: 5, uniqueItems: true, items: { type: string, enum: [javascript, python, java, c, 'c++'] } }
 *                 state: { type: string, enum: [unconfigured, unverifiable, unreachable, invalid_response, missing_runtimes, partial, ready] }
 *                 checked_at: { type: string, format: date-time, nullable: true }
 *                 max_code_chars: { type: integer, enum: [50000] }
 *                 max_stdin_chars: { type: integer, enum: [8000] }
 * /api/submissions/run:
 *   post:
 *     summary: تشغيل مصرح به لدى خدمة معزولة مضبوطة، وليس تصحيح حل المسألة
 *     tags: [Practice]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             required: [code, request_id, allow_external_processing]
 *             properties:
 *               code: { type: string, minLength: 1, maxLength: 50000 }
 *               stdin: { type: string, maxLength: 8000 }
 *               language: { type: string, enum: [javascript, python, java, c, 'c++'], default: javascript }
 *               request_id: { type: string, format: uuid }
 *               allow_external_processing: { type: boolean, enum: [true] }
 *     responses:
 *       200: { description: request_id واللغة وjudged=false وdata بمرحلة التنفيذ وحالته ونص مخرجات محدود }
 *       400: { description: كود أو إدخال أو لغة أو موافقة غير صالحة }
 *       401: { description: يجب تسجيل الدخول }
 *       429: { description: طلب معلّق للحساب أو تجاوز حد المحاولات }
 *       502: { description: خطأ الخدمة أو رد غير صالح }
 *       503: { description: الخدمة غير جاهزة أو اللغة غير مثبتة }
 *       504: { description: مهلة اتصال الخدمة }
 */
