/**
 * @file routes/messages.js
 * @description مسارات الرسائل
 *
 * @swagger
 * tags:
 *   name: Messages
 *   description: تواصل مع الشركات
 */

const express        = require('express');
const ContactMessage = require('../models/ContactMessage');
const Company        = require('../models/Company');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate, schemas }         = require('../middleware/validate');

const router = express.Router();

/**
 * @swagger
 * /api/messages:
 *   post:
 *     summary: إرسال رسالة لشركة (عام — لا يتطلب توكن)
 *     tags: [Messages]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [company_id, sender_name, sender_email, message]
 *             properties:
 *               company_id:   { type: string }
 *               sender_name:  { type: string }
 *               sender_email: { type: string, format: email }
 *               sender_phone: { type: string }
 *               subject:      { type: string }
 *               message:      { type: string }
 *     responses:
 *       201: { description: تم إرسال الرسالة }
 *       404: { description: الشركة غير موجودة }
 */
router.post('/', validate(schemas.message), async (req, res, next) => {
  try {
    const { company_id, sender_name, sender_email, sender_phone, subject, message } = req.body;
    const co = await Company.findOne({ _id: company_id, is_active: true });
    if (!co)
      return res.status(404).json({ success: false, message: 'الشركة غير موجودة', code: 'COMPANY_NOT_FOUND' });

    await ContactMessage.create({ company_id, sender_name, sender_email, sender_phone, subject, message });
    res.status(201).json({ success: true, message: 'تم إرسال رسالتك بنجاح، ستتواصل معك الشركة قريباً' });
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /api/messages/company/{companyId}:
 *   get:
 *     summary: رسائل شركة (company مالكة | admin)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: companyId, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: قائمة الرسائل }
 *       403: { description: company أو admin فقط }
 */
router.get('/company/:companyId', authenticate, requireRole('company', 'admin'), async (req, res, next) => {
  try {
    const messages = await ContactMessage.find({ company_id: req.params.companyId })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, total: messages.length, messages });
  } catch (err) { next(err); }
});

module.exports = router;
