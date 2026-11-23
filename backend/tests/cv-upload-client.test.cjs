const { test } = require('node:test'); const assert = require('node:assert/strict'); const fs = require('node:fs'); const path = require('node:path'); const vm = require('node:vm'); const ts = require('typescript');
const { File } = require('node:buffer'); const pdf = require('./fixtures/resume-pdf.cjs')(); const sample = require('./fixtures/application-report.cjs');
const root = path.resolve(__dirname, '../../frontend/src');
function load(file, globals = {}) { const module = { exports: {} }; const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText; vm.runInNewContext(code, { module, exports: module.exports, URL, URLSearchParams, Intl, DOMException, TextEncoder, FormData, Blob, File, require: name => name === '../../../shared/api' ? { API_BASE_URL: '/api' } : load(path.posix.normalize(path.posix.join(path.posix.dirname(file), name)) + '.ts', globals), ...globals }); return module.exports; }
const file = () => new File([pdf], 'السيرة.pdf', { type: 'application/pdf' }); const meta = { name: 'السيرة.pdf', size: pdf.length };
const ok = body => ({ ok: true, status: 201, json: async () => body });
const response = (bytes = pdf, headers = {}) => new Response(bytes, { headers: { 'Content-Type': 'application/pdf', 'Content-Length': String(pdf.length), ...headers } });

test('file draft validation bounds size and format and prevents a hidden simultaneous link', () => {
  const { validateApplication: validate } = load('features/platform/utils/applicationValidation.ts');
  assert.equal(Object.keys(validate({ cover: '', cvUrl: '', cvFile: file() })).length, 0);
  for (const cvFile of [{ name: 'resume.docx', type: 'application/pdf', size: 20 }, { name: 'resume.pdf', type: 'text/html', size: 20 }, { name: 'resume.pdf', type: '', size: 0 }, { name: 'resume.pdf', type: '', size: 5 * 1024 * 1024 + 1 }]) assert.ok(validate({ cover: '', cvUrl: '', cvFile }).cvFile);
  assert.ok(validate({ cover: '', cvUrl: 'https://example.com/resume.pdf', cvFile: file() }).cvUrl);
  const { isCvFileMetadata: valid } = load('features/platform/api/cvFiles.ts');
  assert.equal(valid(meta), true); for (const invalid of [null, { ...meta, name: '../resume.pdf' }, { ...meta, name: 'bad\nname.pdf' }, { ...meta, size: '20' }, { ...meta, size: 9e9 }]) assert.equal(valid(invalid), false);
});
test('multipart submission preserves exact file bytes, leaves the boundary to fetch and requires saved-file acknowledgement', async () => {
  let calls = 0; const draft = { cover: ' A letter ', cvUrl: '', cvFile: file() };
  const client = load('features/platform/api/applicationClient.ts', { localStorage: { getItem: () => 'session' }, fetch: async (url, options) => {
    calls++; assert.equal(url, '/api/applications'); assert.equal(options.headers.Authorization, 'Bearer session'); assert.equal(options.headers['Content-Type'], undefined);
    assert.equal(options.body instanceof FormData, true); assert.equal(options.body.get('job_id'), 'job'); assert.equal(options.body.get('cover_letter'), 'A letter'); assert.equal(options.body.has('cv_url'), false);
    assert.deepEqual(Buffer.from(await options.body.get('cv_file').arrayBuffer()), pdf); return ok({ success: true, application_id: 'app', cv_file: meta });
  } }).createApplicationClient('seeker', 'job');
  await client.submit(draft); assert.equal(calls, 1);
  await assert.rejects(client.submit({ ...draft, cvUrl: 'https://example.com/resume.pdf' })); assert.equal(calls, 1);
  const absent = load('features/platform/api/applicationClient.ts', { localStorage: { getItem: () => 'session' }, fetch: async () => ok({ success: true, application_id: 'app' }) }).createApplicationClient('seeker', 'job');
  await assert.rejects(absent.submit(draft), /تأكيد حفظ ملف/);
});
test('file download uses the bound session without credentials in its URL and checks state before and after reading bytes', async () => {
  let token = 'original'; let calls = 0;
  const client = load('features/platform/api/cvFiles.ts', { localStorage: { getItem: () => token }, fetch: async (url, options) => { calls++; assert.equal(url, '/api/applications/application/cv'); assert.equal(options.credentials, 'include'); assert.equal(options.cache, 'no-store'); assert.equal(options.headers.Authorization, 'Bearer original'); return response(); } }).createCvFileClient();
  const blob = await client('application', meta); assert.deepEqual(Buffer.from(await blob.arrayBuffer()), pdf);
  token = 'other'; await assert.rejects(client('application', meta), /الجلسة/); assert.equal(calls, 1);
  token = 'original';
  const changed = load('features/platform/api/cvFiles.ts', { localStorage: { getItem: () => token }, fetch: async () => ({ ok: true, headers: new Headers({ 'content-type': 'application/pdf', 'content-length': String(pdf.length) }), blob: async () => { token = 'other'; return new Blob([pdf]); } }) }).createCvFileClient();
  await assert.rejects(changed('application', meta), /الجلسة/);
});
test('download refuses HTML, incomplete data and aborted requests without exposing provider errors', async () => {
  const storage = { getItem: () => 'session' };
  for (const make of [() => response(pdf, { 'Content-Type': 'text/html' }), () => response(pdf, { 'Content-Length': String(pdf.length + 1) }), () => response(pdf.subarray(0, 30)), () => new Response('private diagnostic', { status: 404 }), () => { throw new Error('private network detail'); }]) {
    const client = load('features/platform/api/cvFiles.ts', { localStorage: storage, fetch: async () => make() }).createCvFileClient();
    await assert.rejects(client('application', meta), error => !error.message.includes('private'));
  }
  let called = false; const controller = new AbortController(); controller.abort();
  const client = load('features/platform/api/cvFiles.ts', { localStorage: storage, fetch: async () => { called = true; return response(); } }).createCvFileClient();
  await assert.rejects(client('application', meta, controller.signal), error => error.name === 'AbortError'); assert.equal(called, false);
});
test('report export includes attachment metadata only when selected and never embeds private file bytes or a public URL', () => {
  const input = sample(); input.application.cv_url = null; input.application.cv_file = { name: 'PRIVATE_ATTACHMENT_NAME.pdf', size: pdf.length };
  const exports = load('features/platform/utils/applicationExport.ts');
  assert.equal(exports.printableApplication(input).includes('PRIVATE_ATTACHMENT_NAME.pdf'), false);
  const selected = exports.printableApplication(input, { letter: true, cvLink: true, advertisement: true, history: true });
  assert.ok(selected.includes('PRIVATE_ATTACHMENT_NAME.pdf')); assert.ok(selected.includes('غير مضمن')); assert.equal(selected.includes(pdf.toString('base64')), false); assert.equal(selected.includes('/applications/application/cv'), false);
});
