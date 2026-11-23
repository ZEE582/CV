/**
 * @file models/Application.js
 */
const mongoose = require('mongoose');

const jobSnapshotSchema = new mongoose.Schema({
  format_version: { type: Number, enum: [1], required: true }, captured_at: { type: Date, required: true },
  job_id: { type: mongoose.Schema.Types.ObjectId, required: true }, company_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  job_updated_at: { type: Date, default: null }, job_version: { type: Number, default: null },
  company_name: { type: String, required: true }, title: { type: String, required: true }, description: { type: String, required: true },
  requirements: [String], benefits: [String], location: { type: String, default: null }, region: { type: String, default: null }, field: { type: String, default: null },
  job_type: { type: String, default: null }, experience_level: { type: String, default: null },
  salary_min: { type: Number, default: null }, salary_max: { type: Number, default: null }, salary_currency: { type: String, default: '₪' },
  salary_visible: { type: Boolean, required: true }, deadline: { type: Date, default: null },
}, { _id: false });
jobSnapshotSchema.eachPath((_name, field) => field.immutable(true));
const statusHistorySchema = new mongoose.Schema({
  from_status: { type: String, enum: [null, 'pending', 'viewed', 'shortlisted', 'rejected', 'hired'], default: null },
  to_status: { type: String, enum: ['pending', 'viewed', 'shortlisted', 'rejected', 'hired'], required: true },
  at: { type: Date, required: true }, version: { type: Number, required: true, min: 0, validate: Number.isSafeInteger },
  actor_role: { type: String, enum: ['seeker', 'company', 'admin'], required: true },
  actor_id: { type: mongoose.Schema.Types.ObjectId, required: true },
}, { _id: false });

const applicationSchema = new mongoose.Schema({
  job_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Job',     required: true },
  user_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  company_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  cover_letter: { type: String },
  cv_url:       { type: String },
  cv_file: { type: new mongoose.Schema({ name: { type: String, required: true }, size: { type: Number, required: true, min: 1, max: 5 * 1024 * 1024 } }, { _id: false }), immutable: true, default: undefined },
  cv_file_data: { type: Buffer, select: false, immutable: true, default: undefined },
  job_snapshot: { type: jobSnapshotSchema, immutable: true, select: false, default: undefined },
  status_history: { type: [statusHistorySchema], select: false, default: undefined },
  status_history_count: { type: Number, select: false, default: undefined },
  history_from_submission: { type: Boolean, select: false, default: undefined },
  history_started_at: { type: Date, select: false, default: undefined },
  status:       {
    type: String,
    enum: ['pending', 'viewed', 'shortlisted', 'rejected', 'hired'],
    default: 'pending'
  }
}, { timestamps: true });

applicationSchema.index({ job_id: 1, user_id: 1 }, { unique: true });
applicationSchema.index({ user_id: 1 });
applicationSchema.index({ company_id: 1 });

// Query middleware also covers dotted paths that nested immutable flags do not protect.
const snapshotPath = path => path === 'job_snapshot' || path.startsWith('job_snapshot.');
const immutableSnapshot = () => new Error('The saved job advertisement cannot be modified.');
applicationSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate'], function () {
  const update = this.getUpdate();
  if (Array.isArray(update)) throw immutableSnapshot();
  for (const [operation, value] of Object.entries(update || {})) {
    if (snapshotPath(operation)) throw immutableSnapshot();
    if (operation.startsWith('$') && value && typeof value === 'object') {
      for (const [path, target] of Object.entries(value)) if (snapshotPath(path) || (operation === '$rename' && typeof target === 'string' && snapshotPath(target))) throw immutableSnapshot();
    }
  }
});
applicationSchema.pre(['replaceOne', 'findOneAndReplace'], function () { throw immutableSnapshot(); });
applicationSchema.pre('save', function () { if (!this.isNew && this.isModified('job_snapshot')) throw immutableSnapshot(); });

module.exports = mongoose.model('Application', applicationSchema);
