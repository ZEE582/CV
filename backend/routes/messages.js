const express = require('express');
const { query } = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');
const router = express.Router();

// POST /api/messages — anyone
router.post('/', async (req, res) => {
  try {
    const { company_id, sender_name, sender_email, sender_phone, subject, message } = req.body;
    if (!company_id || !sender_name || !sender_email || !message)
      return res.status(400).json({ success: false, message: 'يرجى ملء جميع الحقول المطلوبة' });

    const [co] = await query('SELECT id FROM companies WHERE id=?', [company_id]);
    if (!co) return res.status(404).json({ success: false, message: 'الشركة غير موجودة' });

    await query(
      'INSERT INTO contact_messages (id,company_id,sender_name,sender_email,sender_phone,subject,message) VALUES (UUID(),?,?,?,?,?,?)',
      [company_id, sender_name, sender_email, sender_phone||null, subject||'استفسار', message]
    );
    res.status(201).json({ success: true, message: 'تم إرسال رسالتك بنجاح' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// GET /api/messages/company
router.get('/company', authenticate, requireRole('company','admin'), async (req, res) => {
  try {
    let coId = req.query.company_id;
    if (req.user.role === 'company') {
      const [co] = await query('SELECT id FROM companies WHERE user_id=?', [req.user.id]);
      if (!co) return res.status(403).json({ success: false, message: 'لا توجد شركة' });
      coId = co.id;
    }
    const extra = coId ? 'WHERE m.company_id=?' : '';
    const params = coId ? [coId] : [];
    const msgs = await query(
      `SELECT m.*,c.name_ar AS company_name
       FROM contact_messages m JOIN companies c ON m.company_id=c.id
       ${extra} ORDER BY m.created_at DESC`,
      params
    );
    res.json({ success: true, messages: msgs });
  } catch (e) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// PUT /api/messages/:id/read
router.put('/:id/read', authenticate, requireRole('company','admin'), async (req, res) => {
  try {
    await query('UPDATE contact_messages SET is_read=1 WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// DELETE /api/messages/:id
router.delete('/:id', authenticate, requireRole('company','admin'), async (req, res) => {
  try {
    await query('DELETE FROM contact_messages WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'تم حذف الرسالة' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

module.exports = router;
