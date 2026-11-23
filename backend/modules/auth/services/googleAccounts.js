const validator = require('validator');
const User = require('../../../models/User');

class GoogleAccountError extends Error { constructor() { super('Google identity could not be confirmed'); this.code = 'GOOGLE_IDENTITY'; } }

async function findOrCreateGoogleUser(profile) {
  const identity = typeof profile?.id === 'string' ? profile.id : '';
  const emailEntry = Array.isArray(profile?.emails) ? profile.emails.find(item => item?.verified === true && typeof item.value === 'string') : undefined;
  const email = emailEntry?.value.trim().toLowerCase();
  const hasUnsafeIdentityCharacter = Array.from(identity).some(character => {
    const codePoint = character.codePointAt(0);
    return /\s/u.test(character) || codePoint <= 0x1f || (codePoint >= 0x7f && codePoint <= 0x9f);
  });
  if (!identity || identity.length > 255 || hasUnsafeIdentityCharacter || !email || email.length > 254 || !validator.isEmail(email)) throw new GoogleAccountError();
  const linked = await User.findOne({ googleId: identity }).select('+googleId');
  if (linked) {
    if (!linked.is_active || linked.email !== email) throw new GoogleAccountError();
    return linked;
  }
  function existingAccount(user) {
    if (!user.is_active || (user.googleId && user.googleId !== identity)) throw new GoogleAccountError();
    // Existing local/other-provider identities stay unchanged; the platform's email OTP is still required.
    return user;
  }
  const existing = await User.findOne({ email }).select('+googleId');
  if (existing) return existingAccount(existing);
  const photo = profile.photos?.[0]?.value;
  const avatar = typeof photo === 'string' && photo.length <= 2048 && /^https:\/\//.test(photo) ? photo : '';
  try {
    return await User.create({ email, googleId: identity, provider: 'google', role: 'seeker', name: typeof profile.displayName === 'string' ? profile.displayName.trim().slice(0, 200) : '', avatar });
  } catch (error) {
    if (error.code !== 11000) throw error;
    const raced = await User.findOne({ email }).select('+googleId');
    if (!raced) throw error;
    return existingAccount(raced);
  }
}
module.exports = { findOrCreateGoogleUser, GoogleAccountError };
