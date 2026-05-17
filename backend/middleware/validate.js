/**
 * @file middleware/validate.js
 */
const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const messages = error.details.map(d => d.message).join(' | ');
    return res.status(400).json({
      success: false,
      message: messages,
      code: 'VALIDATION_ERROR',
      errors: error.details.map(d => ({ field: d.path.join('.'), message: d.message }))
    });
  }
  req.body = value;
  next();
};

const FIELDS    = ['تكنولوجيا','مالية وبنوك','اتصالات','منظمات دولية','تعليم','صحة','هندسة','تسويق وإعلام'];
const JOB_TYPES = ['دوام كامل','دوام جزئي','عقد مؤقت','عمل عن بُعد','فريلانس','تدريب مدفوع'];
const EXP_LVLS  = ['حديث التخرج','1-3 سنوات','3-5 سنوات','+5 سنوات','قيادي'];
const REGIONS   = ['ضفة','قدس','غزة','48','remote'];

const mongoId = Joi.string().regex(/^[a-f\d]{24}$/i);

const schemas = {
  login: Joi.object({
    email:    Joi.string().email().required().messages({ 'string.email': 'البريد الإلكتروني غير صالح', 'any.required': 'البريد الإلكتروني مطلوب' }),
    password: Joi.string().min(1).required().messages({ 'any.required': 'كلمة السر مطلوبة' })
  }),

  register: Joi.object({
    email:     Joi.string().email().required().messages({ 'string.email': 'البريد الإلكتروني غير صالح', 'any.required': 'البريد الإلكتروني مطلوب' }),
    password:  Joi.string().min(6).required().messages({ 'string.min': 'كلمة السر يجب أن تكون 6 أحرف على الأقل', 'any.required': 'كلمة السر مطلوبة' }),
    full_name: Joi.string().min(2).max(200).required().messages({ 'any.required': 'الاسم الكامل مطلوب' }),
    phone:     Joi.string().allow('', null).optional()
  }),

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
    color:        Joi.string().pattern(/^#[0-9a-fA-F]{6}$/).default('#1a7a4a'),
    is_verified:  Joi.boolean().default(false),
    user_id:      mongoId.allow(null).optional()
  }),

  message: Joi.object({
    company_id:   mongoId.required().messages({ 'any.required': 'معرف الشركة مطلوب' }),
    sender_name:  Joi.string().min(2).max(200).required().messages({ 'any.required': 'اسم المُرسل مطلوب' }),
    sender_email: Joi.string().email().required().messages({ 'any.required': 'البريد الإلكتروني مطلوب' }),
    sender_phone: Joi.string().allow('', null).optional(),
    subject:      Joi.string().max(200).default('استفسار'),
    message:      Joi.string().min(10).required().messages({ 'any.required': 'نص الرسالة مطلوب', 'string.min': 'الرسالة قصيرة جداً' })
  }),

  application: Joi.object({
    job_id:       mongoId.required().messages({ 'any.required': 'معرف الوظيفة مطلوب' }),
    cover_letter: Joi.string().allow('', null).optional(),
    cv_url:       Joi.string().uri().allow('', null).optional()
  }),

  status: Joi.object({
    status: Joi.string().valid('pending', 'viewed', 'shortlisted', 'rejected', 'hired').required()
      .messages({ 'any.only': 'حالة غير صالحة', 'any.required': 'الحالة مطلوبة' })
  })
};

module.exports = { validate, schemas };
