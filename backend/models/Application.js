/**
 * @file models/Application.js
 */
const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Job',     required: true },
  user_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  company_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  cover_letter: { type: String },
  cv_url:       { type: String },
  status:       { type: String, enum: ['pending', 'viewed', 'shortlisted', 'rejected', 'hired'], default: 'pending' }
}, { timestamps: true });

applicationSchema.index({ job_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
