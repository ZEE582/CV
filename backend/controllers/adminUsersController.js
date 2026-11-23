const Joi = require('joi');
const User = require('../models/User');
const Company = require('../models/Company');
const { literalSearch } = require('../services/publicJobs');
const { versionQuery } = require('../config/jwtConfig');
const history = require('../services/managementHistory');
const fields = '_id name email phone role is_active isVerified is_verified provider createdAt updatedAt +admin_revision';
const roles = ['seeker', 'company', 'admin'];
const effectiveRole = value => value === 'user' ? 'seeker' : roles.includes(value) ? value : 'unknown';
const active = user => user.is_active === undefined || user.is_active === true;
const verified = user => user.is_verified === true || user.isVerified === true;
const revisionQuery = revision => revision === 0 ? { $or: [{ admin_revision: 0 }, { admin_revision: { $exists: false } }] } : { admin_revision: revision };
const querySchema = Joi.object({ scope: Joi.string().valid('all', 'staff').default('all'), search: Joi.string().trim().max(120).allow('').default(''), role: Joi.string().valid('all', ...roles, 'unknown').default('all'), state: Joi.string().valid('all', 'active', 'paused').default('all'), verification: Joi.string().valid('all', 'verified', 'unverified').default('all'), sort: Joi.string().valid('newest', 'oldest', 'name').default('newest'), page: Joi.number().integer().min(1).max(1000000).default(1), limit: Joi.number().integer().min(1).max(100).default(12) });
const revision = Joi.number().integer().min(0).strict();
const accessSchema = Joi.object({ role: Joi.string().valid(...roles), is_active: Joi.boolean().strict(), expected_revision: revision.required() }).or('role', 'is_active');
const legacySchema = Joi.object({ role: Joi.string().valid(...roles), is_active: Joi.boolean().strict(), expected_revision: revision.required() });
async function companyMap(ids) {
  const records = await Company.find({ user_id: { $in: ids } }).select('_id user_id name_ar is_active').sort({ name_ar: 1, _id: 1 }).lean();
  const result = new Map();
  for (const company of records) { const id = String(company.user_id); if (!result.has(id)) result.set(id, []); result.get(id).push({ _id: String(company._id), name_ar: company.name_ar, is_active: company.is_active === true }); }
  return result;
}
function dto(user, actorId, companies) {
  const role = effectiveRole(user.role); const self = String(user._id) === actorId; const fixed = self || role === 'admin' || role === 'unknown';
  const allowed = !fixed && role === 'seeker' && !companies.length ? ['seeker', ...(verified(user) ? ['admin'] : [])] : [role];
  return { _id: String(user._id), name: user.name || '', email: user.email, phone: user.phone || '', role, is_active: active(user), is_verified: verified(user), provider: user.provider || 'local', createdAt: user.createdAt || null, updatedAt: user.updatedAt || null, revision: user.admin_revision || 0, companies,
    capabilities: { can_change_status: !fixed, allowed_roles: allowed, reason: self ? 'self' : role === 'admin' ? 'administrator' : role === 'unknown' ? 'unknown_role' : role === 'company' ? 'company_account' : companies.length ? 'linked_company' : !verified(user) ? 'unverified_email' : null } };
}
exports.list = async (req, res, next) => {
  try {
    const { value: query, error } = querySchema.validate(req.query, { stripUnknown: true });
    if (error || (query.scope === 'staff' && !['all', 'admin'].includes(query.role))) return res.status(400).json({ success: false, message: 'معايير عرض الحسابات غير صالحة.' });
    const base = query.scope === 'staff' ? { role: 'admin' } : {}; const filter = { ...base }; const and = [];
    if (query.role === 'seeker') filter.role = { $in: ['seeker', 'user'] }; else if (query.role === 'unknown') filter.role = { $nin: [...roles, 'user'] }; else if (query.role !== 'all') filter.role = query.role;
    if (query.state === 'active') and.push({ $or: [{ is_active: true }, { is_active: { $exists: false } }] });
    if (query.state === 'paused') and.push({ is_active: { $exists: true, $ne: true } });
    if (query.verification === 'verified') and.push({ $or: [{ isVerified: true }, { is_verified: true }] });
    if (query.verification === 'unverified') and.push({ isVerified: { $ne: true }, is_verified: { $ne: true } });
    if (query.search) and.push({ $or: ['name', 'email', 'phone'].map(key => ({ [key]: { $regex: literalSearch(query.search), $options: 'i' } })) });
    if (and.length) filter.$and = and;
    const [total, groups] = await Promise.all([User.countDocuments(filter), User.aggregate([{ $match: base }, { $group: { _id: { role: { $switch: { branches: [{ case: { $in: ['$role', ['seeker', 'user']] }, then: 'seeker' }, { case: { $in: ['$role', ['company', 'admin']] }, then: '$role' }], default: 'unknown' } }, active: { $or: [{ $eq: ['$is_active', true] }, { $eq: [{ $type: '$is_active' }, 'missing'] }] } }, count: { $sum: 1 } } }])]);
    const counts = { all: 0, active: 0, paused: 0, roles: { seeker: 0, company: 0, admin: 0, unknown: 0 } };
    for (const group of groups) { counts.all += group.count; counts[group._id.active ? 'active' : 'paused'] += group.count; counts.roles[group._id.role] += group.count; }
    const pages = Math.max(1, Math.ceil(total / query.limit)); const page = Math.min(query.page, pages);
    const users = await User.find(filter).select(fields).sort(query.sort === 'name' ? { name: 1, _id: 1 } : { createdAt: query.sort === 'oldest' ? 1 : -1, _id: query.sort === 'oldest' ? 1 : -1 }).skip((page - 1) * query.limit).limit(query.limit).lean();
    const links = await companyMap(users.map(user => user._id));
    res.json({ success: true, scope: query.scope, total, page, pages, limit: query.limit, counts, users: users.map(user => dto(user, req.user.id, links.get(String(user._id)) || [])) });
  } catch (error) { next(error); }
};
exports.detail = async (req, res, next) => {
  try { const user = await User.findById(req.params.id).select(fields).lean(); if (!user) return res.status(404).json({ success: false, message: 'الحساب غير موجود.' }); const links = await companyMap([user._id]); res.json({ success: true, user: dto(user, req.user.id, links.get(String(user._id)) || []) }); } catch (error) { next(error); }
};
async function mutate(req, res, next, mode) {
  try {
    const { value: body, error } = (mode === 'access' ? accessSchema : mode === 'role' ? legacySchema.keys({ role: Joi.string().valid(...roles).required() }) : mode === 'toggle' ? legacySchema.keys({ is_active: Joi.boolean().strict().required() }) : legacySchema).validate(req.body || {}, { stripUnknown: true });
    if (error) return res.status(400).json({ success: false, message: 'راجع الحالة والصلاحية ونسخة الحساب.' });
    const user = await User.findById(req.params.id).select(fields + ' token_version').lean();
    if (!user) return res.status(404).json({ success: false, message: 'الحساب غير موجود.' });
    const currentRole = effectiveRole(user.role); const expected = body.expected_revision ?? user.admin_revision ?? 0;
    if (String(user._id) === req.user.id || currentRole === 'admin') return res.status(400).json({ success: false, code: 'PROTECTED_ADMIN_ACCOUNT', message: 'لا يمكن تعديل حالة حسابك الحالي أو صلاحية حساب مدير من هذه الصفحة.' });
    if (currentRole === 'unknown') return res.status(409).json({ success: false, message: 'دور الحساب غير معروف ويحتاج مراجعة مستقلة.' });
    if (expected !== (user.admin_revision || 0)) return res.status(409).json({ success: false, message: 'تغيّر الحساب منذ تحميله. حدّث القائمة.' });
    const desiredRole = body.role ?? currentRole; const desiredActive = mode === 'archive' ? false : body.is_active ?? (mode === 'toggle' ? !active(user) : active(user));
    const links = await companyMap([user._id]); const companies = links.get(String(user._id)) || [];
    if (desiredRole !== currentRole && (currentRole === 'company' || companies.length || desiredRole === 'company')) return res.status(409).json({ success: false, code: 'COMPANY_ACCOUNT_ROLE', message: 'صلاحيات حساب الشركة وربطه تُدار من مسار الشركات المخصص.' });
    if (desiredRole === 'admin' && (!verified(user) || !desiredActive)) return res.status(409).json({ success: false, code: 'ADMIN_REQUIRES_VERIFIED_ACTIVE', message: 'منح صلاحية المدير يحتاج حسابًا مفعّلًا وبريدًا مؤكدًا.' });
    if (desiredRole === currentRole && desiredActive === active(user)) return res.status(400).json({ success: false, code: 'NO_ACCOUNT_CHANGE', message: 'لم تتغير الحالة أو الصلاحية.' });
    const audit = history.entry(req, 'account.access', expected + 1, [...(desiredRole !== currentRole ? ['role'] : []), ...(desiredActive !== active(user) ? ['is_active'] : [])], { role: currentRole, is_active: active(user) }, { role: desiredRole, is_active: desiredActive });
    const updated = await User.findOneAndUpdate({ _id: user._id, role: user.role, is_active: user.is_active ?? null, $and: [revisionQuery(expected), versionQuery(user.token_version || 0)] }, history.append({ $set: { role: desiredRole, is_active: desiredActive }, $inc: { admin_revision: 1, token_version: 1 } }, audit), { new: true, runValidators: true }).select(fields).lean();
    if (!updated) return res.status(409).json({ success: false, code: 'ACCOUNT_CHANGED', message: 'تغيّرت حالة الحساب أو جلسته أثناء الحفظ. حدّث القائمة.' });
    res.json({ success: true, user_id: String(updated._id), revision: updated.admin_revision, role: effectiveRole(updated.role), is_active: active(updated), sessions_revoked: true, ...(mode === 'archive' ? { archived: true } : {}) });
  } catch (error) { next(error); }
}
exports.access = (req, res, next) => mutate(req, res, next, 'access');
exports.toggle = (req, res, next) => mutate(req, res, next, 'toggle');
exports.role = (req, res, next) => mutate(req, res, next, 'role');
exports.archive = (req, res, next) => mutate(req, res, next, 'archive');
exports.legacy = staff => async (_req, res, next) => { try { const users = await User.find(staff ? { role: 'admin' } : {}).select('_id name email phone role is_active').sort({ createdAt: -1, _id: -1 }).limit(100).lean(); res.set('Cache-Control', 'no-store').json(users.map(user => ({ id: String(user._id), name: user.name || '', email: user.email, ...(staff ? {} : { phone: user.phone || '' }), role: effectiveRole(user.role), access: effectiveRole(user.role), is_active: active(user) }))); } catch (error) { next(error); } };
