const Joi = require('joi');
const mongoose = require('mongoose');
const User = require('../models/User');
const Company = require('../models/Company');
const { actions } = require('../services/managementHistory');
const { literalSearch } = require('../services/publicJobs');
const id = Joi.string().pattern(/^[a-f\d]{24}$/i).lowercase().allow('').default('');
function validDay(value) { return /^(19|20|21)\d{2}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value + 'T00:00:00Z')) && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value; }
const day = Joi.string().allow('').default('').custom((value, helpers) => !value || validDay(value) ? value : helpers.error('any.invalid'));
const schema = Joi.object({ kind: Joi.string().valid('all', 'account', 'company').default('all'), action: Joi.string().valid('all', ...actions).default('all'), search: Joi.string().trim().max(120).allow('').default(''), actor_id: id, target_id: id, from: day, to: day, page: Joi.number().integer().min(1).max(1000000).default(1), limit: Joi.number().integer().min(1).max(50).default(20) });
function source(kind, filters) {
  const eventMatch = { action: filters.action === 'all' ? { $in: actions.filter(action => action.startsWith(kind + '.')) } : filters.action };
  if (filters.actor_id) eventMatch.actor_id = new mongoose.Types.ObjectId(filters.actor_id);
  if (filters.from || filters.to) {
    eventMatch.at = {};
    if (filters.from) eventMatch.at.$gte = new Date(filters.from + 'T00:00:00Z');
    if (filters.to) eventMatch.at.$lt = new Date(Date.parse(filters.to + 'T00:00:00Z') + 86400000);
  }
  const name = kind === 'account' ? 'name' : 'name_ar';
  const match = { change_history: { $elemMatch: eventMatch } };
  if (filters.target_id) match._id = new mongoose.Types.ObjectId(filters.target_id);
  if (filters.search) match[name] = { $regex: literalSearch(filters.search), $options: 'i' };
  return [
    { $match: match },
    { $project: { _id: 0, kind: { $literal: kind }, target_id: '$_id', target_name: { $substrCP: [{ $cond: [{ $eq: [{ $type: '$' + name }, 'string'] }, '$' + name, ''] }, 0, 200] }, event: '$change_history' } },
    { $unwind: '$event' },
    { $match: Object.fromEntries(Object.entries(eventMatch).map(([key, value]) => ['event.' + key, value])) },
  ];
}
exports.list = async (req, res, next) => {
  try {
    const { value: query, error } = schema.validate(req.query, { stripUnknown: true });
    if (error || query.from && query.to && query.from > query.to || query.kind !== 'all' && query.action !== 'all' && !query.action.startsWith(query.kind + '.')) return res.status(400).json({ success: false, message: 'راجع نوع السجل والعملية والتواريخ والمعرّفات.' });
    const { page, limit, ...filters } = query;
    const firstKind = query.kind === 'company' ? 'company' : 'account';
    const model = firstKind === 'company' ? Company : User;
    const pipeline = source(firstKind, filters);
    if (query.kind === 'all') pipeline.push({ $unionWith: { coll: Company.collection.name, pipeline: source('company', filters) } });
    pipeline.push({ $facet: { meta: [{ $count: 'total' }], items: [{ $sort: { 'event.at': -1, kind: 1, target_id: 1, 'event.revision': -1 } }, { $skip: (page - 1) * limit }, { $limit: limit }] } });
    const [result] = await model.aggregate(pipeline).option({ maxTimeMS: 3000, allowDiskUse: false });
    const total = result?.meta[0]?.total || 0; const rows = result?.items || [];
    const actors = await User.find({ _id: { $in: rows.map(row => row.event.actor_id) } }).select('_id name').lean();
    const names = new Map(actors.map(actor => [String(actor._id), typeof actor.name === 'string' && actor.name ? actor.name.slice(0, 200) : null]));
    const items = rows.map(row => { const event = row.event; return { kind: row.kind, target_id: String(row.target_id), target_name: row.target_name, event: { actor_id: String(event.actor_id), actor_name: names.get(String(event.actor_id)) || null, actor_role: event.actor_role, at: event.at, request_id: event.request_id, action: event.action, revision: event.revision, fields: event.fields, ...(event.before ? { before: event.before } : {}), ...(event.after ? { after: event.after } : {}) } }; });
    const pages = Math.max(1, Math.ceil(total / limit));
    res.json({ success: true, filters, total, page, pages, limit, out_of_range: page > pages, retained_limit_per_target: 100, older_history_available: false, items });
  } catch (error) {
    if (error.code === 50 || error.codeName === 'MaxTimeMSExpired') return res.status(503).json({ success: false, message: 'استغرق البحث وقتًا طويلًا. ضيّق التواريخ أو اختر سجلًا محددًا وحاول مجددًا.' });
    next(error);
  }
};
