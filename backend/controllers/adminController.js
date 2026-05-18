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
const User        = require('../models/User');
const Company     = require('../models/Company');
const Job         = require('../models/Job');
const Application = require('../models/Application');
const ContactMessage = require('../models/ContactMessage');

// ── إحصائيات لوحة التحكم ─────────────────────────────────────
exports.getStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalCompanies,
      totalJobs,
      totalApplications,
      totalMessages,
      activeJobs,
      verifiedCompanies,
      pendingApplications
    ] = await Promise.all([
      User.countDocuments(),
      Company.countDocuments(),
      Job.countDocuments(),
      Application.countDocuments(),
      ContactMessage.countDocuments(),
      Job.countDocuments({ is_active: true }),
      Company.countDocuments({ is_verified: true }),
      Application.countDocuments({ status: 'pending' })
    ]);

    // آخر 5 وظائف
    const recentJobs = await Job.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('company_id', 'name_ar')
      .lean();

    // آخر 5 مستخدمين
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('-password_hash')
      .lean();

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalCompanies,
        totalJobs,
        totalApplications,
        totalMessages,
        activeJobs,
        verifiedCompanies,
        pendingApplications
      },
      recentJobs,
      recentUsers
    });
  } catch (err) { next(err); }
};

// ── قائمة المستخدمين ─────────────────────────────────────────
exports.getUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (role)   filter.role = role;
    if (search) filter.$or = [
      { full_name: { $regex: search, $options: 'i' } },
      { email:     { $regex: search, $options: 'i' } }
    ];

    const pageNum  = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select('-password_hash')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean()
    ]);

    res.json({ success: true, total, page: pageNum, limit: limitNum, users });
  } catch (err) { next(err); }
};

// ── تفاصيل مستخدم ────────────────────────────────────────────
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password_hash').lean();
    if (!user)
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود', code: 'USER_NOT_FOUND' });

    let extra = {};
    if (user.role === 'company') {
      extra.company = await Company.findOne({ user_id: user._id }).lean();
    }
    if (user.role === 'seeker') {
      extra.applications_count = await Application.countDocuments({ user_id: user._id });
    }

    res.json({ success: true, user: { ...user, ...extra } });
  } catch (err) { next(err); }
};

// ── تفعيل/إيقاف حساب ─────────────────────────────────────────
exports.toggleUserActive = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user)
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود', code: 'USER_NOT_FOUND' });

    if (user.role === 'admin')
      return res.status(400).json({ success: false, message: 'لا يمكن إيقاف حساب الأدمن', code: 'CANNOT_DEACTIVATE_ADMIN' });

    user.is_active = !user.is_active;
    await user.save();

    res.json({
      success: true,
      message: user.is_active ? 'تم تفعيل الحساب' : 'تم إيقاف الحساب',
      is_active: user.is_active
    });
  } catch (err) { next(err); }
};

// ── تغيير دور مستخدم ─────────────────────────────────────────
exports.changeUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user)
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود', code: 'USER_NOT_FOUND' });

    if (!['seeker', 'company', 'admin'].includes(role))
      return res.status(400).json({ success: false, message: 'دور غير صالح', code: 'INVALID_ROLE' });

    user.role = role;
    await user.save();

    res.json({ success: true, message: 'تم تغيير دور المستخدم', role: user.role });
  } catch (err) { next(err); }
};

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
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user)
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود', code: 'USER_NOT_FOUND' });

    if (user.role === 'admin')
      return res.status(400).json({ success: false, message: 'لا يمكن حذف حساب الأدمن', code: 'CANNOT_DELETE_ADMIN' });

    await Promise.all([
      User.findByIdAndDelete(req.params.id),
      Application.deleteMany({ user_id: req.params.id })
    ]);

    res.json({ success: true, message: 'تم حذف المستخدم بنجاح' });
  } catch (err) { next(err); }
};
