function oauthReturnPath(value) {
  const hasUnsafePathCharacter = typeof value === 'string' && Array.from(value).some(character => {
    const codePoint = character.codePointAt(0);
    return character === '\\' || /\s/u.test(character) || codePoint <= 0x1f || (codePoint >= 0x7f && codePoint <= 0x9f);
  });
  if (typeof value !== 'string' || value.length > 2048 || !value.startsWith('/') || value.startsWith('//') || hasUnsafePathCharacter || /^\/(login|logout|signup|verify-email|questions|forgot-password|reset-password)([?#/]|$)/.test(value)) return undefined;
  return value;
}
function oauthPage(path, params = {}) {
  const url = new URL(path, process.env.CLIENT_URL || 'http://127.0.0.1:5173');
  for (const [key, value] of Object.entries(params)) if (typeof value === 'string') url.searchParams.set(key, value);
  return url.toString();
}
module.exports = { oauthReturnPath, oauthPage };
