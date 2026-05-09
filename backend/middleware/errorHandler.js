/**
 * @file middleware/errorHandler.js
 * @description Middleware مركزي للتعامل مع الأخطاء
 * يجب تسجيله آخر middleware في Express
 */

/**
 * دالة معالجة الأخطاء العامة
 * تُستقبل الأخطاء من next(error) في أي مكان في التطبيق
 *
 * @param {Error} err - الخطأ المُرسل
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
const errorHandler = (err, req, res, next) => {
  console.error('🔴 Unhandled Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  // أخطاء قاعدة البيانات MySQL
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'هذا السجل موجود مسبقاً',
      code: 'DUPLICATE_ENTRY'
    });
  }

  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({
      success: false,
      message: 'لا يمكن الحذف - يوجد بيانات مرتبطة بهذا السجل',
      code: 'REFERENCED_RECORD'
    });
  }

  // أخطاء JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'توكن غير صالح',
      code: 'INVALID_TOKEN'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'انتهت صلاحية الجلسة',
      code: 'TOKEN_EXPIRED'
    });
  }

  // خطأ عام
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'خطأ داخلي في الخادم',
    code: err.code || 'INTERNAL_ERROR',
    // تفاصيل الخطأ في بيئة التطوير فقط
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Middleware للمسارات غير الموجودة (404)
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `المسار ${req.method} ${req.path} غير موجود`,
    code: 'ROUTE_NOT_FOUND'
  });
};

module.exports = { errorHandler, notFound };
