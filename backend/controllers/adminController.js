/**
 * @file controllers/adminController.js
 * @description لوحة تحكم الأدمن
 *
 * الصلاحيات: admin فقط لجميع المسارات
 *
 * يشمل:
 *  - إحصائيات عامة (Dashboard stats)
 *  - إدارة المستخدمين
 *  - تفعيل/إيقاف حسابات
 *  - قراءة جميع الرسائل
 *  - قراءة جميع التقديمات
 */
const Application = require('../models/Application');
const ContactMessage = require('../models/ContactMessage');

// ── إحصائيات لوحة التحكم ─────────────────────────────────────
exports.getStats = require('./adminOverviewController').getStats;

// ── قائمة المستخدمين ─────────────────────────────────────────
const accounts = require('./adminUsersController');
exports.getUsers = accounts.list;
exports.getUser = accounts.detail;
exports.toggleUserActive = accounts.toggle;
exports.changeUserRole = accounts.role;

// ── جميع الرسائل (للأدمن) ────────────────────────────────────
exports.getAllMessages = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, is_read } = req.query;
    const filter = {};
    if (is_read !== undefined) filter.is_read = is_read === 'true';

    const pageNum  = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));

    const [total, messages] = await Promise.all([
      ContactMessage.countDocuments(filter),
      ContactMessage.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .populate('company_id', 'name_ar')
        .lean()
    ]);

    res.json({ success: true, total, messages });
  } catch (err) { next(err); }
};

// ── تعليم رسالة كمقروءة ──────────────────────────────────────
exports.markMessageRead = async (req, res, next) => {
  try {
    await ContactMessage.findByIdAndUpdate(req.params.id, { is_read: true });
    res.json({ success: true, message: 'تم تعليمها كمقروءة' });
  } catch (err) { next(err); }
};

// ── جميع التقديمات (للأدمن) ──────────────────────────────────
exports.getAllApplications = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const pageNum  = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));

    const [total, applications] = await Promise.all([
      Application.countDocuments(filter),
      Application.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .populate('job_id',     'title field')
        .populate('user_id',    'full_name email')
        .populate('company_id', 'name_ar')
        .lean()
    ]);

    res.json({ success: true, total, applications });
  } catch (err) { next(err); }
};

// ── حذف مستخدم ───────────────────────────────────────────────
exports.deleteUser = accounts.archive;
