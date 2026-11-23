const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  date: { type: String, required: true, maxlength: 10 },
  color: { type: String, maxlength: 7 },
  is_archived: { type: Boolean, default: false },
  creation_key: { type: String, select: false }, creation_hash: { type: String, select: false },
}, { timestamps: true });
schema.index({ creation_key: 1 }, { unique: true, partialFilterExpression: { creation_key: { $type: 'string' } } });
module.exports = mongoose.model('ManagementEvent', schema);
