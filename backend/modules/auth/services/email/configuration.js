const { isIP } = require('node:net');
const { isEmail, isFQDN } = require('validator');

function configurationError(reason, fields) {
  const error = new Error('خدمة البريد غير مهيأة أو إعداداتها غير صالحة. راجع إعدادات البريد في الخادم.');
  error.status = 503; error.code = 'EMAIL_CONFIGURATION'; error.reason = reason; error.fields = fields;
  return error;
}
function emailConfiguration(env = process.env) {
  const value = key => typeof env[key] === 'string' ? env[key].trim() : '';
  const missing = ['EMAIL_USER', 'EMAIL_PASS'].filter(key => !value(key));
  if (missing.length) throw configurationError('missing_configuration', missing);
  const host = value('SMTP_HOST') || 'smtp.gmail.com';
  const invalid = [];
  if (!isIP(host) && !isFQDN(host, { require_tld: false, allow_trailing_dot: false })) invalid.push('SMTP_HOST');
  const secureValue = value('SMTP_SECURE');
  if (secureValue && !['true', 'false'].includes(secureValue)) invalid.push('SMTP_SECURE');
  const portValue = value('SMTP_PORT');
  if (portValue && (!/^\d{1,5}$/.test(portValue) || +portValue < 1 || +portValue > 65535)) invalid.push('SMTP_PORT');
  const secure = secureValue ? secureValue === 'true' : portValue ? +portValue === 465 : !value('SMTP_HOST');
  const port = portValue ? +portValue : secure ? 465 : 587;
  if (port === 465 && !secure || port === 587 && secure) invalid.push('SMTP_SECURE');
  const from = value('EMAIL_FROM') || value('EMAIL_USER');
  if (!isEmail(from) || /[\r\n]/.test(from)) invalid.push('EMAIL_FROM');
  if (/[\r\n]/.test(value('EMAIL_USER'))) invalid.push('EMAIL_USER');
  if (invalid.length) throw configurationError('invalid_configuration', [...new Set(invalid)]);
  return {
    from: { name: 'تطوّر', address: from },
    transport: {
      host, port, secure, requireTLS: !secure,
      auth: { user: value('EMAIL_USER'), pass: env.EMAIL_PASS },
      tls: { rejectUnauthorized: true, minVersion: 'TLSv1.2' },
      connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 10000,
      disableFileAccess: true, disableUrlAccess: true, logger: false, debug: false,
    },
  };
}
module.exports = { emailConfiguration };
