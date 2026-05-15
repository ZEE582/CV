/**
 * @file routes/ai.js
 * @description مسارات المساعد الذكي باستخدام Groq API
 * @author Ttwar Team
 */

const express = require('express');
const fetch = require('node-fetch');

const router = express.Router();

/**
 * دعم CORS + OPTIONS لجميع الطلبات
 */
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');

  res.header(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  );

  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

/**
 * @swagger
 * tags:
 *   name: AI Assistant
 *   description: المساعد الذكي الخاص بمنصة تطور
 */

/**
 * @swagger
 * /api/ai/chat:
 *   get:
 *     summary: إرسال رسالة للمساعد الذكي باستخدام GET
 *     tags: [AI Assistant]
 *     parameters:
 *       - in: query
 *         name: message
 *         schema:
 *           type: string
 *         required: true
 *         description: رسالة المستخدم
 *     responses:
 *       200:
 *         description: تم إنشاء الرد بنجاح
 *       400:
 *         description: الرسالة مطلوبة
 *       500:
 *         description: خطأ داخلي
 *
 *   post:
 *     summary: إرسال رسالة للمساعد الذكي باستخدام POST
 *     tags: [AI Assistant]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 example: أعطني نصائح لتعلم React
 *               jobsList:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     company_name:
 *                       type: string
 *                     field:
 *                       type: string
 *                     job_type:
 *                       type: string
 *                     salary_visible:
 *                       type: boolean
 *                     salary_min:
 *                       type: number
 *                     salary_max:
 *                       type: number
 *                     salary_currency:
 *                       type: string
 *                     experience_level:
 *                       type: string
 *     responses:
 *       200:
 *         description: تم إنشاء الرد بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 reply:
 *                   type: string
 *
 *       400:
 *         description: الرسالة مطلوبة
 *
 *       500:
 *         description: خطأ داخلي في الخادم
 */

/**
 * @route   ALL /api/ai/chat
 * @desc    إرسال رسالة للمساعد الذكي
 * @access  Public
 */
router.all('/chat', async (req, res) => {
  try {

    /**
     * دعم جميع أنواع الطلبات
     */
    const body = req.body || {};
    const query = req.query || {};

    const message =
      body.message ||
      query.message ||
      body.prompt ||
      query.prompt ||
      body.text ||
      query.text ||
      '';

    const jobsList =
      body.jobsList ||
      body.jobs ||
      query.jobsList ||
      [];

    /**
     * التحقق من الرسالة
     */
    if (!message || !String(message).trim()) {
      return res.status(400).json({
        success: false,
        message: 'الرسالة مطلوبة'
      });
    }

    /**
     * مفتاح Groq
     */
   const apiKey = process.env.GROQ_API_KEY;

    /**
     * بناء سياق الوظائف
     */
    const jobsContext =
      Array.isArray(jobsList) && jobsList.length > 0
        ? '\n\nالوظائف التقنية المتاحة حالياً:\n' +
          jobsList
            .slice(0, 12)
            .map(
              (job) =>
                `• ${job.title || 'بدون عنوان'} | ${
                  job.company_name || 'شركة غير معروفة'
                } | ${job.field || 'غير محدد'} | ${
                  job.job_type || 'غير محدد'
                } | ${
                  job.salary_visible && job.salary_max
                    ? `${(
                        job.salary_min || 0
                      ).toLocaleString()} - ${job.salary_max.toLocaleString()} ${
                        job.salary_currency || ''
                      }`
                    : 'الراتب غير محدد'
                } | خبرة: ${
                  job.experience_level || 'غير محدد'
                }`
            )
            .join('\n')
        : '';

    /**
     * System Prompt
     */
    const systemPrompt = `
أنت مساعد ذكي متعدد الأغراض تابع لمنصة "تطور" الفلسطينية للوظائف التقنية.

تخصصك الرئيسي:
- وظائف التكنولوجيا
- البرمجة
- تطوير الويب
- Backend
- Frontend
- Full Stack
- DevOps
- QA
- Mobile
- Cloud
- Data Science
- AI
- Cyber Security

لكن يمكنك الإجابة على أي سؤال عام أيضاً.

القواعد:
- أجب دائماً باللغة العربية
- كن واضحاً ومنظماً
- أعطِ أمثلة عملية
- قدم نصائح تقنية احترافية
- لا تعطِ معلومات مضللة
- إذا لم تعرف الإجابة قل ذلك بصراحة
- استخدم تنسيق مرتب عند الشرح

عند الحديث عن الوظائف:
- اذكر أسماء الشركات إن توفرت
- اذكر الرواتب إن توفرت
- اقترح مهارات مطلوبة
- أعطِ نصائح لتحسين السيرة الذاتية
- اقترح تقنيات مناسبة لسوق العمل الفلسطيني

${jobsContext}
`;

    /**
     * إرسال الطلب إلى Groq API
     */
    const groqResponse = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },

        body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',

          messages: [
            {
              role: 'system',
              content: systemPrompt
            },

            {
              role: 'user',
              content: String(message).trim()
            }
          ],

          temperature: 0.7,
          max_tokens: 1500,
          top_p: 0.95
        })
      }
    );

    /**
     * قراءة الرد الخام
     */
    const rawResponse = await groqResponse.text();

    let data = {};

    try {
      data = JSON.parse(rawResponse);
    } catch (jsonError) {
      console.error('JSON Parse Error:', jsonError);
    }

    /**
     * معالجة الأخطاء
     */
    if (!groqResponse.ok) {

      console.error('Groq API Error:', {
        status: groqResponse.status,
        error: rawResponse
      });

      return res.status(502).json({
        success: false,
        message: 'فشل الاتصال بالمساعد الذكي',
        error: rawResponse
      });
    }

    /**
     * استخراج الرد
     */
    let reply =
      'عذراً، لم أتمكن من إنشاء رد حالياً. حاول مرة أخرى.';

    try {

      reply =
        data?.choices?.[0]?.message?.content ||
        reply;

    } catch (error) {

      console.error(
        'Unexpected Groq Response:',
        JSON.stringify(data)
      );
    }

    /**
     * إرسال الرد النهائي
     */
    return res.status(200).json({
      success: true,
      method: req.method,
      reply
    });

  } catch (error) {

    console.error('AI Route Error:', error);

    return res.status(500).json({
      success: false,
      message: 'خطأ داخلي في الخادم',
      error: error.message
    });
  }
});

module.exports = router;