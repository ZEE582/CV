const { test } = require('node:test'); const assert = require('node:assert/strict'); const path = require('node:path'); const fs = require('node:fs'); const vm = require('node:vm'); const ts = require('typescript');
const root = path.resolve(__dirname, '../../frontend/src');
function load(file, globals = {}) {
  const module = { exports: {} }; const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, URL, URLSearchParams, require: name => name === '../../../shared/api' ? { API_BASE_URL: '/api' } : load(path.posix.normalize(path.posix.join(path.posix.dirname(file), name)) + '.ts', globals), ...globals }); return module.exports;
}
const jobs = load('features/platform/utils/jobsSearch.ts'); const application = load('features/platform/utils/applicationValidation.ts'); const copy = value => JSON.parse(JSON.stringify(value));
const reply = (status, data) => ({ status, ok: status >= 200 && status < 300, json: async () => data });

test('job URL state restores filters and sort, resets pagination on edits, and encodes exact backend search keys', () => {
  const params = new URLSearchParams({ q: ' C++ ', type: 'دوام كامل', reg: 'ضفة', page: '3', sort: 'salary', currency: '$' });
  const state = jobs.readJobsSearch(params); assert.equal(state.page, 3); assert.equal(state.currency, '$'); assert.equal(state.availability, 'open');
  const query = jobs.jobsApiQuery(state); assert.equal(query.get('search'), 'C++'); assert.equal(query.get('region'), 'ضفة'); assert.equal(query.get('limit'), '12'); assert.equal(query.get('currency'), '$');
  assert.equal(jobs.patchJobsSearch(params, { type: 'دوام جزئي' }).has('page'), false); assert.equal(params.get('page'), '3');
  assert.equal(jobs.patchJobsSearch(params, { page: 4 }).get('page'), '4');
  const invalid = jobs.readJobsSearch(new URLSearchParams({ page: '-1', type: 'unknown', sort: 'bad' })); assert.equal(invalid.page, 1); assert.equal(invalid.type, ''); assert.equal(invalid.sort, 'newest');
});

test('job deadlines and safe return destinations match open versus archived navigation', () => {
  const now = 10000; assert.equal(jobs.isJobOpen({ is_active: true, deadline: null }, now), true);
  assert.equal(jobs.isJobOpen({ is_active: true, deadline: new Date(now - 1).toISOString() }, now), false);
  assert.equal(jobs.isJobOpen({ is_active: false, deadline: null }, now), false); assert.equal(jobs.isJobOpen({ is_active: true, deadline: 'bad' }, now), false);
  assert.equal(jobs.jobsReturnPath({ fromJobs: '/jobs?q=C%2B%2B&page=2' }), '/jobs?q=C%2B%2B&page=2');
  for (const value of ['//evil.example', '/login', '/jobs\\evil', '/jobs?x=\n']) assert.equal(jobs.jobsReturnPath({ fromJobs: value }), '/jobs');
});

test('job search rejects unreadable success replies, maps failures and keeps cancellation without a bearer token', async () => {
  const requests = []; const responses = [reply(200, { success: true, jobs: [], total: 0, page: 1, pages: 1, limit: 12 }), reply(200, {}), reply(429, { message: 'private detail' })];
  const api = load('features/platform/api/jobsSearch.ts', { fetch: async (url, options) => { requests.push({ url, ...options }); return responses.shift(); } }); const controller = new AbortController();
  assert.equal((await api.searchJobs(new URLSearchParams('search=C%2B%2B'), controller.signal)).total, 0); assert.equal(requests[0].signal, controller.signal); assert.equal(requests[0].cache, 'no-store'); assert.equal(requests[0].headers, undefined);
  await assert.rejects(api.searchJobs(new URLSearchParams()), /قراءة نتائج الوظائف/); await assert.rejects(api.searchJobs(new URLSearchParams()), error => !error.message.includes('private') && error.message.includes('طلبات كثيرة'));
});

test('application field validation accepts optional blanks and proper links while payloads omit privileged or unrelated fields', () => {
  assert.deepEqual(copy(application.validateApplication({ cover: '', cvUrl: '' })), {});
  for (const cvUrl of ['javascript:alert(1)', 'https://bad url', 'not-a-url']) assert.ok(application.validateApplication({ cover: '', cvUrl }).cvUrl);
  assert.ok(application.validateApplication({ cover: 'x'.repeat(10001), cvUrl: '' }).cover);
  const payload = application.applicationPayload('job', { cover: ' Letter ', cvUrl: ' https://example.com/resume.pdf ', user_id: 'other', status: 'hired' });
  assert.deepEqual(copy(payload), { job_id: 'job', cover_letter: 'Letter', cv_url: 'https://example.com/resume.pdf' });
});

test('application requests stop before or after session changes and validate the owner of prior applications', async () => {
  let token = 'original'; let calls = 0; const storage = { getItem: () => token };
  const api = load('features/platform/api/applicationClient.ts', { localStorage: storage, fetch: async () => { calls++; return reply(201, { success: true, application_id: 'fixture' }); } }); const client = api.createApplicationClient('owner', 'job');
  token = 'other'; await assert.rejects(client.submit({ cover: '', cvUrl: '' }), /تغيّرت جلسة/); assert.equal(calls, 0); token = 'original';
  const changing = load('features/platform/api/applicationClient.ts', { localStorage: storage, fetch: async () => { token = 'other'; return reply(201, { success: true, application_id: 'fixture' }); } }).createApplicationClient('owner', 'job'); await assert.rejects(changing.submit({ cover: '', cvUrl: '' }), /تغيّرت جلسة/); token = 'original';
  const wrong = load('features/platform/api/applicationClient.ts', { localStorage: storage, fetch: async () => reply(200, { success: true, applications: [{ job_id: 'job', user_id: 'someone-else', status: 'pending' }] }) }).createApplicationClient('owner', 'job'); await assert.rejects(wrong.status(), /تأكيد بيانات الطلب/);
});

test('application status and submission require acknowledged results and preserve signals and the exact job', async () => {
  const requests = []; const responses = [reply(200, { success: true, applications: [{ job_id: { _id: 'job' }, user_id: 'owner', status: 'viewed' }] }), reply(201, { success: true, application_id: 'new' }), reply(201, { success: true }), reply(409, {})];
  const api = load('features/platform/api/applicationClient.ts', { localStorage: { getItem: () => 'fixture-token' }, fetch: async (url, options) => { requests.push({ url, ...options }); return responses.shift(); } }); const client = api.createApplicationClient('owner', 'job'); const controller = new AbortController();
  assert.equal(await client.status(controller.signal), 'viewed'); await client.submit({ cover: ' Letter ', cvUrl: '' }, controller.signal);
  assert.equal(requests[1].signal, controller.signal); assert.equal(requests[1].credentials, 'include'); assert.deepEqual(JSON.parse(requests[1].body), { job_id: 'job', cover_letter: 'Letter' });
  await assert.rejects(client.submit({ cover: '', cvUrl: '' }), /تأكيد إرسال الطلب/); await assert.rejects(client.submit({ cover: '', cvUrl: '' }), /قدّمت لهذه الوظيفة/);
});
