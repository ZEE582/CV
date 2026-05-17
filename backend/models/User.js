/**
 * @file models/User.js
 */
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  role:          { type: String, enum: ['seeker', 'company', 'admin'], default: 'seeker' },
  full_name:     { type: String },
  phone:         { type: String },
  avatar_url:    { type: String },
  is_verified:   { type: Boolean, default: false },
  is_active:     { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
