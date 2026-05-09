/**
 * @file middleware/validate.js
 * @description Middleware للتحقق من صحة بيانات الطلب باستخدام Joi
 * يتحقق من req.body ويعيد رسائل خطأ واضحة بالعربية
 */

const Joi = require('joi');

/**
 * إنشاء middleware للتحقق من صحة body الطلب
 * @param {Joi.Schema} schema - Schema للتحقق منه
 * @returns {import('express').RequestHandler}
 *
 * @example
 * const schema = Joi.object({ email: Joi.string().email().required() });
 * router.post('/login', validate(schema), handler);
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,   // أظهر جميع الأخطاء دفعة واحدة
    stripUnknown: true   // احذف الحقول غير المعرّفة في الـ schema
  });

  if (error) {
    const messages = error.details.map(d => d.message).join(' | ');
    return res.status(400).json({
      success: false,
      message: messages,
      code: 'VALIDATION_ERROR',
      errors: error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message
      }))
    });
  }

  req.body = value; // استبدل body بالقيم بعد التنقية
  next();
};

// ── Schemas للـ Auth ─────────────────────────────────────────

/** Schema تسجيل الدخول */
const loginSchema = Joi.object({
  email:    Joi.string().email().required().messages({
    'string.email': 'البريد الإلكتروني غير صالح',
    'any.required': 'البريد الإلكتروني مطلوب'
  }),
  password: Joi.string().min(1).required().messages({
    'any.required': 'كلمة السر مطلوبة'
  })
});

/** Schema إنشاء حساب جديد */
const registerSchema = Joi.object({
  email:     Joi.string().email().required().messages({
    'string.email': 'البريد الإلكتروني غير صالح',
    'any.required': 'البريد الإلكتروني مطلوب'
  }),
  password:  Joi.string().min(6).required().messages({
    'string.min': 'كلمة السر يجب أن تكون 6 أحرف على الأقل',
    'any.required': 'كلمة السر مطلوبة'
  }),
  full_name: Joi.string().min(2).max(200).required().messages({
    'any.required': 'الاسم الكامل مطلوب'
  }),
  phone:     Joi.string().allow('', null).optional()
});

// ── Schemas للـ Jobs ─────────────────────────────────────────

const FIELDS    = ['تكنولوجيا','مالية وبنوك','اتصالات','منظمات دولية','تعليم','صحة','هندسة','تسويق وإعلام'];
const JOB_TYPES = ['دوام كامل','دوام جزئي','عقد مؤقت','عمل عن بُعد','فريلانس','تدريب مدفوع'];
const EXP_LVLS  = ['حديث التخرج','1-3 سنوات','3-5 سنوات','+5 سنوات','قيادي'];
const REGIONS   = ['ضفة','قدس','غزة','48','remote'];

/** Schema إنشاء/تعديل وظيفة */
const jobSchema = Joi.object({
  title:            Joi.string().min(3).max(300).required().messages({ 'any.required': 'عنوان الوظيفة مطلوب' }),
  description:      Joi.string().min(20).required().messages({ 'any.required': 'وصف الوظيفة مطلوب', 'string.min': 'الوصف قصير جداً (20 حرف على الأقل)' }),
  requirements:     Joi.array().items(Joi.string()).default([]),
  benefits:         Joi.array().items(Joi.string()).default([]),
  location:         Joi.string().allow('', null).optional(),
  region:           Joi.string().valid(...REGIONS).allow(null).optional(),
  field:            Joi.string().valid(...FIELDS).allow(null).optional(),
  job_type:         Joi.string().valid(...JOB_TYPES).allow(null).optional(),
  experience_level: Joi.string().valid(...EXP_LVLS).allow(null).optional(),
  salary_min:       Joi.number().min(0).allow(null).optional(),
  salary_max:       Joi.number().min(0).allow(null).optional(),
  salary_currency:  Joi.string().valid('₪', '$', '€', 'JD').default('₪'),
  salary_visible:   Joi.boolean().default(true),
  deadline:         Joi.string().isoDate().allow(null, '').optional(),
  is_featured:      Joi.boolean().default(false),
  is_active:        Joi.boolean().default(true),
  company_id:       Joi.string().uuid().optional() // للأدمن فقط
});

// ── Schemas للـ Companies ────────────────────────────────────

/** Schema إنشاء/تعديل شركة */
const companySchema = Joi.object({
  name_ar:      Joi.string().min(2).max(200).required().messages({ 'any.required': 'اسم الشركة بالعربية مطلوب' }),
  name_en:      Joi.string().max(200).allow('', null).optional(),
  sector:       Joi.string().allow('', null).optional(),
  size:         Joi.string().allow('', null).optional(),
  founded_year: Joi.number().integer().min(1900).max(new Date().getFullYear()).allow(null).optional(),
  location:     Joi.string().allow('', null).optional(),
  region:       Joi.string().valid(...REGIONS).allow(null).optional(),
  website:      Joi.string().uri().allow('', null).optional(),
  email:        Joi.string().email().allow('', null).optional(),
  about_ar:     Joi.string().min(10).required().messages({ 'any.required': 'نبذة عن الشركة مطلوبة', 'string.min': 'النبذة قصيرة جداً' }),
  color:        Joi.string().pattern(/^#[0-9a-fA-F]{6}$/).default('#1a7a4a'),
  is_verified:  Joi.boolean().default(false),
  user_id:      Joi.string().uuid().allow(null).optional() // للأدمن فقط
});

// ── Schemas للـ Messages ─────────────────────────────────────

/** Schema إرسال رسالة تواصل */
const messageSchema = Joi.object({
  company_id:   Joi.string().uuid().required().messages({ 'any.required': 'معرف الشركة مطلوب' }),
  sender_name:  Joi.string().min(2).max(200).required().messages({ 'any.required': 'اسم المُرسل مطلوب' }),
  sender_email: Joi.string().email().required().messages({ 'any.required': 'البريد الإلكتروني مطلوب' }),
  sender_phone: Joi.string().allow('', null).optional(),
  subject:      Joi.string().max(200).default('استفسار'),
  message:      Joi.string().min(10).required().messages({ 'any.required': 'نص الرسالة مطلوب', 'string.min': 'الرسالة قصيرة جداً' })
});

// ── Schemas للـ Applications ─────────────────────────────────

/** Schema إرسال طلب وظيفة */
const applicationSchema = Joi.object({
  job_id:       Joi.string().uuid().required().messages({ 'any.required': 'معرف الوظيفة مطلوب' }),
  cover_letter: Joi.string().allow('', null).optional(),
  cv_url:       Joi.string().uri().allow('', null).optional()
});

/** Schema تحديث حالة طلب */
const statusSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'viewed', 'shortlisted', 'rejected', 'hired')
    .required()
    .messages({ 'any.only': 'حالة غير صالحة', 'any.required': 'الحالة مطلوبة' })
});

module.exports = {
  validate,
  schemas: {
    login: loginSchema,
    register: registerSchema,
    job: jobSchema,
    company: companySchema,
    message: messageSchema,
    application: applicationSchema,
    status: statusSchema
  }
};
