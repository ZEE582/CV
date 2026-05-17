/**
 * @file controllers/authController.js
 * @description منطق المصادقة مستخلص من المسارات للاختبار E2E
 */
const jwt   = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User  = require('../models/User');

const JWT_SECRET     = process.env.JWT_SECRET || 'foras_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const signToken = (user) =>
  jwt.sign({ id: user._id, email: user.email, role: user.role, full_name: user.full_name }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

exports.register = async (req, res, next) => {
  try {
    const { email, password, full_name, phone } = req.body;
    if (await User.findOne({ email }))
      return res.status(409).json({ success: false, message: 'البريد الإلكتروني مستخدم بالفعل' });

    const user = await User.create({ email, password_hash: await bcrypt.hash(password, 10), full_name, phone });
    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      token: signToken(user),
      user: { id: user._id, full_name: user.full_name, email: user.email, role: user.role }
    });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });

    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      token: signToken(user),
      user: { id: user._id, full_name: user.full_name, email: user.email, role: user.role }
    });
  } catch (err) { next(err); }
};

exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password_hash');
    if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    res.json({ success: true, user });
  } catch (err) { next(err); }
};
