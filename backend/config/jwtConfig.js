const jwt = require('jsonwebtoken');
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters. Run npm run setup.');
  return secret;
}
function signToken(user) {
  return jwt.sign({ id: String(user._id), role: user.role === 'user' ? 'seeker' : user.role, ver: user.token_version || 0 }, getJwtSecret(), {
    algorithm: 'HS256', expiresIn: process.env.JWT_EXPIRES_IN || '1d', issuer: 'ttwar', audience: 'ttwar-web',
  });
}
function verifyToken(token) {
  return jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'], issuer: 'ttwar', audience: 'ttwar-web' });
}
// Older accounts have no stored version until their first password change.
function versionQuery(version) {
  return version === 0 ? { $or: [{ token_version: 0 }, { token_version: { $exists: false } }] } : { token_version: version };
}
module.exports = { getJwtSecret, signToken, verifyToken, versionQuery };
