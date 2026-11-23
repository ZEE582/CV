const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'); const path = require('node:path'); const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '../../frontend/src');
function load(file, globals = {}, dependencies = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: name => {
    if (dependencies[name]) return dependencies[name];
    if (name === '../constants/api') return { API_BASE_URL: '/api' };
    throw new Error('Unexpected import: ' + name);
  }, ...globals });
  return module.exports;
}
const navigation = load('shared/navigation.ts');
const helpers = load('features/auth/validation/verification.ts', {}, { '../../../shared/navigation': navigation });
const plain = value => JSON.parse(JSON.stringify(value));
const user = { _id: '0123456789abcdef01234567', name: '', email: 'test@example.com', role: 'seeker', hasCompletedQuestions: true };

test('verification accepts Arabic and Persian digits, full-code paste and OTP autofill without losing digits', () => {
  for (const value of ['12345', '١٢٣٤٥', '۱۲۳۴۵', 'رمز: ١٢ ٣٤٥', '1٢۳4٥']) assert.equal(helpers.normalizeVerificationCode(value), '12345');
  assert.equal(helpers.normalizeVerificationCode('123456'), '12345'); assert.equal(helpers.normalizeVerificationCode('abc'), '');
});
test('resend deadlines survive reloads, distinguish accounts and degrade safely without storage', () => {
  const records = new Map();
  const storage = { getItem: key => records.get(key) || null, setItem: (key, value) => records.set(key, value), removeItem: key => records.delete(key) };
  const now = 1000000;
  helpers.rememberResendDeadline(user.email, now + 60000, storage);
  assert.equal(helpers.readResendDeadline(user.email, now + 25000, storage), now + 60000);
  assert.equal(helpers.readResendDeadline(user.email, now + 80000, storage), now + 60000);
  assert.equal(helpers.readResendDeadline('other@example.com', now, storage), now + 60000);
  helpers.clearResendDeadline('other@example.com', storage); assert.equal(records.size, 1);
  helpers.clearResendDeadline(user.email, storage); assert.equal(records.size, 0);
  const unavailable = { getItem() { throw new Error('Blocked'); }, setItem() { throw new Error('Blocked'); }, removeItem() { throw new Error('Blocked'); } };
  assert.doesNotThrow(() => helpers.rememberResendDeadline(user.email, now + 60000, unavailable));
  assert.equal(helpers.readResendDeadline(user.email, now, unavailable), now + 60000);
  assert.doesNotThrow(() => helpers.clearResendDeadline(user.email, unavailable));
});
test('malformed or mismatched verification responses cannot establish a client session', () => {
  assert.equal(helpers.validVerificationReply({ token: 'server-issued-token', user }, user.email), true);
  for (const value of [null, {}, { token: '', user }, { token: 'token' }, { token: 'token', user: { ...user, email: 'other@example.com' } }, { token: 'token', user: { ...user, role: ['admin'] } }, { token: 'token', user: { ...user, _id: 'invalid' } }, { token: 'token', user: { ...user, hasCompletedQuestions: 'false' } }]) assert.equal(helpers.validVerificationReply(value, user.email), false);
});
test('verification routes by account role and retains the original job destination through onboarding', () => {
  assert.equal(helpers.verificationDestination({ ...user, role: 'admin' }, '/jobs').path, '/admin/dashboard');
  assert.equal(helpers.verificationDestination({ ...user, role: 'company' }, '/jobs').path, '/admin/company-dashboard');
  assert.equal(helpers.verificationDestination(user, '/company/123?job=456').path, '/company/123?job=456');
  assert.deepEqual(plain(helpers.verificationDestination({ ...user, hasCompletedQuestions: false }, '/company/123?job=456')), { path: '/questions', state: { from: '/company/123?job=456' } });
  assert.equal(helpers.verificationDestination(user, '//outside.example').path, '/home');
});
test('verification requests keep the browser cookie and abort signal and tolerate unreadable responses', async () => {
  const requests = [];
  const response = { status: 503, json: async () => { throw new SyntaxError('HTML response'); } };
  const fetch = async (url, options) => { requests.push({ url, ...options }); return response; };
  const verify = load('features/auth/services/verifyService.ts', { fetch });
  const resend = load('features/auth/services/resendCodeService.ts', { fetch });
  const controller = new AbortController();
  assert.equal((await verify.verifyCode(user.email, '12345', controller.signal)).data.token, undefined);
  assert.equal((await resend.resendCode(user.email, controller.signal)).response.status, 503);
  for (const request of requests) { assert.equal(request.credentials, 'include'); assert.equal(request.signal, controller.signal); }
  assert.equal(JSON.parse(requests[0].body).code, '12345'); assert.equal(requests[1].url, '/api/auth/resend-code');
  assert.equal(helpers.retrySeconds({ headers: new Headers({ 'Retry-After': '120' }) }), 120);
  assert.equal(helpers.retrySeconds({ headers: new Headers() }), 60);
});
