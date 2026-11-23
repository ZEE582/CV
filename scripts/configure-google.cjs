const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const dotenv = require('dotenv');
const defaultEnvironment = path.resolve(__dirname, '../backend/.env');
function inspectGoogle(env) {
  const fields = [];
  if (!/^[\w-]+\.apps\.googleusercontent\.com$/.test(env.GOOGLE_CLIENT_ID || '')) fields.push('GOOGLE_CLIENT_ID');
  if (typeof env.GOOGLE_CLIENT_SECRET !== 'string' || !/^[\x21-\x7e]{12,2048}$/.test(env.GOOGLE_CLIENT_SECRET)) fields.push('GOOGLE_CLIENT_SECRET');
  let expected;
  try {
    const client = new URL(env.CLIENT_URL || 'http://127.0.0.1:5173');
    if (!['http:', 'https:'].includes(client.protocol) || client.username || client.password) throw Error();
    expected = new URL('/api/auth/google/callback', client).toString();
    if (env.GOOGLE_CALLBACK_URL !== expected) fields.push('GOOGLE_CALLBACK_URL');
  } catch { fields.push('CLIENT_URL'); }
  return { configured: fields.length === 0, missingOrInvalidFields: fields, requiredCallback: expected, liveLoginTested: false };
}
function importCredentials(credentialsPath, environmentPath = defaultEnvironment, { rotateSecret = false } = {}) {
  if (!fs.existsSync(environmentPath) || fs.statSync(credentialsPath).size > 65536) throw Error('Invalid local input');
  const original = fs.readFileSync(environmentPath, 'utf8'); const env = dotenv.parse(original);
  const web = JSON.parse(fs.readFileSync(credentialsPath, 'utf8')).web;
  if (!web || !Array.isArray(web.redirect_uris)) throw Error('A Web application credential file is required');
  const candidate = { ...env, GOOGLE_CLIENT_ID: web.client_id, GOOGLE_CLIENT_SECRET: web.client_secret, GOOGLE_CALLBACK_URL: new URL('/api/auth/google/callback', env.CLIENT_URL || 'http://127.0.0.1:5173').toString() };
  if (!inspectGoogle(candidate).configured || !web.redirect_uris.includes(candidate.GOOGLE_CALLBACK_URL)) throw Error('Google configuration does not match this platform');
  if (rotateSecret) {
    if (!env.GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID !== candidate.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || env.GOOGLE_CLIENT_SECRET === candidate.GOOGLE_CLIENT_SECRET) throw Error('Secret rotation must retain the same client and supply a new secret');
  } else {
    for (const key of ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']) if (env[key] && env[key] !== candidate[key]) throw Error('Existing Google credentials will not be overwritten');
  }
  const keys = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_CALLBACK_URL'];
  const retained = original.split(/\r?\n/).filter(line => !keys.some(key => new RegExp('^\\s*(?:export\\s+)?' + key + '\\s*=').test(line))).join('\n').replace(/\n*$/, '\n');
  const next = retained + keys.map(key => key + '=' + JSON.stringify(candidate[key])).join('\n') + '\n';
  const temp = environmentPath + '.google-' + randomBytes(8).toString('hex');
  try { fs.writeFileSync(temp, next, { encoding: 'utf8', flag: 'wx', mode: 0o600 }); fs.renameSync(temp, environmentPath); }
  finally { if (fs.existsSync(temp)) fs.unlinkSync(temp); }
  return inspectGoogle(candidate);
}
function main(args = process.argv.slice(2)) {
  try {
    let report;
    if (args.length === 1 && args[0] === '--check') report = inspectGoogle({ ...dotenv.parse(fs.readFileSync(defaultEnvironment, 'utf8')), ...process.env });
    else if (args.length === 2 && args[0] === '--credentials') report = importCredentials(path.resolve(args[1]));
    else if (args.length === 2 && args[0] === '--rotate-secret') report = importCredentials(path.resolve(args[1]), defaultEnvironment, { rotateSecret: true });
    else { console.error('Usage: node scripts/configure-google.cjs --check | --credentials PATH | --rotate-secret PATH'); return 1; }
    console.log(JSON.stringify(report, null, 2));
    if (args[0] === '--credentials' || args[0] === '--rotate-secret') console.log('Saved server-only Google configuration. Restart the API before testing.');
    return report.configured ? 0 : 2;
  } catch { console.error('Google configuration was not changed. Check the Web client JSON, matching callback URL and existing local settings.'); return 1; }
}
module.exports = { inspectGoogle, importCredentials, main };
if (require.main === module) process.exitCode = main();
