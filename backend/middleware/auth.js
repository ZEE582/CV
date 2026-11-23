const { verifyToken } = require('../config/jwtConfig');
const User = require('../models/User');
async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'يجب تسجيل الدخول', code: 'NO_TOKEN' });
  let payload;
  try { payload = verifyToken(header.slice(7)); }
  catch { return res.status(401).json({ success: false, message: 'انتهت الجلسة أو التوكن غير صالح', code: 'INVALID_TOKEN' }); }
  try {
    const user = await User.findById(payload.id);
    if (!user || !user.is_active) return res.status(401).json({ success: false, message: 'الحساب غير متاح', code: 'ACCOUNT_INACTIVE' });
    if ((payload.ver ?? 0) !== (user.token_version || 0)) return res.status(401).json({ success: false, message: 'انتهت هذه الجلسة بعد تغيير كلمة المرور؛ سجل الدخول مجددًا', code: 'SESSION_REVOKED' });
    req.user = { id: String(user._id), role: user.role === 'user' ? 'seeker' : user.role };
    req.account = user;
    next();
  } catch (error) { next(error); }
}
async function optionalAuth(req, res, next) {
  if (!req.headers.authorization) return next();
  return authenticate(req, res, next);
}
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'يجب تسجيل الدخول' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ success: false, message: 'ليس لديك صلاحية لهذه العملية', code: 'INSUFFICIENT_ROLE' });
    next();
  };
}
function requireCompanyOwnerOrAdmin(model, paramKey = 'id', ownerField = 'user_id') {
  return async (req, res, next) => {
    try {
      if (req.user.role === 'admin') return next();
      const record = await model.findById(req.params[paramKey]);
      if (!record) return res.status(404).json({ success: false, message: 'السجل غير موجود' });
      if (String(record[ownerField]) !== req.user.id) return res.status(403).json({ success: false, message: 'ليس لديك صلاحية على السجل' });
      req.record = record;
      next();
    } catch (error) { next(error); }
  };
}
module.exports = { authenticate, optionalAuth, requireRole, requireCompanyOwnerOrAdmin };
