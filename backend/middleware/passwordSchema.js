const Joi = require('joi');
const newPassword = Joi.string().min(8).max(128).pattern(/\S/)
  .custom((value, helpers) => Buffer.byteLength(value, 'utf8') <= 72 ? value : helpers.error('any.invalid'))
  .messages({ 'string.min': 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل', 'string.pattern.base': 'كلمة المرور لا يمكن أن تكون فراغات فقط', 'any.invalid': 'كلمة المرور الجديدة طويلة جدًا؛ الحد 72 بايت' });
module.exports = { newPassword };
