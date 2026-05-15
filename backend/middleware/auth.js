/**
 * middleware/auth.js
 * وسيط المصادقة — يُستخدم في routes/jobs و routes/companies
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'foras_palestine_super_secret_jwt_2024';

// ── authenticate — يتطلب توكن صالح ─────────────────────────────────────────
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'التوكن مطلوب' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ success: false, message: 'توكن غير صالح أو منتهي الصلاحية' });
  }
}

// ── optionalAuth — يقبل الطلب بدون توكن أيضاً ──────────────────────────────
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch {
      req.user = null;
    }
  } else {
    req.user = null;
  }

  next();
}

// ── requireRole — يتطلب دور معين ────────────────────────────────────────────
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'يجب تسجيل الدخول' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'ليس لديك صلاحية للقيام بهذا الإجراء' });
    }
    next();
  };
}

module.exports = { authenticate, optionalAuth, requireRole };
