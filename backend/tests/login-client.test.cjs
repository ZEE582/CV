const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'); const path = require('node:path'); const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '../../frontend/src');
function load(file, globals = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: name => {
    if (name === '../constants/api') return { API_BASE_URL: '/api' };
    throw new Error('Unexpected dependency: ' + name);
  }, ...globals });
  return module.exports;
}
test('sign-in accepts legacy passwords and preserves their exact value while normalizing email', async () => {
  const validation = load('features/auth/validation/authValidation.ts');
  assert.equal(validation.validateLogin('legacy@example.com', '123456'), null);
  assert.equal(validation.validateLogin('legacy@example.com', '        '), null);
  assert.ok(validation.validateLoginFields('', '').email); assert.ok(validation.validateLoginFields('', '').password);
  const password = ' 123456 ';
  let posted;
  const response = { ok: true, status: 200, json: async () => ({ requiresVerification: true, email: 'legacy@example.com' }) };
  const service = load('features/auth/services/loginService.ts', { fetch: async (url, options) => { posted = { url, ...options }; return response; } });
  const controller = new AbortController();
  const result = await service.loginUser('  LEGACY@example.com ', password, controller.signal);
  assert.equal(posted.url, '/api/auth/login'); assert.equal(posted.credentials, 'include'); assert.equal(posted.signal, controller.signal);
  assert.equal(JSON.parse(posted.body).email, 'legacy@example.com'); assert.equal(JSON.parse(posted.body).password, password);
  assert.equal(result.data.requiresVerification, true);
});
test('an unreadable login response does not turn into a verified sign-in', async () => {
  const response = { ok: false, status: 503, json: async () => { throw new SyntaxError('HTML gateway response'); } };
  const service = load('features/auth/services/loginService.ts', { fetch: async () => response });
  const result = await service.loginUser('name@example.com', 'ExistingPassword');
  assert.equal(result.response.status, 503); assert.equal(result.data.requiresVerification, undefined); assert.equal(Object.keys(result.data).length, 0);
});
test('sign-in return destinations keep job context and exclude external or credential pages', () => {
  const { returnPath } = load('shared/navigation.ts');
  assert.equal(returnPath({ from: { pathname: '/company/123', search: '?job=456', hash: '#apply' } }), '/company/123?job=456#apply');
  for (const from of ['https://example.com', '//example.com', '/reset-password?email=x', '/forgot-password', '/login', '/verify-email', '/jobs\\evil', '/jobs\n']) assert.equal(returnPath({ from }), undefined, from);
});
