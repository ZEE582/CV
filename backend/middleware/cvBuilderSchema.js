const Joi = require('joi');
const text = (max = 1000) => Joi.string().max(max).allow('').default('');
const texts = () => Joi.array().items(Joi.string().max(200)).max(100).default([]);
module.exports = Joi.object({
  fullName: text(200), jobTitle: text(300), email: Joi.string().trim().email().allow('').default(''), phone: text(100), location: text(300),
  linkedin: text(2048), github: text(2048), portfolio: text(2048), avatarUrl:text(2048), summary: text(20000), skills: texts(),
  skillLevels:Joi.array().items(Joi.object({name:text(200),level:Joi.string().valid('مبتدئ','متوسط','متقدم','خبير').default('متوسط')})).max(100).default([]),
  languages: Joi.array().items(Joi.object({lang:text(100),level:Joi.string().valid('Native','Fluent','Professional','Conversational','Basic').default('Professional')})).max(100).default([]),
  experience: Joi.array().items(Joi.object({id:text(64),company:text(300),role:text(300),startDate:text(100),endDate:text(100),current:Joi.boolean().default(false),description:text(20000),tech:texts(),location:text(300)})).max(100).default([]),
  education: Joi.array().items(Joi.object({id:text(64),school:text(300),degree:text(300),field:text(300),startDate:text(100),endDate:text(100),gpa:text(100),description:text(20000)})).max(100).default([]),
  projects: Joi.array().items(Joi.object({id:text(64),name:text(300),description:text(20000),tech:texts(),url:text(2048),github:text(2048)})).max(100).default([]),
  certifications: Joi.array().items(Joi.object({id:text(64),name:text(300),issuer:text(300),date:text(100),url:text(2048)})).max(100).default([]),
  templateId: Joi.number().integer().min(1).max(10).default(1),
  accentColor: Joi.string().pattern(/^#[0-9a-f]{6}$/i).default('#6B5FE6'),
});
