const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'); const path = require('node:path'); const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '../../frontend/src');
function load(file, globals = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, TextEncoder, require: name => {
    if (name === '../constants/api') return { API_BASE_URL: '/api' };
    throw new Error('Unexpected dependency: ' + name);
  }, ...globals });
  return module.exports;
}
const helper = load('features/auth/validation/passwordRecoveryValidation.ts');
const values = { email: 'test@example.com', code: '123456', password: 'NewPassword123!', confirmation: 'NewPassword123!' };
const reply = (status, body, headers = {}) => ({ status, ok: status >= 200 && status < 300, headers: new Headers(headers), json: async () => body });

test('recovery accepts six Arabic or Persian digits while keeping verification and reset requirements distinct', () => {
  for (const text of ['123456', '١٢٣٤٥٦', '۱۲۳۴۵۶', 'رمز: ١٢ ٣٤٥٦', '1٢۳4٥۶']) assert.equal(helper.normalizeRecoveryCode(text), '123456');
  assert.ok(helper.validateRecovery({ ...values, code: '12345' }, true).code);
  assert.equal(Object.keys(helper.validateRecovery(values, true)).length, 0);
  assert.equal(Object.keys(helper.validateRecovery({ ...values, code: '', password: '', confirmation: '' }, false)).length, 0);
  assert.ok(helper.validateRecovery({ ...values, email: 'invalid' }, false).email);
});
test('new-password validation matches the server UTF-8 limit and exact confirmation', () => {
  const { newPassword } = require('../middleware/passwordSchema');
  for (const password of ['Eight123', '  Edge123  ', 'أ'.repeat(36)]) {
    assert.equal(helper.validateRecovery({ ...values, password, confirmation: password }, true).password, undefined);
    assert.equal(newPassword.validate(password).error, undefined);
  }
  for (const password of ['short', '        ', 'أ'.repeat(37)]) {
    assert.ok(helper.validateRecovery({ ...values, password, confirmation: password }, true).password);
    assert.ok(newPassword.validate(password).error);
  }
  assert.ok(helper.validateRecovery({ ...values, confirmation: 'different' }, true).confirmation);
});
test('recovery timing survives reloads without storing codes or passwords and does not cross accounts', () => {
  const entries = new Map();
  const storage = { getItem: key => entries.get(key) || null, setItem: (key, value) => entries.set(key, value), removeItem: key => entries.delete(key) };
  const now = 1000000;
  helper.rememberRecoveryDeadline(values.email, now + 60000, storage);
  const saved = JSON.parse([...entries.values()][0]);
  assert.deepEqual(Object.keys(saved).sort(), ['deadline', 'email']);
  assert.equal(helper.recoveryDeadline(values.email, now + 25000, storage), now + 60000);
  assert.equal(helper.recoveryDeadline(values.email, now + 80000, storage), now + 60000);
  assert.equal(helper.recoveryDeadline('other@example.com', now, storage), 0);
  helper.clearRecoveryDeadline('other@example.com', storage); assert.equal(entries.size, 1);
  helper.clearRecoveryDeadline(values.email, storage); assert.equal(entries.size, 0);
  const blocked = { getItem() { throw new Error('Blocked'); }, setItem() { throw new Error('Blocked'); }, removeItem() { throw new Error('Blocked'); } };
  assert.doesNotThrow(() => helper.rememberRecoveryDeadline(values.email, now + 60000, blocked));
  assert.equal(helper.recoveryDeadline(values.email, now, blocked), 0);
});
test('recovery service requires acknowledged replies, maps unavailable mail and keeps retry limits bounded', async () => {
  const responses = [reply(202, { message: 'Conditional receipt', retry_after: 60 }), reply(200, {}), reply(503, { message: 'EMAIL_PASS missing' }), reply(429, {}, { 'Retry-After': '99999' })];
  const service = load('features/auth/services/passwordRecoveryService.ts', { fetch: async () => responses.shift() });
  assert.equal((await service.requestPasswordReset(values.email)).retry_after, 60);
  await assert.rejects(service.requestPasswordReset(values.email), /لم يكتمل الطلب/);
  await assert.rejects(service.requestPasswordReset(values.email), error => error.status === 503 && !error.message.includes('EMAIL_PASS'));
  await assert.rejects(service.requestPasswordReset(values.email), error => error.status === 429 && error.retryAfter === 900);
});
test('reset requests preserve passwords and browser cookies, honor cancellation and reject unreadable success replies', async () => {
  const requests = [];
  const responses = [reply(200, { message: 'Password changed' }), { ...reply(200, {}), json: async () => { throw new SyntaxError('HTML'); } }];
  const service = load('features/auth/services/passwordRecoveryService.ts', { fetch: async (url, options) => { requests.push({ url, ...options }); return responses.shift(); } });
  const controller = new AbortController(); const password = '  ExactPassword123! ';
  assert.equal((await service.resetPassword('  TEST@example.com ', '123456', password, controller.signal)).message, 'Password changed');
  assert.equal(requests[0].url, '/api/auth/reset-password'); assert.equal(requests[0].credentials, 'include'); assert.equal(requests[0].signal, controller.signal);
  assert.equal(JSON.parse(requests[0].body).new_password, password); assert.equal(JSON.parse(requests[0].body).email, 'test@example.com');
  assert.equal(Object.hasOwn(requests[0].headers, 'Authorization'), false);
  await assert.rejects(service.resetPassword(values.email, values.code, values.password), /لم يكتمل الطلب/);
});
