/**
 * @file models/User.js
 * @description نموذج المستخدم الموحد
 *
 * الأدوار:
 *  seeker  → باحث عن عمل (الافتراضي عند التسجيل الذاتي)
 *  company → حساب شركة (ينشئه الأدمن فقط عبر POST /api/auth/company-account)
 *  admin   → مدير المنصة (يُضاف يدوياً في قاعدة البيانات أو بـ seed)
 */
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  role:          { type: String, enum: ['seeker', 'company', 'admin'], default: 'seeker' },
  full_name:     { type: String, trim: true },
  phone:         { type: String, trim: true },
  avatar_url:    { type: String },
  is_verified:   { type: Boolean, default: false },
  is_active:     { type: Boolean, default: true }
}, { timestamps: true });

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
