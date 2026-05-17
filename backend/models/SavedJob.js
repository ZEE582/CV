/**
 * @file models/SavedJob.js
 */
const mongoose = require('mongoose');

const savedJobSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Job',  required: true }
}, { timestamps: true });

savedJobSchema.index({ user_id: 1, job_id: 1 }, { unique: true });

module.exports = mongoose.model('SavedJob', savedJobSchema);
