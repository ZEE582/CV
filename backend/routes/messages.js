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
const { authenticate, requireRole, requireCompanyOwnerOrAdmin } = require('../middleware/auth');
const { rateLimit } = require('express-rate-limit');
const { validate, schemas }         = require('../middleware/validate');

const { createHash } = require('node:crypto');
const { literalSearch } = require('../services/publicJobs');
const versionWhere = version => version === 0 ? { $or: [{ __v: 0 }, { __v: { $exists: false } }] } : { __v: version };
const router = express.Router();
router.use((_req,res,next)=>{res.set('Cache-Control','no-store');next();});

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
router.post('/', rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'طلبات كثيرة، حاول إرسال الرسالة لاحقًا' } }), validate(schemas.message), async (req, res, next) => {
  try {
    const { company_id, sender_name, sender_email, sender_phone, subject, message, client_request_id } = req.body;
    if (!(await Company.exists({ _id: company_id, is_active: true }))) return res.status(404).json({ success: false, message: 'الشركة غير موجودة أو غير متاحة', code: 'COMPANY_NOT_FOUND' });
    const values = { company_id, sender_name, sender_email, sender_phone: sender_phone || '', subject, message };
    const fingerprint = createHash('sha256').update(JSON.stringify(values)).digest('hex');
    async function acknowledge(existing) {
      if (existing.payload_fingerprint !== fingerprint) return res.status(409).json({ success: false, code: 'MESSAGE_ATTEMPT_CHANGED', message: 'محاولة الإرسال السابقة تخص بيانات مختلفة. حدّث النموذج وحاول مجددًا.' });
      return res.status(201).json({ success: true, message: 'تم حفظ رسالتك للشركة بنجاح', message_id: String(existing._id), company_id, replayed: true });
    }
    if (client_request_id) {
      await ContactMessage.init();
      const existing = await ContactMessage.findOne({ company_id, client_request_id }).select('+payload_fingerprint');
      if (existing) return acknowledge(existing);
    }
    try {
      const saved = await ContactMessage.create({ ...values, ...(client_request_id ? { client_request_id, payload_fingerprint: fingerprint } : {}) });
      return res.status(201).json({ success: true, message: 'تم حفظ رسالتك للشركة بنجاح', message_id: String(saved._id), company_id });
    } catch (error) {
      if (client_request_id && error.code === 11000) { const existing = await ContactMessage.findOne({ company_id, client_request_id }).select('+payload_fingerprint'); if (existing) return acknowledge(existing); }
      throw error;
    }
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
router.get('/company/:companyId', authenticate, requireRole('company', 'admin'), requireCompanyOwnerOrAdmin(Company, 'companyId'), require('../middleware/messagesQuery'), async (req, res, next) => {
  try {
    if (!(await Company.exists({ _id: req.params.companyId }))) return res.status(404).json({ success: false, code: 'COMPANY_NOT_FOUND', message: 'الشركة غير موجودة.' });
    const { page, limit, sort, search, is_read } = req.messagesQuery;
    const scope = { company_id: req.params.companyId }; const filter = { ...scope };
    if (is_read !== undefined) filter.is_read = is_read === 'true';
    if (search) filter.$or = ['sender_name', 'sender_email', 'subject', 'message'].map(key => ({ [key]: { $regex: literalSearch(search), $options: 'i' } }));
    const [total, readCount, unreadCount] = await Promise.all([ContactMessage.countDocuments(filter), ContactMessage.countDocuments({ ...scope, is_read: true }), ContactMessage.countDocuments({ ...scope, is_read: false })]);
    const pages = Math.max(1, Math.ceil(total / limit)); const currentPage = Math.min(page, pages); const direction = sort === 'oldest' ? 1 : -1;
    const messages = await ContactMessage.find(filter).sort({ createdAt: direction, _id: direction }).skip((currentPage - 1) * limit).limit(limit).lean();
    res.json({ success: true, company_id: req.params.companyId, total, page: currentPage, pages, limit, counts: { read: readCount, unread: unreadCount }, messages });
  } catch (err) { next(err); }
});

router.patch('/:id/read', authenticate, requireRole('company','admin'), validate(schemas.messageState), async(req,res,next)=>{
  try {
    const message = await ContactMessage.findById(req.params.id);
    if (!message) return res.status(404).json({ success: false, message: 'الرسالة غير موجودة' });
    const company = await Company.findById(message.company_id).select('user_id');
    if (!company) return res.status(404).json({ success: false, message: 'الشركة لم تعد متاحة' });
    if (req.user.role !== 'admin' && String(company.user_id) !== req.user.id) return res.status(403).json({ success: false, message: 'ليس لديك صلاحية على هذه الرسالة' });
    if (req.body.company_id && req.body.company_id !== String(message.company_id)) return res.status(409).json({ success: false, code: 'MESSAGE_SCOPE_CHANGED', message: 'تغيّرت الشركة المحددة. حدّث القائمة.' });
    const expected = req.body.expected_version ?? message.__v ?? 0; const desired = req.body.is_read ?? true;
    const updated = await ContactMessage.findOneAndUpdate({ _id: message._id, company_id: message.company_id, ...versionWhere(expected) }, { $set: { is_read: desired }, $inc: { __v: 1 } }, { new: true, runValidators: true });
    if (!updated) return res.status(409).json({ success: false, code: 'MESSAGE_CHANGED', message: 'تغيّرت الرسالة منذ تحميلها. حدّث القائمة.' });
    res.json({ success: true, message_id: String(updated._id), company_id: String(updated.company_id), is_read: updated.is_read, version: updated.__v });
  }catch(error){next(error);}
});

module.exports = router;
