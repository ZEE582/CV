const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const profile = require('../modules/auth/models/schemas/profileSchema');
const onboarding = require('../modules/auth/models/schemas/onboardingSchema');
const { historyFields } = require('../services/managementHistory');
const schema = new mongoose.Schema({
  ...profile, ...onboarding, ...historyFields,
  name: { type: String, trim: true, default: '', alias: 'full_name' },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true, validate: value => validator.isEmail(value) },
  password: { type: String, select: false, minlength: 8, required() { return this.provider === 'local' && !this.password_hash; } },
  password_hash: { type: String, select: false },
  role: { type: String, enum: ['seeker', 'company', 'admin', 'user'], default: 'seeker' },
  provider: { type: String, enum: ['local', 'google', 'github', 'linkedin'], default: 'local' },
  googleId: { type: String, select: false }, githubId: { type: String, select: false }, linkedinId: { type: String, select: false },
  isVerified: { type: Boolean, default: false }, is_verified: { type: Boolean, default: false },
  is_active: { type: Boolean, default: true }, hasCompletedQuestions: { type: Boolean, default: false },
  token_version: { type: Number, default: 0, min: 0 },
  admin_revision: { type: Number, default: 0, min: 0, select: false },
  phone: { type: String, default: '' }, avatar_url: String, score: { type: Number, min: 0, default: 0 },
  progress: {
    solvedProblems: [{ problemId: { type: String, ref: 'Problem' }, completedAt: { type: Date, default: Date.now }, codeSolution: String, notes: String }],
    studyPlans: { type: Map, of: { total: Number, completed: Number, lastAccessed: Date }, default: {} },
  },
  stats: { totalSolved: { type: Number, default: 0 }, easySolved: { type: Number, default: 0 }, mediumSolved: { type: Number, default: 0 }, hardSolved: { type: Number, default: 0 }, streak: { type: Number, default: 0 }, lastActive: Date },
}, { timestamps: true });
schema.pre('save', async function () {
  if (this.isModified('password') && this.password) this.password = await bcrypt.hash(this.password, 12);
});
function sanitize(_doc, value) {
  for (const key of ['password', 'password_hash', 'googleId', 'githubId', 'linkedinId', 'token_version', 'admin_revision', '__v', 'change_history', 'change_history_total']) delete value[key];
  if (value.role === 'user') value.role = 'seeker';
  return value;
}
schema.set('toJSON', { virtuals: true, transform: sanitize });
schema.set('toObject', { virtuals: true, transform: sanitize });
schema.methods.matchPassword = function (password) { return bcrypt.compare(password, this.password || this.password_hash || ''); };
module.exports = mongoose.model('User', schema);
