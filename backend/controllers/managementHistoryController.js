const mongoose = require('mongoose');
const User = require('../models/User');
const Company = require('../models/Company');
exports.read = kind => async (req, res, next) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) return res.status(400).json({ success: false, message: 'معرّف السجل غير صالح.' });
    const model = kind === 'account' ? User : Company;
    const record = await model.findById(req.params.id).select({ _id: 1, change_history: 1, change_history_total: 1 }).lean();
    if (!record) return res.status(404).json({ success: false, message: 'السجل غير موجود.' });
    const events = record.change_history || [];
    const ids = events.map(event => event.actor_id).filter(id => mongoose.isValidObjectId(id));
    const actors = await User.find({ _id: { $in: ids } }).select('_id name').lean();
    const names = new Map(actors.map(actor => [String(actor._id), typeof actor.name === 'string' && actor.name ? actor.name.slice(0, 200) : null]));
    res.json({ success: true, kind, target_id: String(record._id), recorded_total: record.change_history_total || 0, retained_limit: 100, older_history_available: false, events: [...events].reverse().map(event => ({ actor_id: String(event.actor_id), actor_name: names.get(String(event.actor_id)) || null, actor_role: event.actor_role, at: event.at, request_id: event.request_id, action: event.action, revision: event.revision, fields: event.fields, ...(event.before ? { before: event.before } : {}), ...(event.after ? { after: event.after } : {}) })) });
  } catch (error) { next(error); }
};
