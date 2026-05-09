/**
 * @file routes/messages.js
 * @description مسار إرسال رسائل التواصل للشركات — عام بدون تسجيل دخول
 *
 * ملاحظة: مسارات قراءة وحذف الرسائل (GET/PUT/DELETE) ستُضاف ضمن وحدة الداشبورد
 *
 * المسارات المتاحة:
 *   POST / — إرسال رسالة لشركة (عام، بدون auth)
 */

const express  = require('express');
const { query } = require('../config/db');
const { validate, schemas } = require('../middleware/validate');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: رسائل التواصل مع الشركات
 */

/**
 * @swagger
 * /api/messages:
 *   post:
 *     summary: إرسال رسالة لشركة (متاح للجميع بدون تسجيل)
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
 *               company_id:   { type: string, format: uuid }
 *               sender_name:  { type: string, example: محمد أحمد }
 *               sender_email: { type: string, format: email }
 *               sender_phone: { type: string, nullable: true }
 *               subject:      { type: string, default: استفسار }
 *               message:      { type: string, minLength: 10 }
 *     responses:
 *       201:
 *         description: تم إرسال الرسالة بنجاح
 *       400:
 *         description: بيانات ناقصة أو غير صالحة
 *       404:
 *         description: الشركة غير موجودة
 */
router.post('/', validate(schemas.message), async (req, res, next) => {
  try {
    const { company_id, sender_name, sender_email, sender_phone, subject, message } = req.body;

    // التحقق من وجود الشركة وأنها نشطة
    const [co] = await query(
      'SELECT id FROM companies WHERE id = ? AND is_active = 1',
      [company_id]
    );

    if (!co) {
      return res.status(404).json({
        success: false,
        message: 'الشركة غير موجودة',
        code: 'COMPANY_NOT_FOUND'
      });
    }

    await query(
      `INSERT INTO contact_messages
         (id, company_id, sender_name, sender_email, sender_phone, subject, message)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?)`,
      [
        company_id,
        sender_name,
        sender_email,
        sender_phone || null,
        subject || 'استفسار',
        message
      ]
    );

    res.status(201).json({
      success: true,
      message: 'تم إرسال رسالتك بنجاح، ستتواصل معك الشركة قريباً'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
