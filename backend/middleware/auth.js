/**
 * middleware/auth.js
 * Middleware مؤقت للتطوير حتى يعمل المشروع بالكامل
 */

const authenticate = (req, res, next) => {
  // مستخدم افتراضي بصلاحية admin
  req.user = {
    id: 1,
    role: 'admin'
  };
  next();
};

// يسمح بالوصول سواء كان المستخدم مسجلاً أم لا
const optionalAuth = (req, res, next) => {
  // يمكن لاحقاً قراءة التوكن إن وجد
  req.user = {
    id: 1,
    role: 'admin'
  };
  next();
};

// التحقق من الصلاحيات
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  optionalAuth,
  requireRole
};