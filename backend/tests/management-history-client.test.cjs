const { test } = require('node:test'); const assert = require('node:assert/strict'); const fs = require('node:fs'); const path = require('node:path'); const vm = require('node:vm'); const ts = require('typescript');
function load(globals = {}) { const module = { exports: {} }; const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../../frontend/src/features/platform/api/managementHistory.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText; vm.runInNewContext(code, { module, exports: module.exports, require: () => ({ API_BASE_URL: '/api' }), ...globals }); return module.exports; }
const target = '111111111111111111111111'; const event = { actor_id: '222222222222222222222222', actor_name: 'Manager', actor_role: 'admin', at: '2026-11-19T10:00:00.000Z', request_id: '12345678-1234-4123-8123-123456789012', action: 'account.access', revision: 1, fields: ['is_active'], before: { role: 'seeker', is_active: true }, after: { role: 'seeker', is_active: false } };
const body = patch => ({ success: true, kind: 'account', target_id: target, recorded_total: 1, retained_limit: 100, older_history_available: false, events: [event], ...patch });
const reply = (value, status = 200) => ({ ok: status === 200, status, json: async () => value });
test('history validation binds the target and kind and rejects false counts, duplicates, invalid actors, dates and private state fields', () => {
  const { parseManagementHistory: parse } = load(); assert.equal(parse(body(), 'account', target).events.length, 1);
  for (const data of [body({ target_id: 'other' }), body({ kind: 'company' }), body({ recorded_total: 2 }), body({ retained_limit: 200 }), body({ older_history_available: true }), body({ events: [{ ...event, after: { password: 'PRIVATE' } }] }), body({ events: [{ ...event, at: 'invalid' }] }), body({ events: [{ ...event, actor_role: 'company' }] }), body({ events: [{ ...event, fields: ['password'] }] }), body({ events: [{ ...event, request_id: 'forged' }] }), body({ recorded_total: 2, events: [event, event] })]) assert.throws(() => parse(data, 'account', target));
});
test('private history reads use the bound token without cookies or public URLs and reject session changes before or after the response', async () => {
  let token = 'session'; const calls = [];
  const api = load({ localStorage: { getItem: () => token }, fetch: async (url, options) => { calls.push({ url, options }); return reply(body()); } }); const client = api.createManagementHistoryClient('admin', 'admin');
  await client.read('account', target); assert.equal(calls[0].url, '/api/admin/users/' + target + '/history'); assert.equal(calls[0].options.headers.Authorization, 'Bearer session'); assert.equal(calls[0].options.credentials, 'omit'); assert.equal(calls[0].options.cache, 'no-store');
  token = 'replacement'; await assert.rejects(client.read('account', target)); assert.equal(calls.length, 1);
  const late = load({ localStorage: { getItem: () => token }, fetch: async () => { token = 'changed-again'; return reply(body()); } }).createManagementHistoryClient('admin', 'admin'); await assert.rejects(late.read('account', target));
  await assert.rejects(api.createManagementHistoryClient('seeker', 'seeker').read('account', target));
});
test('history failures never reveal upstream diagnostics and aborted reads cannot publish data', async () => {
  for (const status of [400, 401, 403, 404, 429, 500]) { const client = load({ localStorage: { getItem: () => 'session' }, fetch: async () => reply({ message: 'PRIVATE_SERVER_DETAIL' }, status) }).createManagementHistoryClient('admin', 'admin'); await assert.rejects(client.read('account', target), error => !error.message.includes('PRIVATE')); }
  const controller = new AbortController(); const client = load({ localStorage: { getItem: () => 'session' }, fetch: async () => { controller.abort(); return reply(body()); } }).createManagementHistoryClient('admin', 'admin'); await assert.rejects(client.read('account', target, controller.signal), error => error.name === 'AbortError');
});
