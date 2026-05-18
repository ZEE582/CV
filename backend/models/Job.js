/**
 * @file models/Job.js
 */
const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  company_id:         { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  title:              { type: String, required: true },
  description:        { type: String, required: true },
  requirements:       [String],
  benefits:           [String],
  location:           { type: String },
  region:             { type: String, enum: ['ضفة', 'قدس', 'غزة', '48', 'remote'] },
  field:              { type: String },
  job_type:           { type: String, enum: ['دوام كامل', 'دوام جزئي', 'عقد مؤقت', 'عمل عن بُعد', 'تدريب مدفوع', 'فريلانس'] },
  experience_level:   { type: String, enum: ['حديث التخرج', '1-3 سنوات', '3-5 سنوات', '+5 سنوات', 'قيادي'] },
  salary_min:         { type: Number },
  salary_max:         { type: Number },
  salary_currency:    { type: String, default: '₪' },
  salary_visible:     { type: Boolean, default: true },
  deadline:           { type: Date },
  is_featured:        { type: Boolean, default: false },
  is_active:          { type: Boolean, default: true },
  views_count:        { type: Number, default: 0 },
  applications_count: { type: Number, default: 0 }
}, { timestamps: true });

jobSchema.index({ is_active: 1, createdAt: -1 });
jobSchema.index({ company_id: 1 });
jobSchema.index({ field: 1 });
jobSchema.index({ region: 1 });
jobSchema.index({ is_featured: -1 });

module.exports = mongoose.model('Job', jobSchema);
