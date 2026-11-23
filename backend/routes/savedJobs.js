/**
 * @file routes/savedJobs.js
 * @description مسارات الوظائف المحفوظة
 *
 * @swagger
 * tags:
 *   name: Saved Jobs
 *   description: حفظ الوظائف المفضلة — يتطلب تسجيل الدخول
 */

const express = require('express');
const ctrl    = require('../controllers/savedJobsController');
const { authenticate }  = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/saved-jobs:
 *   post:
 *     summary: حفظ وظيفة
 *     tags: [Saved Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [job_id]
 *             properties:
 *               job_id: { type: string }
 *     responses:
 *       201: { description: تم الحفظ }
 *       409: { description: محفوظة مسبقاً }
 */
router.post('/', authenticate, ctrl.save);

/**
 * @swagger
 * /api/saved-jobs:
 *   get:
 *     summary: الوظائف المحفوظة
 *     tags: [Saved Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: قائمة الوظائف المحفوظة
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:    { type: boolean }
 *                 total:      { type: integer }
 *                 saved_jobs: { type: array }
 */
router.get('/', authenticate, ctrl.getMySaved);

/**
 * @swagger
 * /api/saved-jobs/{jobId}:
 *   delete:
 *     summary: إزالة وظيفة من المحفوظات
 *     tags: [Saved Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: jobId, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: تم الإزالة }
 *       404: { description: غير محفوظة }
 */
router.delete('/:jobId', authenticate, ctrl.unsave);

module.exports = router;
