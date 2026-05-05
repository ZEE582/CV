const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const authenticate = async (req, res, next) => {
  try {
    const h = req.headers.authorization;
    if (!h?.startsWith('Bearer '))
      return res.status(401).json({ success: false, message: 'يجب تسجيل الدخول أولاً' });

    const decoded = jwt.verify(h.split(' ')[1], process.env.JWT_SECRET);
    const rows    = await query(
      'SELECT id,email,role,full_name,is_active FROM users WHERE id=?',
      [decoded.userId]
    );
    if (!rows[0] || !rows[0].is_active)
      return res.status(401).json({ success: false, message: 'الحساب غير موجود أو محظور' });

    req.user = rows[0];
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError'
      ? 'انتهت صلاحية الجلسة'
      : 'توكن غير صالح';
    return res.status(401).json({ success: false, message: msg });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user)
    return res.status(401).json({ success: false, message: 'يجب تسجيل الدخول' });
  if (!roles.includes(req.user.role))
    return res.status(403).json({ success: false, message: 'ليس لديك صلاحية' });
  next();
};

const optionalAuth = async (req, res, next) => {
  try {
    const h = req.headers.authorization;
    if (h?.startsWith('Bearer ')) {
      const decoded = jwt.verify(h.split(' ')[1], process.env.JWT_SECRET);
      const rows    = await query('SELECT id,email,role,full_name FROM users WHERE id=?', [decoded.userId]);
      if (rows[0]) req.user = rows[0];
    }
  } catch {}
  next();
};

module.exports = { authenticate, requireRole, optionalAuth };
