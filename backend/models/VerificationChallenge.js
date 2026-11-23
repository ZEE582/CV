const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  _id: String,
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true, lowercase: true },
  codeHash: { type: String, required: true, select: false },
  attempts: { type: Number, default: 0 },
  token_version: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true }, lastSentAt: { type: Date, required: true },
}, { versionKey: false });
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
schema.index({ user_id: 1 });
module.exports = mongoose.model('VerificationChallenge', schema);
