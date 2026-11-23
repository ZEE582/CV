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
  is_read:      { type: Boolean, default: false },
  client_request_id: { type: String, select: false },
  payload_fingerprint: { type: String, select: false }
}, { timestamps: true });

contactMessageSchema.index({ company_id: 1 });
contactMessageSchema.index({ is_read: 1 });
contactMessageSchema.index({ company_id: 1, createdAt: -1, _id: -1 });
contactMessageSchema.index({ company_id: 1, client_request_id: 1 }, { unique: true, name: 'message_submission_per_company', partialFilterExpression: { client_request_id: { $type: 'string' } } });

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
