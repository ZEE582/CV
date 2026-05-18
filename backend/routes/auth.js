/**
 * @file routes/auth.js
 * @description مسارات المصادقة الموحدة
 *
 * @swagger
 * tags:
 *   name: Auth
 *   description: تسجيل الدخول والتسجيل وإدارة الحسابات
 */

const express = require('express');
const ctrl    = require('../controllers/authController');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate, schemas }         = require('../middleware/validate');

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: تسجيل مستخدم جديد (seeker)
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, full_name]
 *             properties:
 *               email:     { type: string, format: email }
 *               password:  { type: string, minLength: 6 }
 *               full_name: { type: string }
 *               phone:     { type: string }
 *     responses:
 *       201: { description: تم إنشاء الحساب }
 *       409: { description: البريد مستخدم }
 *       400: { description: بيانات غير صالحة }
 */
router.post('/register', validate(schemas.register), ctrl.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: تسجيل الدخول (جميع الأدوار)
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
 *               email:    { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200: { description: تم تسجيل الدخول بنجاح }
 *       401: { description: بيانات غير صحيحة }
 *       403: { description: الحساب موقوف }
 */
router.post('/login', validate(schemas.login), ctrl.login);

/**
 * @swagger
 * /api/auth/company-account:
 *   post:
 *     summary: إنشاء حساب شركة (admin فقط)
 *     description: الأدمن يحدد الإيميل وكلمة المرور — ينشئ حساباً بدور company
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:      { type: string, format: email }
 *               password:   { type: string, minLength: 6 }
 *               full_name:  { type: string }
 *               company_id: { type: string, description: "ربط بشركة موجودة (اختياري)" }
 *     responses:
 *       201: { description: تم إنشاء حساب الشركة }
 *       403: { description: admin فقط }
 */
router.post('/company-account',
  authenticate,
  requireRole('admin'),
  validate(schemas.createCompanyAccount),
  ctrl.createCompanyAccount
);

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
 *       401: { description: توكن مطلوب }
 */
router.get('/me', authenticate, ctrl.me);

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: تغيير كلمة المرور
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [current_password, new_password]
 *             properties:
 *               current_password: { type: string }
 *               new_password:     { type: string, minLength: 6 }
 *     responses:
 *       200: { description: تم تغيير كلمة المرور }
 *       401: { description: كلمة المرور الحالية خاطئة }
 */
router.put('/change-password', authenticate, validate(schemas.changePassword), ctrl.changePassword);

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
router.post('/logout', authenticate, ctrl.logout);

module.exports = router;
