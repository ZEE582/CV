/**
 * @file middleware/auth.js
 * @description المصادقة والصلاحيات الموحدة لجميع صفحات المنصة
 *
 * الصلاحيات حسب الصفحة:
 *  - صفحة الوظائف  : قراءة عامة | إنشاء/تعديل/حذف → company | admin
 *  - صفحة الشركات  : قراءة عامة | إنشاء → admin | تعديل → company/admin
 *  - لوحة التحكم   : admin فقط
 *  - CV Builder    : seeker | company | admin (مسجّل دخول)
 *  - AI Chat       : عام بدون مصادقة إلزامية
 *  - المراسلات     : عام (إرسال) | قراءة → company/admin
 */

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwtConfig');

/**
 * تحقق إلزامي من التوكن
 * يُستخدم في: نشر وظيفة، تعديل شركة، لوحة التحكم، CV المحفوظة
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token)
    return res.status(401).json({ success: false, message: 'التوكن مطلوب للوصول لهذه الخدمة', code: 'NO_TOKEN' });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError'
      ? 'انتهت صلاحية الجلسة، سجّل الدخول مجدداً'
      : 'توكن غير صالح';
    res.status(401).json({ success: false, message: msg, code: err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN' });
  }
}

/**
 * تحقق اختياري من التوكن
 * يُستخدم في: قراءة الوظائف، قراءة الشركات، AI Chat
 * يُتيح إضافة ميزات شخصية إن كان المستخدم مسجلاً
 */
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (token) {
    try { req.user = jwt.verify(token, JWT_SECRET); }
    catch { req.user = null; }
  } else {
    req.user = null;
  }
  next();
}

/**
 * التحقق من دور المستخدم
 * @param {...string} roles - الأدوار المسموح بها
 *
 * خريطة الصلاحيات:
 *  admin   → كل شيء
 *  company → نشر/تعديل/حذف وظائفها، تعديل بيانات شركتها، قراءة رسائلها
 *  seeker  → تقديم على وظائف، حفظ وظائف، بناء CV
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'يجب تسجيل الدخول أولاً', code: 'NOT_AUTHENTICATED' });

    if (!roles.includes(req.user.role))
      return res.status(403).json({
        success: false,
        message: `هذه العملية تتطلب صلاحية ${roles.join(' أو ')}`,
        code: 'INSUFFICIENT_ROLE',
        required: roles,
        current: req.user.role
      });

    next();
  };
}

/**
 * التحقق من أن المستخدم يملك الشركة أو أنه admin
 * يُستخدم في: تعديل/حذف وظيفة، تعديل بيانات شركة
 */
function requireCompanyOwnerOrAdmin(model, paramKey = 'id', ownerField = 'user_id') {
  return async (req, res, next) => {
    try {
      if (req.user.role === 'admin') return next();

      const record = await model.findById(req.params[paramKey]);
      if (!record)
        return res.status(404).json({ success: false, message: 'السجل غير موجود', code: 'NOT_FOUND' });

      if (String(record[ownerField]) !== String(req.user.id))
        return res.status(403).json({ success: false, message: 'ليس لديك صلاحية على هذا السجل', code: 'NOT_OWNER' });

      req.record = record;
      next();
    } catch (err) { next(err); }
  };
}

module.exports = { authenticate, optionalAuth, requireRole, requireCompanyOwnerOrAdmin };
