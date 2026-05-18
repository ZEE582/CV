/**
 * @file models/CV.js
 * @description نموذج السيرة الذاتية — صفحة CV Builder
 * مستخدم واحد = سيرة واحدة (upsert)
 */
const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema({
  degree:      String,
  institution: String,
  field:       String,
  start_year:  Number,
  end_year:    Number,
  description: String
}, { _id: false });

const experienceSchema = new mongoose.Schema({
  title:       String,
  company:     String,
  location:    String,
  start_date:  String,
  end_date:    String,
  is_current:  { type: Boolean, default: false },
  description: String
}, { _id: false });

const skillSchema = new mongoose.Schema({
  name:  String,
  level: { type: String, enum: ['مبتدئ', 'متوسط', 'متقدم', 'خبير'], default: 'متوسط' }
}, { _id: false });

const languageSchema = new mongoose.Schema({
  name:  String,
  level: { type: String, enum: ['أساسي', 'متوسط', 'جيد', 'ممتاز', 'اللغة الأم'], default: 'متوسط' }
}, { _id: false });

const cvSchema = new mongoose.Schema({
  user_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  template:     { type: String, default: 'classic' },
  summary:      { type: String },
  personal_info: {
    full_name:  String,
    email:      String,
    phone:      String,
    location:   String,
    linkedin:   String,
    github:     String,
    website:    String,
    avatar_url: String
  },
  education:   [educationSchema],
  experience:  [experienceSchema],
  skills:      [skillSchema],
  languages:   [languageSchema]
}, { timestamps: true });

cvSchema.index({ user_id: 1 });

module.exports = mongoose.model('CV', cvSchema);
