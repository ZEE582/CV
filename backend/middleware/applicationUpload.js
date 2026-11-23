const multer = require('multer');
const { rateLimit } = require('express-rate-limit');
const MAX_CV_BYTES = 5 * 1024 * 1024;
const fileError = (message, status = 400) => Object.assign(new Error(message), { status, code: 'CV_UPLOAD_INVALID' });
function validatePdf(file) {
  if (!file || file.size < 16 || file.size > MAX_CV_BYTES || file.mimetype !== 'application/pdf' || !/\.pdf$/i.test(file.originalname)) throw fileError('اختر ملف PDF صالحًا بحجم لا يتجاوز 5 ميغابايت.');
  const buffer = file.buffer;
  if (!Buffer.isBuffer(buffer)) throw fileError('تعذر قراءة ملف السيرة.');
  // A format check, not a malware scan. Files are only served as authenticated attachments.
  if (!/^%PDF-(?:1\.[0-7]|2\.0)[\r\n]/.test(buffer.subarray(0, 12).toString('ascii')) || !/%%EOF\s*$/.test(buffer.subarray(-1024).toString('latin1'))) throw fileError('محتوى الملف لا يطابق صيغة PDF.');
  const base = file.originalname.replaceAll('\\', '/').split('/').pop().replace(/[^\p{L}\p{N} ._-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 110).replace(/\.pdf$/i, '');
  return { meta: { name: (base || 'السيرة الذاتية') + '.pdf', size: buffer.length }, data: buffer };
}
function createApplicationUpload() {
  let active = 0;
  const limit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, keyGenerator: req => req.user.id, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'محاولات رفع كثيرة. انتظر ربع ساعة ثم حاول مجددًا.' } });
  const parse = multer({ storage: multer.memoryStorage(), defParamCharset: 'utf8', limits: { fileSize: MAX_CV_BYTES, files: 1, fields: 3, parts: 4, fieldSize: 32000, fieldNameSize: 50 }, fileFilter(_req, file, callback) {
    if (file.mimetype === 'application/pdf' && /\.pdf$/i.test(file.originalname)) callback(null, true);
    else callback(fileError('يُقبل ملف PDF فقط.'));
  } }).single('cv_file');
  return (req, res, next) => {
    if (!req.is('multipart/form-data')) return next();
    if (active >= 4) return res.set('Retry-After', '2').status(503).json({ success: false, code: 'CV_UPLOAD_BUSY', message: 'خدمة الرفع مشغولة الآن. حاول بعد قليل.' });
    active++; let released = false;
    const release = () => { if (!released) { released = true; active--; } };
    res.once('finish', release); res.once('close', release);
    const reject = failure => res.status(failure.status || 400).json({ success: false, code: 'CV_UPLOAD_INVALID', message: failure.message });
    limit(req, res, error => {
      if (error) return next(error);
      parse(req, res, failure => {
        if (failure) return reject(fileError(failure.code === 'LIMIT_FILE_SIZE' ? 'حجم ملف السيرة يتجاوز 5 ميغابايت.' : 'تعذر قراءة المرفق. اختر ملف PDF واحدًا بحجم لا يتجاوز 5 ميغابايت.', failure.code === 'LIMIT_FILE_SIZE' ? 413 : 400));
        try { req.cvAttachment = validatePdf(req.file); next(); } catch (invalid) { reject(invalid); }
      });
    });
  };
}
module.exports = { createApplicationUpload, validatePdf, MAX_CV_BYTES };
