/**
 * @file models/Company.js
 */
const mongoose = require('mongoose');

const stackItemSchema = new mongoose.Schema({ name: String, icon: String }, { _id: false });

const companySchema = new mongoose.Schema({
  user_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name_ar:      { type: String, required: true },
  name_en:      { type: String },
  logo_url:     { type: String },
  cover_url:    { type: String },
  sector:       { type: String },
  size:         { type: String },
  founded_year: { type: Number },
  location:     { type: String },
  region:       { type: String, enum: ['ضفة', 'قدس', 'غزة', '48', 'remote'] },
  website:      { type: String },
  email:        { type: String },
  linkedin_url: { type: String },
  about_ar:     { type: String },
  about_en:     { type: String },
  color:        { type: String, default: '#1a7a4a' },
  is_verified:  { type: Boolean, default: false },
  is_active:    { type: Boolean, default: true },
  views_count:  { type: Number, default: 0 },
  // Stacks من ملف JSON
  stacks: {
    backend:               [stackItemSchema],
    frontend:              [stackItemSchema],
    database:              [stackItemSchema],
    devops:                [stackItemSchema],
    analytics:             [stackItemSchema],
    programming_languages: [stackItemSchema],
    available_stacks:      [String]
  }
}, { timestamps: true });

companySchema.index({ is_active: 1, is_verified: -1, name_ar: 1 });

module.exports = mongoose.model('Company', companySchema);
