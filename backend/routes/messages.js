/**
 * @file routes/messages.js
 */
const express        = require('express');
const ContactMessage = require('../models/ContactMessage');
const Company        = require('../models/Company');
const { validate, schemas } = require('../middleware/validate');

const router = express.Router();

// POST /api/messages
router.post('/', validate(schemas.message), async (req, res, next) => {
  try {
    const { company_id, sender_name, sender_email, sender_phone, subject, message } = req.body;

    const co = await Company.findOne({ _id: company_id, is_active: true });
    if (!co) return res.status(404).json({ success: false, message: 'الشركة غير موجودة', code: 'COMPANY_NOT_FOUND' });

    await ContactMessage.create({ company_id, sender_name, sender_email, sender_phone, subject, message });
    res.status(201).json({ success: true, message: 'تم إرسال رسالتك بنجاح، ستتواصل معك الشركة قريباً' });
  } catch (err) { next(err); }
});

module.exports = router;
