const { test } = require('node:test'); const assert = require('node:assert/strict'); const fs = require('node:fs'); const path = require('node:path'); const vm = require('node:vm'); const ts = require('typescript');
const root = path.resolve(__dirname, '../../frontend/src');
function load(file, globals = {}) { const module = { exports: {} }; const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText; vm.runInNewContext(code, { module, exports: module.exports, URL, URLSearchParams, Intl, require: name => name === '../../../shared/api' ? { API_BASE_URL: '/api' } : load(path.posix.normalize(path.posix.join(path.posix.dirname(file), name)) + '.ts', globals), ...globals }); return module.exports; }
const helper = load('features/platform/utils/applicants.ts'); const recruitment = load('features/platform/api/recruitment.ts');
const application = { _id: 'application', company_id: 'company', job_id: 'job', __v: 2, status: 'pending', createdAt: '2026-10-29T10:00:00Z', user_id: { _id: 'candidate', name: 'Fixture candidate', email: 'fixture@example.com', phone: null }, cv_url: null, cover_letter: null };
const result = values => ({ success: true, job_id: 'job', company_id: 'company', total: 1, page: 1, pages: 1, limit: 12, counts: { pending: 1, viewed: 0, shortlisted: 0, rejected: 0, hired: 0 }, applications: [application], ...values });
const reply = (status, body) => ({ status, ok: status >= 200 && status < 300, json: async () => body });

test('invalid applicant job URLs never select another job and changing company or job clears stale review filters', () => {
  const jobs = [{ _id: 'one' }, { _id: 'two' }]; assert.equal(helper.selectedApplicantJob(jobs, null)._id, 'one'); assert.equal(helper.selectedApplicantJob(jobs, 'two')._id, 'two'); assert.equal(helper.selectedApplicantJob(jobs, 'foreign'), undefined); assert.equal(helper.selectedApplicantJob(jobs, ''), undefined);
  const params = new URLSearchParams({ company: 'company', job: 'job', q: 'Name', status: 'viewed', page: '3', sort: 'oldest' });
  const changed = helper.patchApplicantsSearch(params, { company: 'other' }); assert.equal(changed.get('company'), 'other'); for (const key of ['job', 'q', 'status', 'sort', 'page']) assert.equal(changed.has(key), false);
  const filter = helper.patchApplicantsSearch(params, { status: 'pending' }); assert.equal(filter.get('company'), 'company'); assert.equal(filter.get('job'), 'job'); assert.equal(filter.has('page'), false); assert.equal(params.get('page'), '3');
  const state = helper.readApplicantsSearch(new URLSearchParams({ page: '-1', status: 'unknown', q: ' C++ ' })); assert.equal(state.page, 1); assert.equal(state.status, ''); assert.equal(helper.applicantsApiQuery(state).get('search'), 'C++'); assert.equal(helper.applicantsApiQuery(state).get('limit'), '12');
});

test('private applicant reads bind to the starting session and never send requests with another account token', async () => {
  let token = 'original'; let calls = 0; const storage = { getItem: () => token };
  const api = load('features/platform/api/applicantsClient.ts', { localStorage: storage, fetch: async () => { calls++; return reply(200, result()); } }); const client = api.createApplicantsClient('owner', 'company'); token = 'other';
  await assert.rejects(client.list('company', 'job', new URLSearchParams()), /تغيّرت جلسة/); assert.equal(calls, 0); token = 'original';
  const changed = load('features/platform/api/applicantsClient.ts', { localStorage: storage, fetch: async () => { token = 'other'; return reply(200, result()); } }).createApplicantsClient('owner', 'admin'); await assert.rejects(changed.list('company', 'job', new URLSearchParams()), /تغيّرت جلسة/);
});

