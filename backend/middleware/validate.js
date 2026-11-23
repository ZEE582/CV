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

const companyFields = {
  name_ar: Joi.string().trim().min(2).max(200).required(), name_en: Joi.string().trim().max(200).allow('', null),
  location: Joi.string().trim().max(200).allow('', null), sector: Joi.string().trim().max(200).allow('', null), size: Joi.string().trim().max(100).allow('', null),
  founded_year: Joi.number().integer().min(1900).max(new Date().getFullYear()).allow(null), region: Joi.string().valid(...REGIONS).allow(null),
  website: Joi.string().trim().uri({ scheme: ['http', 'https'] }).max(2048).allow('', null), email: Joi.string().trim().lowercase().email().max(254).allow('', null),
  about_ar: Joi.string().trim().min(10).max(10000).required(), about_en: Joi.string().trim().max(10000).allow('', null),
  color: Joi.string().pattern(/^#[0-9a-fA-F]{6}$/), is_verified: Joi.boolean().strict(), is_active: Joi.boolean().strict(),
  linkedin_url: Joi.string().trim().uri({ scheme: ['http', 'https'] }).max(2048).allow('', null), logo_url: Joi.string().max(2048).allow('', null), cover_url: Joi.string().max(2048).allow('', null),
};

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
    title:            Joi.string().trim().min(3).max(300).required().messages({ 'any.required': 'عنوان الوظيفة مطلوب' }),
    description:      Joi.string().trim().min(20).max(30000).required().messages({ 'any.required': 'وصف الوظيفة مطلوب', 'string.min': 'الوصف قصير جداً (20 حرف على الأقل)' }),
    requirements:     Joi.array().items(Joi.string().trim().min(1).max(500)).max(100).default([]),
    benefits:         Joi.array().items(Joi.string().trim().min(1).max(500)).max(100).default([]),
    location:         Joi.string().trim().max(200).allow('', null).optional(),
    region:           Joi.string().valid(...REGIONS).allow(null).optional(),
    field:            Joi.string().valid(...FIELDS).allow(null).optional(),
    job_type:         Joi.string().valid(...JOB_TYPES).allow(null).optional(),
    experience_level: Joi.string().valid(...EXP_LVLS).allow(null).optional(),
    salary_min:       Joi.number().min(0).max(1000000000).allow(null).optional(),
    salary_max:       Joi.number().min(0).max(1000000000).allow(null).optional(),
    salary_currency:  Joi.string().valid('₪', '$', '€', 'JD').default('₪'),
    salary_visible:   Joi.boolean().strict().default(true),
    deadline:         Joi.string().isoDate().allow(null, '').optional(),
    is_featured:      Joi.boolean().strict().default(false),
    is_active:        Joi.boolean().strict().default(true),
    company_id:       mongoId.optional(),
    expected_version: Joi.number().integer().min(0).strict().optional()
  }).custom((value, helpers) => {
    if (typeof value.salary_min === 'number' && typeof value.salary_max === 'number' && value.salary_max < value.salary_min) return helpers.message({ custom: 'الحد الأعلى للراتب يجب ألا يقل عن الحد الأدنى' });
    return value;
  }),

  jobState: Joi.object({ is_active: Joi.boolean().strict().optional(), expected_version: Joi.number().integer().min(0).strict().optional() }),

  // ── Companies ───────────────────────────────────────────────
  company: Joi.object(companyFields).keys({ color: companyFields.color.default('#1a7a4a'), is_verified: companyFields.is_verified.default(false), is_active: companyFields.is_active.default(true), user_id: Joi.forbidden() }),
  companyUpdate: Joi.object(companyFields).fork(Object.keys(companyFields), field => field.optional()).keys({ expected_version: Joi.number().integer().min(0).strict(), user_id: Joi.forbidden() }).or(...Object.keys(companyFields)),
  companyVerification: Joi.object({ is_verified: Joi.boolean().strict().default(true), expected_version: Joi.number().integer().min(0).strict() }).default({}),
  companyArchive: Joi.object({ expected_version: Joi.number().integer().min(0).strict() }).default({}),

  // ── Messages (تواصل مع شركة) ─────────────────────────────────
  message: Joi.object({
    company_id: mongoId.required().messages({ 'any.required': 'معرف الشركة مطلوب' }),
    sender_name: Joi.string().trim().min(2).max(200).required(),
    sender_email: Joi.string().trim().lowercase().email().max(254).required(),
    sender_phone: Joi.string().trim().max(40).allow('', null).optional(),
    subject: Joi.string().trim().max(200).empty('').default('استفسار'),
    message: Joi.string().trim().min(10).max(5000).required(),
    client_request_id: Joi.string().guid({ version: ['uuidv4'] }).optional()
  }),
  messageState: Joi.object({ is_read: Joi.boolean().strict().optional(), expected_version: Joi.number().integer().min(0).strict().optional(), company_id: mongoId.optional() }).default({}),

  // ── Applications ─────────────────────────────────────────────
  application: Joi.object({
    cv_file: Joi.forbidden(),
    cv_file_data: Joi.forbidden(),
    status_history: Joi.forbidden(),
    job_snapshot: Joi.forbidden(),
    job_id:       mongoId.required().messages({ 'any.required': 'معرف الوظيفة مطلوب' }),
    cover_letter: Joi.string().max(10000).allow('', null).optional(),
      cv_url:       Joi.string().uri({ scheme: ['http', 'https'] }).max(2048).allow('', null).optional()
  }),

  applicationWithdraw: Joi.object({ expected_version: Joi.number().integer().min(0).strict().optional() }).default({}),
  status: Joi.object({
    status_history: Joi.forbidden(),
    status: Joi.string()
      .valid('pending', 'viewed', 'shortlisted', 'rejected', 'hired')
      .required()
      .messages({ 'any.only': 'حالة غير صالحة', 'any.required': 'الحالة مطلوبة' }),
    expected_version: Joi.number().integer().min(0).strict().optional(),
    job_id: mongoId.optional(), company_id: mongoId.optional()
  }),

  // ── CV Builder ───────────────────────────────────────────────
  cv: Joi.object({
    builder_data: require('./cvBuilderSchema').optional(),
    expected_updated_at: Joi.string().isoDate().allow(null).optional(),
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
      start_year:  Joi.number().integer().min(1900).max(2199).allow(null).optional(),
      end_year:    Joi.number().integer().min(1900).max(2199).allow(null).optional(),
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
