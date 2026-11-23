const mongoose = require('mongoose');
const { randomUUID } = require('node:crypto');
const actions = ['account.access', 'company.create', 'company.update', 'company.archive', 'company.verify', 'company.link_account'];
const stateSchema = new mongoose.Schema({ role: { type: String, enum: ['seeker', 'company', 'admin'] }, is_active: Boolean, is_verified: Boolean, account_linked: Boolean }, { _id: false });
const entrySchema = new mongoose.Schema({ actor_id: { type: mongoose.Schema.Types.ObjectId, required: true }, actor_role: { type: String, enum: ['admin', 'company'], required: true }, at: { type: Date, required: true }, request_id: { type: String, required: true, maxlength: 36 }, action: { type: String, enum: actions, required: true }, revision: { type: Number, min: 0, required: true }, fields: [{ type: String, maxlength: 60 }], before: stateSchema, after: stateSchema }, { _id: false });
const historyFields = { change_history: { type: [entrySchema], select: false, default: undefined }, change_history_total: { type: Number, min: 0, select: false, default: 0 } };
const companyState = company => ({ is_active: company.is_active === true, is_verified: company.is_verified === true, account_linked: !!company.user_id });
function entry(req, action, revision, fields, before, after) {
  return { actor_id: req.user.id, actor_role: req.user.role, at: new Date(), request_id: req.requestId || randomUUID(), action, revision, fields: [...new Set(fields)].sort(), before, after };
}
function append(update, event) {
  return { ...update, $inc: { ...update.$inc, change_history_total: 1 }, $push: { ...update.$push, change_history: { $each: [event], $slice: -100 } } };
}
function hideHistory(_doc, value) { delete value.change_history; delete value.change_history_total; return value; }
module.exports = { historyFields, entry, append, companyState, hideHistory, actions };
