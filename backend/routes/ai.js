const express = require('express'); const { rateLimit } = require('express-rate-limit'); const controller = require('../controllers/aiController');
module.exports = function createAiRouter() {
  const router = express.Router(); router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  router.get('/status', controller.status);
  router.post('/chat', rateLimit({ windowMs: 60000, max: 10, standardHeaders: true, legacyHeaders: false, message: { success: false, code: 'AI_RATE_LIMIT', message: 'طلبات كثيرة. انتظر قليلًا قبل الإرسال.' } }), controller.chat);
  return router;
};
/**
 * @swagger
 * /api/ai/status:
 *   get:
 *     summary: توفر المساعد واسم المزوّد، دون أي مفاتيح أو إعدادات سرية
 *     tags: [AI]
 *     responses:
 *       200: { description: available وprovider وحدود السؤال والسياق، دون استدعاء المزوّد }
 * /api/ai/chat:
 *   post:
 *     summary: سؤال مهني مع موافقة صريحة وسياق محدود
 *     description: لا تحفظ المنصة المحادثة. الرسالة والسياق يرسلان إلى Groq. ملخصات الوظائف الاختيارية تأتي من الخادم ولا تتضمن رواتب أو بيانات حسابات. لا يقبل jobsList المرسل من العميل.
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             required: [message, request_id, allow_external_processing]
 *             properties:
 *               message: { type: string, minLength: 1, maxLength: 4000 }
 *               request_id: { type: string, format: uuid }
 *               allow_external_processing: { type: boolean, enum: [true] }
 *               include_jobs: { type: boolean, default: false }
 *               history:
 *                 type: array
 *                 maxItems: 6
 *                 description: أزواج user ثم assistant مكتملة، حتى 12000 حرف إجمالًا
 *                 items:
 *                   type: object
 *                   required: [role, content]
 *                   properties:
 *                     role: { type: string, enum: [user, assistant] }
 *                     content: { type: string, maxLength: 8000 }
 *     responses:
 *       200: { description: reply نصي صالح وrequest_id مطابق وsources عامة اختيارية }
 *       400: { description: سؤال أو موافقة أو سياق غير صالح }
 *       429: { description: حد الطلبات، مع Retry-After }
 *       502: { description: فشل المزوّد أو رد غير صالح }
 *       503: { description: الخدمة غير مهيأة أو مشغولة }
 *       504: { description: انتهاء مهلة المزوّد }
 */
