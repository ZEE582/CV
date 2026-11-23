const Joi = require('joi');
const schema = Joi.object({ search: Joi.string().trim().max(120).allow('').default(''), status: Joi.string().valid('', 'pending', 'viewed', 'shortlisted', 'rejected', 'hired').default(''), sort: Joi.string().valid('newest', 'oldest').default('newest'), page: Joi.number().integer().min(1).max(1000000).default(1), limit: Joi.number().integer().min(1).max(100).default(25) });
module.exports = (req, res, next) => {
  const { value, error } = schema.validate(req.query, { stripUnknown: true });
  if (error) return res.status(400).json({ success: false, code: 'INVALID_APPLICANTS_QUERY', message: 'معايير تصفية المتقدمين غير صالحة.' });
  req.applicantsQuery = value; next();
};
