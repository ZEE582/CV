/**
 * @file models/ContactMessage.js
 */
const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema({
  company_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  sender_name:  { type: String, required: true },
  sender_email: { type: String, required: true },
  sender_phone: { type: String },
  subject:      { type: String, default: 'استفسار' },
  message:      { type: String, required: true },
  is_read:      { type: Boolean, default: false }
}, { timestamps: true });

contactMessageSchema.index({ company_id: 1 });

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
