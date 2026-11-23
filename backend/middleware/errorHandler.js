function notFound(_req, res) { res.status(404).json({ success: false, message: 'المسار غير موجود' }); }
function errorHandler(error, _req, res, _next) {
  if (res.headersSent) { _req.observeFailure?.('server_error'); res.destroy(); return; }
  if (error.code === 11000) return res.status(409).json({ success: false, message: 'السجل موجود مسبقًا' });
  if (['ValidationError', 'CastError'].includes(error.name) || error.type === 'entity.parse.failed') return res.status(400).json({ success: false, message: 'بيانات غير صالحة' });
  const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 600 ? error.status : 500;
  if (status >= 500) _req.observeFailure?.('server_error');
  res.status(status).json({ success: false, message: status === 500 ? 'حدث خطأ في الخادم' : error.message });
}
module.exports = { notFound, errorHandler };
