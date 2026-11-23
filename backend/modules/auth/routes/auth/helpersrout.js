function normalizeEmail(email) { return typeof email === 'string' ? email.trim().toLowerCase() : null; }
module.exports = { normalizeEmail };
