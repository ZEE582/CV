const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { query } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'البريد وكلمة السر مطلوبان' });

    const rows = await query('SELECT * FROM users WHERE email=? AND is_active=1', [email]);
    if (!rows[0] || !(await bcrypt.compare(password, rows[0].password_hash)))
      return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });

    const user  = rows[0];
    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET,
                            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

    let companyId = null;
    if (user.role === 'company') {
      const cos = await query('SELECT id FROM companies WHERE user_id=?', [user.id]);
      if (cos[0]) companyId = cos[0].id;
    }

    res.json({ success: true, token,
               user: { id: user.id, email: user.email, role: user.role,
                       full_name: user.full_name, companyId } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, phone } = req.body;
    if (!email || !password || !full_name)
      return res.status(400).json({ success: false, message: 'يرجى ملء جميع الحقول المطلوبة' });

    if ((await query('SELECT id FROM users WHERE email=?', [email])).length)
      return res.status(409).json({ success: false, message: 'البريد الإلكتروني مسجّل مسبقاً' });

    const hash = await bcrypt.hash(password, 10);
    await query('INSERT INTO users (id,email,password_hash,role,full_name,phone) VALUES (UUID(),?,?,\'seeker\',?,?)',
                [email, hash, full_name, phone || null]);

    const [[u]] = await query('SELECT id FROM users WHERE email=?', [email]);
    await query('INSERT INTO seeker_profiles (id,user_id) VALUES (UUID(),?)', [u.id]);

    res.status(201).json({ success: true, message: 'تم إنشاء الحساب بنجاح' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    let companyId = null;
    if (req.user.role === 'company') {
      const cos = await query('SELECT id FROM companies WHERE user_id=?', [req.user.id]);
      if (cos[0]) companyId = cos[0].id;
    }
    res.json({ success: true, user: { ...req.user, companyId } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

module.exports = router;
