/**
 * @file routes/auth.js
 * @description مسارات المصادقة — تسجيل الدخول والخروج وتسجيل الحسابات
 * ملاحظة: يتطلب إضافة جدول users في قاعدة البيانات لتفعيل كامل
 */

const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcryptjs');
const pool    = require('../config/db');

const JWT_SECRET     = process.env.JWT_SECRET || 'foras_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// ── Middleware: التحقق من التوكن ─────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, message: 'التوكن مطلوب' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ success: false, message: 'توكن غير صالح أو منتهي الصلاحية' });
  }
}

// ── POST /api/auth/register ──────────────────────────────────────────────────
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: تسجيل حساب جديد
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:     { type: string }
 *               email:    { type: string, format: email }
 *               password: { type: string, minLength: 6 }
 *     responses:
 *       201: { description: تم إنشاء الحساب }
 *       400: { description: بيانات غير صحيحة }
 *       409: { description: البريد الإلكتروني مستخدم }
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'جميع الحقول مطلوبة' });

    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0)
      return res.status(409).json({ success: false, message: 'البريد الإلكتروني مستخدم بالفعل' });

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, created_at) VALUES (?, ?, ?, NOW())',
      [name.trim(), email.toLowerCase().trim(), hashed]
    );

    const token = jwt.sign({ id: result.insertId, email, name }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      token,
      user: { id: result.insertId, name, email }
    });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────────────────────
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: تسجيل الدخول
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: تم تسجيل الدخول }
 *       401: { description: بيانات غير صحيحة }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: 'البريد الإلكتروني وكلمة المرور مطلوبان' });

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (rows.length === 0)
      return res.status(401).json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: بيانات المستخدم الحالي
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: بيانات المستخدم }
 *       401: { description: غير مصادق }
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });

    res.json({ success: true, user: rows[0] });
  } catch (err) {
    console.error('me error:', err);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// ── POST /api/auth/logout ────────────────────────────────────────────────────
/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: تسجيل الخروج
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: تم تسجيل الخروج }
 */
router.post('/logout', authMiddleware, (_req, res) => {
  // JWT stateless — الـ token يُحذف من جانب العميل
  res.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
});

module.exports = router;
module.exports.authMiddleware = authMiddleware;
