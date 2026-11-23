const fs = require('node:fs');
const path = require('node:path');

function normalizeBase(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('Use an HTTP(S) origin without credentials, path, query or fragment.');
  return url.origin;
}
async function boundedJson(response) {
  if (!response.headers.get('content-type')?.toLowerCase().includes('application/json')) throw new Error('Invalid response.');
  const reader = response.body.getReader(); const chunks = []; let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 4096) throw new Error('Oversized response.');
      chunks.push(Buffer.from(value));
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } finally { try { await reader.cancel(); } catch { /* Reader may already be closed. */ } }
}
async function inspectPlatform({ baseUrl = 'http://127.0.0.1:5000', fetchImpl = fetch, timeoutMS = 2000 } = {}) {
  const base = normalizeBase(baseUrl);
  async function check(kind) {
    let response;
    try { response = await fetchImpl(base + (kind === 'live' ? '/api/live' : '/api/health'), { signal: AbortSignal.timeout(timeoutMS), redirect: 'error', credentials: 'omit', cache: 'no-store', headers: { Accept: 'application/json' } }); }
    catch { return { ok: false, reason: 'connection_failed' }; }
    let body;
    try { body = await boundedJson(response); } catch { return { ok: false, reason: 'invalid_response', httpStatus: response.status }; }
    const valid = kind === 'live' ? body?.success === true && body.status === 'alive' : body?.success === true && body.database === 'connected';
    if (response.status === 200 && valid) return { ok: true, reason: kind === 'live' ? 'alive' : 'ready', httpStatus: 200 };
    if (kind === 'ready' && response.status === 503 && body?.success === false && body.database === 'disconnected') return { ok: false, reason: 'database_unavailable', httpStatus: 503 };
    return { ok: false, reason: 'invalid_response', httpStatus: response.status };
  }
  const [live, ready] = await Promise.all([check('live'), check('ready')]);
  return { healthy: live.ok && ready.ok, live, ready };
}
async function main(args = process.argv.slice(2)) {
  if (args.length && (args.length !== 2 || args[0] !== '--url')) return 1;
  let port = process.env.PORT;
  if (!port) {
    const file = path.resolve(__dirname, '../backend/.env');
    if (fs.existsSync(file)) port = require('dotenv').parse(fs.readFileSync(file)).PORT;
  }
  let baseUrl;
  try { baseUrl = normalizeBase(args[1] || 'http://127.0.0.1:' + (port || '5000')); } catch { return 1; }
  const report = await inspectPlatform({ baseUrl }); console.log(JSON.stringify(report, null, 2)); return report.healthy ? 0 : 2;
}
module.exports = { inspectPlatform, main, normalizeBase };
if (require.main === module) main().then(code => { if (code === 1) console.error('Usage: npm run check:health -- [--url http://127.0.0.1:5000]'); process.exitCode = code; }).catch(() => { console.error('Health diagnostic failed; no credentials or server diagnostics are displayed.'); process.exitCode = 1; });
