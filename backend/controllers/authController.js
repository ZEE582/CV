/**
 * @file controllers/authController.js
 * @description منطق المصادقة الموحد
 *
 * يغطي:
 *  1. تسجيل مستخدم عادي (seeker)
 *  2. تسجيل الدخول لجميع الأدوار
 *  3. إنشاء حساب شركة بواسطة الأدمن (عبر إيميل محدد + كلمة مرور)
 *  4. جلب بيانات المستخدم الحالي
 *  5. تسجيل الخروج
 */

const bcrypt  = require('bcryptjs');
const User    = require('../models/User');
const Company = require('../models/Company');
const { signToken } = require('../config/jwtConfig');

// ── 1. تسجيل مستخدم جديد (seeker) ───────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { email, password, full_name, phone } = req.body;

    if (await User.findOne({ email }))
      return res.status(409).json({ success: false, message: 'البريد الإلكتروني مستخدم بالفعل', code: 'EMAIL_EXISTS' });

    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password_hash, full_name, phone, role: 'seeker' });

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      token:   signToken(user),
      user:    { id: user._id, full_name: user.full_name, email: user.email, role: user.role }
    });
  } catch (err) { next(err); }
};

// ── 2. تسجيل الدخول (جميع الأدوار) ──────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة', code: 'INVALID_CREDENTIALS' });

    if (!user.is_active)
      return res.status(403).json({ success: false, message: 'الحساب موقوف، تواصل مع الدعم', code: 'ACCOUNT_INACTIVE' });

    // إن كان company، أرفق company_id في التوكن
    let company_id = null;
    if (user.role === 'company') {
      const co = await Company.findOne({ user_id: user._id }).select('_id');
      company_id = co ? co._id : null;
    }

    const tokenUser = { ...user.toObject(), company_id };

    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      token:   signToken(tokenUser),
      user:    { id: user._id, full_name: user.full_name, email: user.email, role: user.role, company_id }
    });
  } catch (err) { next(err); }
};

// ── 3. إنشاء حساب شركة (admin فقط) ──────────────────────────
// الأدمن يحدد الإيميل + كلمة المرور → تُنشأ حساب بدور company
// ثم يمكن ربطه بشركة موجودة أو إنشاء شركة جديدة
exports.createCompanyAccount = async (req, res, next) => {
  try {
    const { email, password, full_name, company_id } = req.body;

    if (await User.findOne({ email }))
      return res.status(409).json({ success: false, message: 'هذا الإيميل مستخدم بالفعل', code: 'EMAIL_EXISTS' });

    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email, password_hash, full_name: full_name || 'مدير الشركة', role: 'company', is_active: true
    });

    // ربط الشركة بالمستخدم الجديد إن أُعطي company_id
    if (company_id) {
      const co = await Company.findById(company_id);
      if (!co)
        return res.status(404).json({ success: false, message: 'الشركة غير موجودة', code: 'COMPANY_NOT_FOUND' });
      await Company.findByIdAndUpdate(company_id, { user_id: user._id });
    }

    res.status(201).json({
      success: true,
      message: 'تم إنشاء حساب الشركة بنجاح',
      user:    { id: user._id, email: user.email, role: user.role, company_id: company_id || null }
    });
  } catch (err) { next(err); }
};

// ── 4. بيانات المستخدم الحالي ────────────────────────────────
exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password_hash');
    if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود', code: 'USER_NOT_FOUND' });

    let extra = {};
    if (user.role === 'company') {
      const co = await Company.findOne({ user_id: user._id }).select('_id name_ar name_en is_verified');
      extra.company = co || null;
    }

    res.json({ success: true, user: { ...user.toObject(), ...extra } });
  } catch (err) { next(err); }
};

// ── 5. تسجيل الخروج ──────────────────────────────────────────
exports.logout = (_req, res) => {
  // التوكن stateless — التسجيل على جانب العميل
  res.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
};

// ── 6. تغيير كلمة المرور ─────────────────────────────────────
exports.changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    const user = await User.findById(req.user.id);

    if (!(await bcrypt.compare(current_password, user.password_hash)))
      return res.status(401).json({ success: false, message: 'كلمة المرور الحالية غير صحيحة', code: 'WRONG_PASSWORD' });

    user.password_hash = await bcrypt.hash(new_password, 10);
    await user.save();

    res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (err) { next(err); }
};
