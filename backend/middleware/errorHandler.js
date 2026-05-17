/**
 * @file middleware/errorHandler.js
 */
const errorHandler = (err, req, res, next) => {
  console.error('🔴 Error:', { message: err.message, path: req.path, method: req.method });

  if (err.code === 11000) {
    return res.status(409).json({ success: false, message: 'هذا السجل موجود مسبقاً', code: 'DUPLICATE_ENTRY' });
  }
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'توكن غير صالح', code: 'INVALID_TOKEN' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'انتهت صلاحية الجلسة', code: 'TOKEN_EXPIRED' });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: err.message, code: 'VALIDATION_ERROR' });
  }

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'خطأ داخلي في الخادم',
    code: err.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `المسار ${req.method} ${req.path} غير موجود`,
    code: 'ROUTE_NOT_FOUND'
  });
};

module.exports = { errorHandler, notFound };
