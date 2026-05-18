/**
 * @file routes/cv.js
 * @description مسارات صفحة CV Builder
 *
 * @swagger
 * tags:
 *   name: CV Builder
 *   description: بناء وحفظ السيرة الذاتية — يتطلب تسجيل الدخول
 */

const express = require('express');
const ctrl    = require('../controllers/cvController');
const { authenticate }      = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

const router = express.Router();

/**
 * @swagger
 * /api/cv:
 *   post:
 *     summary: حفظ/تحديث السيرة الذاتية
 *     tags: [CV Builder]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CVInput'
 *     responses:
 *       200: { description: تم الحفظ }
 *       401: { description: توكن مطلوب }
 */
router.post('/', authenticate, validate(schemas.cv), ctrl.save);

/**
 * @swagger
 * /api/cv/my:
 *   get:
 *     summary: جلب سيرتي الذاتية
 *     tags: [CV Builder]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: السيرة الذاتية }
 *       404: { description: لم يُنشأ CV بعد }
 */
router.get('/my', authenticate, ctrl.getMy);

/**
 * @swagger
 * /api/cv:
 *   delete:
 *     summary: حذف السيرة الذاتية
 *     tags: [CV Builder]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: تم الحذف }
 *       404: { description: غير موجودة }
 */
router.delete('/', authenticate, ctrl.remove);

module.exports = router;
