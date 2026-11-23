const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'); const os = require('node:os'); const path = require('node:path'); const vm = require('node:vm'); const ts = require('typescript');
function client() {
  const module = { exports: {} }; const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../../frontend/src/features/auth/services/oauthService.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const navigationModule = { exports: {} }; vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../../frontend/src/shared/navigation.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { module: navigationModule, exports: navigationModule.exports });
  const destinations = [];
  vm.runInNewContext(code, { module, exports: module.exports, URLSearchParams, window: { location: { assign: value => destinations.push(value) } }, require: name => name.includes('constants/api') ? { API_BASE_URL: '/api' } : navigationModule.exports });
  return { ...module.exports, destinations };
}
test('Google buttons redirect only on request and retain safe local destinations without tokens or external return URLs', () => {
  const api = client(); assert.equal(api.destinations.length, 0);
  api.loginWithGoogle('/jobs?q=React#results');
  assert.equal(api.destinations[0], '/api/auth/google?from=%2Fjobs%3Fq%3DReact%23results');
  for (const from of ['https://evil.example', '//evil.example', '/\\evil.example', '/login', '/logout', '/jobs\nprivate']) assert.equal(api.oauthStartPath('google', from), '/api/auth/google');
  assert.equal(api.oauthStartPath('github', '/jobs'), '/api/auth/github');
  assert.equal(api.oauthFailureMessage('PRIVATE_UPSTREAM_ERROR'), '');
  assert.ok(api.oauthFailureMessage('google')); assert.ok(api.oauthFailureMessage('email'));
});
const { inspectGoogle, importCredentials } = require('../../scripts/configure-google.cjs');
function temporaryFiles() { const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ttwar-google-config-')); const environment = path.join(directory, '.env'); const credentials = path.join(directory, 'web.json'); const original = 'CLIENT_URL=http://127.0.0.1:5173\nJWT_SECRET=PRIVATE_KEEP\nEMAIL_PASS=PRIVATE_MAIL_KEEP\nGOOGLE_CLIENT_ID=\nGOOGLE_CLIENT_SECRET=\n'; fs.writeFileSync(environment, original); return { directory, environment, credentials, original }; }
function removeTemporaryFiles(files) { const target = path.resolve(files.directory); assert.equal(path.dirname(target), path.resolve(os.tmpdir())); assert.match(path.basename(target), /^ttwar-google-config-/); fs.rmSync(target, { recursive: true, force: true }); }
const fixture = { web: { client_id: 'fixture-id.apps.googleusercontent.com', client_secret: 'PRIVATE_GOOGLE_FIXTURE_SECRET', redirect_uris: ['http://127.0.0.1:5173/api/auth/google/callback'] } };
test('Google credential import preserves unrelated settings and exposes only a redacted readiness report', () => {
  const files = temporaryFiles();
  try {
    fs.writeFileSync(files.credentials, JSON.stringify(fixture)); const report = importCredentials(files.credentials, files.environment);
    assert.equal(report.configured, true); assert.equal(report.liveLoginTested, false); assert.equal(JSON.stringify(report).includes('PRIVATE_'), false);
    const env = require('dotenv').parse(fs.readFileSync(files.environment)); assert.equal(env.JWT_SECRET, 'PRIVATE_KEEP'); assert.equal(env.EMAIL_PASS, 'PRIVATE_MAIL_KEEP'); assert.equal(env.GOOGLE_CLIENT_SECRET, fixture.web.client_secret);
    assert.equal(inspectGoogle(env).configured, true);
  } finally { removeTemporaryFiles(files); }
});
test('invalid or mismatched credentials cannot change the existing environment or replace another Google client', () => {
  const files = temporaryFiles();
  try {
    for (const value of [{ installed: fixture.web }, { web: { ...fixture.web, redirect_uris: ['https://evil.example/callback'] } }, { web: { ...fixture.web, client_secret: 'bad\nsecret' } }]) {
      fs.writeFileSync(files.credentials, JSON.stringify(value)); assert.throws(() => importCredentials(files.credentials, files.environment)); assert.equal(fs.readFileSync(files.environment, 'utf8'), files.original);
    }
    fs.writeFileSync(files.environment, files.original + 'GOOGLE_CLIENT_ID=other-id.apps.googleusercontent.com\n'); const before = fs.readFileSync(files.environment, 'utf8');
    fs.writeFileSync(files.credentials, JSON.stringify(fixture)); assert.throws(() => importCredentials(files.credentials, files.environment)); assert.equal(fs.readFileSync(files.environment, 'utf8'), before);
  } finally { removeTemporaryFiles(files); }
});

test('secret rotation accepts only a new secret for the same configured OAuth client', () => {
  const files = temporaryFiles();
  try {
    fs.writeFileSync(files.credentials, JSON.stringify(fixture));
    importCredentials(files.credentials, files.environment);
    const environment = fs.readFileSync(files.environment, 'utf8');
    const parsed = require('dotenv').parse(environment);
    const credentials = structuredClone(fixture);
    credentials.web.client_secret = 'a-different-private-secret-value';
    fs.writeFileSync(files.credentials, JSON.stringify(credentials));
    assert.equal(importCredentials(files.credentials, files.environment, { rotateSecret: true }).configured, true);
    assert.match(fs.readFileSync(files.environment, 'utf8'), /GOOGLE_CLIENT_ID=/);
    assert.notEqual(fs.readFileSync(files.environment, 'utf8'), environment);
    assert.equal(parsed.JWT_SECRET, require('dotenv').parse(fs.readFileSync(files.environment, 'utf8')).JWT_SECRET);
    const afterRotation = fs.readFileSync(files.environment, 'utf8');
    credentials.web.client_id = 'another.apps.googleusercontent.com';
    fs.writeFileSync(files.credentials, JSON.stringify(credentials));
    assert.throws(() => importCredentials(files.credentials, files.environment, { rotateSecret: true }));
    assert.equal(fs.readFileSync(files.environment, 'utf8'), afterRotation);
  } finally { removeTemporaryFiles(files); }
});
