const Joi = require('joi'); const { createHash } = require('node:crypto');
const Event = require('../models/ManagementEvent'); const { literalSearch } = require('../services/publicJobs');
const fields = '_id title date color is_archived __v updatedAt'; const defaultColor = '#2196f3';
function civilDate(value) { if (!/^(19|20|21)\d{2}-\d{2}-\d{2}$/.test(value)) return false; const date = new Date(value + 'T00:00:00Z'); return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value; }
const date = Joi.string().custom((value, helpers) => civilDate(value) ? value : helpers.error('any.invalid'));
const version = Joi.number().integer().min(0).strict().required();
const eventFields = { title: Joi.string().trim().min(1).max(200), date, color: Joi.string().pattern(/^#[a-f\d]{6}$/i).lowercase() };
const createSchema = Joi.object({ ...eventFields, title: eventFields.title.required(), date: date.required(), request_id: Joi.string().guid({ version: ['uuidv4'] }) });
const editSchema = Joi.object({ ...eventFields, expected_version: version }).or('title', 'date', 'color');
const stateSchema = Joi.object({ is_archived: Joi.boolean().strict().required(), expected_version: version });
const querySchema = Joi.object({ month: Joi.string().pattern(/^(19|20|21)\d{2}-(0[1-9]|1[0-2])$/).required(), date: date.required(), state: Joi.string().valid('active', 'archived', 'all').default('active'), search: Joi.string().trim().max(120).allow('').default(''), page: Joi.number().integer().min(1).max(1000000).default(1), limit: Joi.number().integer().min(1).max(100).default(12) });
const dto = event => ({ id: String(event._id), title: event.title, date: event.date, color: event.color || defaultColor, is_archived: event.is_archived === true, version: event.__v || 0, updatedAt: event.updatedAt || null });
const versionFilter = value => value === 0 ? { $or: [{ __v: 0 }, { __v: { $exists: false } }] } : { __v: value };
function validate(schema, input, res) { const result = schema.validate(input, { stripUnknown: true }); if (result.error) { res.status(400).json({ success: false, message: 'راجع عنوان النشاط والتاريخ والنسخة المطلوبة.' }); return null; } return result.value; }
function conflict(res) { return res.status(409).json({ success: false, message: 'تغيّر النشاط منذ تحميله. أعد قراءة أحدث بياناته.' }); }
exports.list = async (req, res, next) => {
  try {
    const query = validate(querySchema, req.query, res); if (!query) return;
    if (query.date.slice(0, 7) !== query.month) return res.status(400).json({ success: false, message: 'اليوم المختار يجب أن يكون ضمن الشهر المعروض.' });
    const month = { date: { $gte: query.month + '-01', $lte: query.month + '-31' } }; const filter = { ...month };
    if (query.state !== 'all') filter.is_archived = query.state === 'archived' ? true : { $ne: true };
    if (query.search) filter.title = { $regex: literalSearch(query.search), $options: 'i' };
    const [days, states] = await Promise.all([Event.aggregate([{ $match: filter }, { $group: { _id: '$date', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]), Event.aggregate([{ $match: month }, { $group: { _id: { $eq: ['$is_archived', true] }, count: { $sum: 1 } } }])]);
    const counts = { all: 0, active: 0, archived: 0 }; for (const group of states) { counts.all += group.count; counts[group._id ? 'archived' : 'active'] += group.count; }
    const total = days.find(day => day._id === query.date)?.count || 0; const pages = Math.max(1, Math.ceil(total / query.limit)); const page = Math.min(query.page, pages);
    const events = await Event.find({ ...filter, date: query.date }).select(fields).sort({ createdAt: 1, _id: 1 }).skip((page - 1) * query.limit).limit(query.limit).lean();
    res.json({ success: true, month: query.month, date: query.date, state: query.state, total, page, pages, limit: query.limit, counts, matching: days.reduce((sum, day) => sum + day.count, 0), days: days.map(day => ({ date: day._id, count: day.count })), events: events.map(dto) });
  } catch (error) { next(error); }
};
exports.detail = async (req, res, next) => { try { const event = await Event.findById(req.params.id).select(fields).lean(); if (!event) return res.status(404).json({ success: false, message: 'النشاط غير موجود.' }); res.json({ success: true, event: dto(event) }); } catch (error) { next(error); } };
exports.create = async (req, res, next) => {
  try {
    const body = validate(createSchema, req.body || {}, res); if (!body) return; const values = { title: body.title, date: body.date, color: body.color || defaultColor }; const key = body.request_id ? req.user.id + ':' + body.request_id : null; const hash = createHash('sha256').update(JSON.stringify(values)).digest('hex');
    const replay = record => record.creation_hash !== hash ? res.status(409).json({ success: false, message: 'طلب الإضافة نفسه استُخدم ببيانات مختلفة. راجع التقويم.' }) : res.json({ success: true, ...dto(record), replayed: true, request_id: body.request_id });
    if (key) { await Event.init(); const previous = await Event.findOne({ creation_key: key }).select(fields + ' +creation_hash').lean(); if (previous) return replay(previous); }
    let event; try { event = await Event.create({ ...values, ...(key ? { creation_key: key, creation_hash: hash } : {}) }); }
    catch (error) { if (key && error.code === 11000) { const previous = await Event.findOne({ creation_key: key }).select(fields + ' +creation_hash').lean(); if (previous) return replay(previous); } throw error; }
    res.status(201).json({ success: true, ...dto(event), replayed: false, ...(body.request_id ? { request_id: body.request_id } : {}) });
  } catch (error) { next(error); }
};
exports.edit = async (req, res, next) => {
  try {
    const body = validate(editSchema, req.body || {}, res); if (!body) return; const event = await Event.findById(req.params.id).select(fields).lean(); if (!event) return res.status(404).json({ success: false, message: 'النشاط غير موجود.' });
    if ((event.__v || 0) !== body.expected_version || event.is_archived === true) return conflict(res);
    const changes = {}; for (const key of ['title', 'date', 'color']) if (body[key] !== undefined && body[key] !== event[key]) changes[key] = body[key];
    if (!Object.keys(changes).length) return res.status(400).json({ success: false, message: 'لم تتغير بيانات النشاط.' });
    const updated = await Event.findOneAndUpdate({ _id: event._id, is_archived: { $ne: true }, ...versionFilter(body.expected_version) }, { $set: changes, $inc: { __v: 1 } }, { new: true, runValidators: true }).select(fields).lean(); if (!updated) return conflict(res);
    res.json({ success: true, event: dto(updated) });
  } catch (error) { next(error); }
};
async function changeState(req, res, next, archive) {
  try {
    const body = validate(stateSchema, archive ? { ...(req.body || {}), is_archived: true } : req.body || {}, res); if (!body) return; const event = await Event.findById(req.params.id).select(fields).lean(); if (!event) return res.status(404).json({ success: false, message: 'النشاط غير موجود.' });
    if ((event.__v || 0) !== body.expected_version) return conflict(res);
    if ((event.is_archived === true) === body.is_archived) return res.status(400).json({ success: false, message: 'لم تتغير حالة النشاط.' });
    const updated = await Event.findOneAndUpdate({ _id: event._id, ...versionFilter(body.expected_version) }, { $set: { is_archived: body.is_archived }, $inc: { __v: 1 } }, { new: true, runValidators: true }).select(fields).lean(); if (!updated) return conflict(res);
    res.json({ success: true, event: dto(updated), ...(archive ? { archived: true } : {}) });
  } catch (error) { next(error); }
}
exports.state = (req, res, next) => changeState(req, res, next, false);
exports.archive = (req, res, next) => changeState(req, res, next, true);
exports.legacy = async (_req, res, next) => { try { const events = await Event.find({ is_archived: { $ne: true } }).select(fields).sort({ date: 1, _id: 1 }).limit(500).lean(); res.json(events.map(dto)); } catch (error) { next(error); } };
