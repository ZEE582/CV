/**
 * @file middleware/validate.js
 * @description Validation Schemas الموحدة لجميع صفحات المنصة
 *
 * Schemas المشمولة:
 *  auth:     register | login | createCompanyAccount | changePassword
 *  jobs:     job
 *  company:  company
 *  messages: message
 *  cv:       cv
 *  admin:    application | status
 */

const Joi = require('joi');

// ── دالة التحقق العامة ────────────────────────────────────────
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details.map(d => d.message).join(' | '),
      code:    'VALIDATION_ERROR',
      errors:  error.details.map(d => ({ field: d.path.join('.'), message: d.message }))
    });
  }
  req.body = value;
  next();
};

// ── القيم المسموحة ────────────────────────────────────────────
const FIELDS    = ['تكنولوجيا', 'مالية وبنوك', 'اتصالات', 'منظمات دولية', 'تعليم', 'صحة', 'هندسة', 'تسويق وإعلام'];
const JOB_TYPES = ['دوام كامل', 'دوام جزئي', 'عقد مؤقت', 'عمل عن بُعد', 'فريلانس', 'تدريب مدفوع'];
const EXP_LVLS  = ['حديث التخرج', '1-3 سنوات', '3-5 سنوات', '+5 سنوات', 'قيادي'];
const REGIONS   = ['ضفة', 'قدس', 'غزة', '48', 'remote'];

const mongoId = Joi.string().regex(/^[a-f\d]{24}$/i).messages({ 'string.pattern.base': 'معرف غير صالح' });

// ── Schemas ───────────────────────────────────────────────────
const schemas = {

  // ── Auth ────────────────────────────────────────────────────
  register: Joi.object({
    email:     Joi.string().email().required().messages({ 'string.email': 'البريد الإلكتروني غير صالح', 'any.required': 'البريد مطلوب' }),
    password:  Joi.string().min(6).required().messages({ 'string.min': 'كلمة المرور 6 أحرف على الأقل', 'any.required': 'كلمة المرور مطلوبة' }),
    full_name: Joi.string().min(2).max(200).required().messages({ 'any.required': 'الاسم الكامل مطلوب' }),
    phone:     Joi.string().allow('', null).optional()
  }),

  login: Joi.object({
    email:    Joi.string().email().required().messages({ 'string.email': 'البريد غير صالح', 'any.required': 'البريد مطلوب' }),
    password: Joi.string().min(1).required().messages({ 'any.required': 'كلمة المرور مطلوبة' })
  }),

  // إنشاء حساب company من قِبَل admin
  createCompanyAccount: Joi.object({
    email:      Joi.string().email().required().messages({ 'any.required': 'البريد مطلوب' }),
    password:   Joi.string().min(6).required().messages({ 'string.min': 'كلمة المرور 6 أحرف على الأقل' }),
    full_name:  Joi.string().min(2).max(200).optional(),
    company_id: mongoId.optional()  // ربط بشركة موجودة اختياري
  }),

  changePassword: Joi.object({
    current_password: Joi.string().min(1).required().messages({ 'any.required': 'كلمة المرور الحالية مطلوبة' }),
    new_password:     Joi.string().min(6).required().messages({ 'string.min': 'كلمة المرور الجديدة 6 أحرف على الأقل' })
  }),

  // ── Jobs ────────────────────────────────────────────────────
  job: Joi.object({
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
    company_id:       mongoId.optional()
  }),

  // ── Companies ───────────────────────────────────────────────
  company: Joi.object({
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
    about_en:     Joi.string().allow('', null).optional(),
    color:        Joi.string().pattern(/^#[0-9a-fA-F]{6}$/).default('#1a7a4a'),
    is_verified:  Joi.boolean().default(false),
    user_id:      mongoId.allow(null).optional(),
    linkedin_url: Joi.string().uri().allow('', null).optional(),
    logo_url:     Joi.string().allow('', null).optional(),
    cover_url:    Joi.string().allow('', null).optional()
  }),

  // ── Messages (تواصل مع شركة) ─────────────────────────────────
  message: Joi.object({
    company_id:   mongoId.required().messages({ 'any.required': 'معرف الشركة مطلوب' }),
    sender_name:  Joi.string().min(2).max(200).required().messages({ 'any.required': 'اسم المُرسل مطلوب' }),
    sender_email: Joi.string().email().required().messages({ 'any.required': 'البريد مطلوب' }),
    sender_phone: Joi.string().allow('', null).optional(),
    subject:      Joi.string().max(200).default('استفسار'),
    message:      Joi.string().min(10).required().messages({ 'any.required': 'نص الرسالة مطلوب', 'string.min': 'الرسالة قصيرة جداً' })
  }),

  // ── Applications ─────────────────────────────────────────────
  application: Joi.object({
    job_id:       mongoId.required().messages({ 'any.required': 'معرف الوظيفة مطلوب' }),
    cover_letter: Joi.string().allow('', null).optional(),
    cv_url:       Joi.string().uri().allow('', null).optional()
  }),

  status: Joi.object({
    status: Joi.string()
      .valid('pending', 'viewed', 'shortlisted', 'rejected', 'hired')
      .required()
      .messages({ 'any.only': 'حالة غير صالحة', 'any.required': 'الحالة مطلوبة' })
  }),

  // ── CV Builder ───────────────────────────────────────────────
  cv: Joi.object({
    template:     Joi.string().allow('', null).optional(),
    summary:      Joi.string().allow('', null).optional(),
    personal_info: Joi.object({
      full_name:  Joi.string().allow('', null).optional(),
      email:      Joi.string().email().allow('', null).optional(),
      phone:      Joi.string().allow('', null).optional(),
      location:   Joi.string().allow('', null).optional(),
      linkedin:   Joi.string().uri().allow('', null).optional(),
      github:     Joi.string().uri().allow('', null).optional(),
      website:    Joi.string().uri().allow('', null).optional(),
      avatar_url: Joi.string().allow('', null).optional()
    }).optional(),
    education: Joi.array().items(Joi.object({
      degree:      Joi.string().allow('', null).optional(),
      institution: Joi.string().allow('', null).optional(),
      field:       Joi.string().allow('', null).optional(),
      start_year:  Joi.number().integer().min(1950).max(2030).allow(null).optional(),
      end_year:    Joi.number().integer().min(1950).max(2030).allow(null).optional(),
      description: Joi.string().allow('', null).optional()
    })).default([]),
    experience: Joi.array().items(Joi.object({
      title:       Joi.string().allow('', null).optional(),
      company:     Joi.string().allow('', null).optional(),
      location:    Joi.string().allow('', null).optional(),
      start_date:  Joi.string().allow('', null).optional(),
      end_date:    Joi.string().allow('', null).optional(),
      is_current:  Joi.boolean().default(false),
      description: Joi.string().allow('', null).optional()
    })).default([]),
    skills: Joi.array().items(Joi.object({
      name:  Joi.string().allow('', null).optional(),
      level: Joi.string().valid('مبتدئ', 'متوسط', 'متقدم', 'خبير').default('متوسط')
    })).default([]),
    languages: Joi.array().items(Joi.object({
      name:  Joi.string().allow('', null).optional(),
      level: Joi.string().valid('أساسي', 'متوسط', 'جيد', 'ممتاز', 'اللغة الأم').default('متوسط')
    })).default([])
  })
};

module.exports = { validate, schemas };
