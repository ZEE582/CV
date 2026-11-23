const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  // Keyed email digest also reserves a cooldown for nonexistent accounts.
  _id: String,
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  token_version: { type: Number, default: 0 },
  nonceHash: { type: String, required: true, select: false },
  codeHash: { type: String, required: true, select: false },
  attempts: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true }, lastSentAt: { type: Date, required: true },
}, { versionKey: false });
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
module.exports = mongoose.model('PasswordResetChallenge', schema);
