const Joi = require('joi');
const Company = require('../models/Company');
const { literalSearch } = require('../services/publicJobs');
const querySchema = Joi.object({ search: Joi.string().trim().max(120).allow('').default(''), state: Joi.string().valid('all', 'active', 'paused').default('all'), verification: Joi.string().valid('all', 'verified', 'unverified').default('all'), sort: Joi.string().valid('name', 'newest').default('name'), page: Joi.number().integer().min(1).max(1000000).default(1), limit: Joi.number().integer().min(1).max(100).default(12) });
const listFields = '_id name_ar name_en location sector user_id is_active is_verified __v updatedAt';
function normalize(company) { return { ...company, is_active: company.is_active === true, is_verified: company.is_verified === true, __v: company.__v || 0 }; }
exports.list = async (req, res, next) => {
  try {
    const { value: query, error } = querySchema.validate(req.query, { stripUnknown: true });
    if (error) return res.status(400).json({ success: false, message: 'معايير البحث عن الشركات غير صالحة.' });
    const filter = {};
    if (query.state !== 'all') filter.is_active = query.state === 'active' ? true : { $ne: true };
    if (query.verification !== 'all') filter.is_verified = query.verification === 'verified' ? true : { $ne: true };
    if (query.search) filter.$or = ['name_ar', 'name_en', 'location', 'sector'].map(key => ({ [key]: { $regex: literalSearch(query.search), $options: 'i' } }));
    const [total, groups] = await Promise.all([Company.countDocuments(filter), Company.aggregate([{ $group: { _id: null, all: { $sum: 1 }, active: { $sum: { $cond: [{ $eq: ['$is_active', true] }, 1, 0] } }, verified: { $sum: { $cond: [{ $eq: ['$is_verified', true] }, 1, 0] } } } }])]);
    const base = groups[0] || { all: 0, active: 0, verified: 0 }; const counts = { all: base.all, active: base.active, paused: base.all - base.active, verified: base.verified, unverified: base.all - base.verified };
    const pages = Math.max(1, Math.ceil(total / query.limit)); const page = Math.min(query.page, pages);
    const companies = await Company.find(filter).select(listFields).sort(query.sort === 'newest' ? { createdAt: -1, _id: -1 } : { name_ar: 1, _id: 1 }).skip((page - 1) * query.limit).limit(query.limit).lean();
    res.json({ success: true, total, page, pages, limit: query.limit, counts, companies: companies.map(normalize) });
  } catch (error) { next(error); }
};
exports.detail = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id).select(listFields + ' about_ar website email').lean();
    if (!company) return res.status(404).json({ success: false, message: 'الشركة غير موجودة.' });
    res.json({ success: true, company: normalize(company) });
  } catch (error) { next(error); }
};
