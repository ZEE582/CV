/**
 * @file config/jwtConfig.js
 * @description إعداد JWT الموحد — مصدر واحد لإنشاء التوكن والتحقق منه
 *
 * يُستخدم من:
 *  - authController  (إنشاء التوكن عند التسجيل/الدخول)
 *  - middleware/auth  (التحقق من التوكن في جميع المسارات المحمية)
 *  - adminController  (إنشاء حسابات الشركات عبر الإيميل)
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET     = process.env.JWT_SECRET || 'ttwar_unified_super_secret_jwt_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * إنشاء توكن JWT موحد لجميع أنواع المستخدمين
 * @param {Object} user - مستخدم من قاعدة البيانات
 * @returns {string} JWT token
 */
function signToken(user) {
  return jwt.sign(
    {
      id:        user._id,
      email:     user.email,
      role:      user.role,        // 'seeker' | 'company' | 'admin'
      full_name: user.full_name,
      company_id: user.company_id || null  // مربوط بشركة إن كان role=company
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * التحقق من توكن وإرجاع البيانات
 * @param {string} token
 * @returns {Object} payload
 */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { JWT_SECRET, JWT_EXPIRES_IN, signToken, verifyToken };