test('applicant reads accept null legacy fields and deleted users but reject mismatched job or company records and unknown statuses', async () => {
  const bodies = [result(), result({ applications: [{ ...application, user_id: null }] }), result({ company_id: 'other' }), result({ applications: [{ ...application, job_id: 'foreign' }] }), result({ applications: [{ ...application, status: 'super-hired' }] }), result({ applications: [{ ...application, user_id: { _id: 'candidate', email: {} } }] })];
  const client = load('features/platform/api/applicantsClient.ts', { localStorage: { getItem: () => 'fixture' }, fetch: async () => reply(200, bodies.shift()) }).createApplicantsClient('owner', 'company');
  assert.equal((await client.list('company', 'job', new URLSearchParams())).applications[0].cv_url, null); assert.equal((await client.list('company', 'job', new URLSearchParams())).applications[0].user_id, null);
  for (let index = 0; index < 4; index++) await assert.rejects(client.list('company', 'job', new URLSearchParams()), /لا تتطابق بيانات المتقدمين/);
});

test('review saves send explicit selected status and scope with the loaded revision, require matching acknowledgements and preserve cancellation', async () => {
  const requests = []; const responses = [reply(200, { success: true, application_id: 'application', company_id: 'company', job_id: 'job', status: 'viewed', version: 3 }), reply(200, { success: true, application_id: 'application', company_id: 'company', job_id: 'job', status: 'viewed', version: 99 }), reply(409, {})];
  const client = load('features/platform/api/applicantsClient.ts', { localStorage: { getItem: () => 'fixture' }, fetch: async (url, options) => { requests.push({ url, ...options }); return responses.shift(); } }).createApplicantsClient('owner', 'company'); const controller = new AbortController();
  await client.saveStatus(application, 'company', 'job', 'viewed', controller.signal); assert.deepEqual(JSON.parse(requests[0].body), { status: 'viewed', expected_version: 2, job_id: 'job', company_id: 'company' }); assert.equal(requests[0].signal, controller.signal); assert.equal(requests[0].credentials, 'include'); assert.equal(requests[0].cache, 'no-store');
  await assert.rejects(client.saveStatus(application, 'company', 'job', 'viewed'), /تأكيد حفظ الحالة/); await assert.rejects(client.saveStatus(application, 'company', 'job', 'viewed'), error => error.status === 409);
  const before = requests.length; await assert.rejects(client.saveStatus(application, 'other', 'job', 'viewed'), /اختيارك الحالي/); assert.equal(requests.length, before);
});

test('unreadable responses, transport failures and unauthorized roles never become successful reviews or leak raw errors', async () => {
  const responses = [{ ...reply(200, {}), json: async () => { throw new SyntaxError('HTML'); } }, reply(403, { message: 'private internal detail' })];
  const client = load('features/platform/api/applicantsClient.ts', { localStorage: { getItem: () => 'fixture' }, fetch: async () => responses.shift() }).createApplicantsClient('owner', 'company');
  await assert.rejects(client.list('company', 'job', new URLSearchParams()), /قراءة بيانات المراجعة/); await assert.rejects(client.list('company', 'job', new URLSearchParams()), error => error.status === 403 && !error.message.includes('private'));
  const offline = load('features/platform/api/applicantsClient.ts', { localStorage: { getItem: () => 'fixture' }, fetch: async () => { throw new TypeError('offline'); } }).createApplicantsClient('owner', 'company'); await assert.rejects(offline.saveStatus(application, 'company', 'job', 'viewed'), /تأكيد تغيير الحالة/);
  const seeker = load('features/platform/api/applicantsClient.ts', { localStorage: { getItem: () => 'fixture' }, fetch: async () => { throw new Error('Must not fetch'); } }).createApplicantsClient('owner', 'seeker'); await assert.rejects(seeker.list('company', 'job', new URLSearchParams()), error => error.status === 401);
});

test('candidate document links remain limited to http and https and invalid dates never render Invalid Date', () => {
  for (const value of ['javascript:alert(1)', 'data:text/html,x', '/relative', '', null]) assert.equal(recruitment.safeDocumentUrl(value), undefined);
  assert.equal(recruitment.safeDocumentUrl('https://example.com/resume.pdf'), 'https://example.com/resume.pdf'); assert.equal(helper.applicantDate('invalid'), 'غير محدد'); assert.ok(helper.applicantDate(application.createdAt).includes('2026'));
});
