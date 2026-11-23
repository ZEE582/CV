const Joi = require('joi');
const schema = Joi.object({
  search: Joi.string().trim().max(120).allow('').default(''), field: Joi.string().trim().max(100).allow('').default(''),
  region: Joi.string().valid('', 'ضفة', 'قدس', 'غزة', '48', 'remote').default(''),
  type: Joi.string().valid('', 'دوام كامل', 'دوام جزئي', 'عقد مؤقت', 'عمل عن بُعد', 'فريلانس', 'تدريب مدفوع').default(''),
  exp: Joi.string().valid('', 'حديث التخرج', '1-3 سنوات', '3-5 سنوات', '+5 سنوات', 'قيادي').default(''),
  availability: Joi.string().valid('open', 'all').default('all'), sort: Joi.string().valid('newest', 'featured', 'salary').default('newest'),
  currency: Joi.string().valid('₪', '$', '€', 'JD').default('₪'),
  page: Joi.number().integer().min(1).max(1000000).default(1), limit: Joi.number().integer().min(1).max(200).default(50),
});
module.exports = (req, res, next) => {
  const { value, error } = schema.validate(req.query, { stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: 'معايير البحث غير صالحة. راجع الفلاتر ورقم الصفحة.', code: 'INVALID_JOB_QUERY' });
  req.jobQuery = value; next();
};
