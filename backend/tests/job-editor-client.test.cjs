const { test } = require('node:test'); const assert = require('node:assert/strict'); const path = require('node:path'); const fs = require('node:fs'); const vm = require('node:vm'); const ts = require('typescript');
const root = path.resolve(__dirname, '../../frontend/src');
function load(file, globals = {}) { const module = { exports: {} }; const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText; vm.runInNewContext(code, { module, exports: module.exports, Intl, URL, URLSearchParams, require: name => name === '../../../shared/api' ? { API_BASE_URL: '/api' } : load(path.posix.normalize(path.posix.join(path.posix.dirname(file), name)) + '.ts', globals), ...globals }); return module.exports; }
const helper = load('features/platform/utils/jobEditorValidation.ts'); const copy = value => JSON.parse(JSON.stringify(value));
const job = { _id: 'job', company_id: 'company', __v: 7, title: 'Saved title', description: 'A detailed existing job description.', field: null, region: null, job_type: null, experience_level: null, salary_min: 0, salary_max: 5000, salary_currency: '₪', salary_visible: false, is_active: false, is_featured: true, requirements: ['JavaScript'], benefits: [], deadline: '2026-11-05T11:23:45.123Z' };
const reply = (status, body) => ({ status, ok: status >= 200 && status < 300, json: async () => body });

test('job deadlines use end of day in Palestine through timezone changes and preserve untouched saved instants', () => {
  for (const day of ['2026-03-28', '2026-07-01', '2026-10-24', '2026-11-05']) {
    const iso = helper.endOfDeadlineDay(day); assert.equal(helper.deadlineDay(iso), day);
    const time = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Hebron', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(new Date(iso)); assert.equal(time, '23:59:59');
  }
  for (const day of ['2026-02-30', 'not-a-date', '0001-01-01']) assert.throws(() => helper.endOfDeadlineDay(day));
  const draft = helper.jobDraft(job); draft.title = 'Changed title'; assert.equal(helper.jobEditorPayload(draft, 'company', job).deadline, job.deadline);
});

test('editor drafts retain hidden salary, zero amounts and publication state and only payload allowed fields with the loaded revision', () => {
  const draft = helper.jobDraft(job); assert.equal(draft.salary_min, '0'); assert.equal(draft.salary_visible, false); assert.equal(draft.is_featured, true); assert.equal(draft.field, '');
  const payload = helper.jobEditorPayload({ ...draft, role: 'admin', views_count: 999, __v: 99 }, 'company', job);
  assert.equal(payload.expected_version, 7); assert.equal(payload.salary_visible, false); assert.equal(payload.field, null); assert.equal(payload.salary_min, 0);
  for (const key of ['role', 'views_count', '__v']) assert.equal(Object.hasOwn(payload, key), false);
  assert.equal(require('../middleware/validate').schemas.job.validate({ ...payload, company_id: 'a'.repeat(24) }).error, undefined);
});

test('job field errors reject invalid amounts and ranges, enforce server limits and support Arabic salary digits', () => {
  const draft = { ...helper.jobDraft(job), deadline: '', salary_min: '٢٥٠٠٫٥', salary_max: '۳۰۰۰' };
  assert.equal(Object.keys(helper.jobEditorErrors(draft, job)).length, 0); assert.equal(helper.jobEditorPayload(draft, 'company', job).salary_min, 2500.5);
  for (const value of ['-1', '1e3', 'Infinity', '1,500', '1000000001']) assert.ok(helper.jobEditorErrors({ ...draft, salary_min: value }, job).salary_min);
  assert.ok(helper.jobEditorErrors({ ...draft, salary_min: '5000', salary_max: '4000' }, job).salary_max);
  for (const [key, value] of [['title', 'x'], ['description', 'short'], ['location', 'x'.repeat(201)], ['requirements', 'x'.repeat(501)], ['field', 'unknown']]) assert.ok(helper.jobEditorErrors({ ...draft, [key]: value }, job)[key]);
  assert.ok(helper.jobEditorErrors({ ...draft, is_active: true, deadline: '2020-01-01' }, undefined, new Date('2026-01-01').getTime()).deadline);
});

test('publication labels distinguish paused jobs, expired deadlines and inactive companies without claiming renewed deadlines', () => {
  assert.equal(helper.publicationState({ is_active: false, deadline: null }).label, 'موقوفة');
  assert.equal(helper.publicationState({ is_active: true, deadline: '2020-01-01' }).label, 'انتهى التقديم');
  assert.equal(helper.publicationState({ is_active: true, deadline: null }, false).label, 'الشركة موقوفة');
  assert.equal(helper.publicationState({ is_active: true, deadline: null }, true).tone, 'success');
});

test('management requests bind to the original session and block wrong-company job replies before they can populate an editor', async () => {
  let token = 'first'; let calls = 0; const storage = { getItem: () => token };
  const api = load('features/platform/api/jobManagement.ts', { localStorage: storage, fetch: async () => { calls++; return reply(200, { success: true, jobs: [] }); } }); const client = api.createJobManagementClient('owner', 'company'); token = 'second';
  await assert.rejects(client.jobs('company'), /تغيّرت جلسة/); assert.equal(calls, 0); token = 'first';
  const mixed = load('features/platform/api/jobManagement.ts', { localStorage: storage, fetch: async () => reply(200, { success: true, jobs: [{ ...job, company_id: 'another-company' }] }) }).createJobManagementClient('owner', 'admin'); await assert.rejects(mixed.jobs('company'), /الشركة المحددة/);
  const changed = load('features/platform/api/jobManagement.ts', { localStorage: storage, fetch: async () => { token = 'second'; return reply(200, { success: true, jobs: [] }); } }).createJobManagementClient('owner', 'company'); await assert.rejects(changed.jobs('company'), /تغيّرت جلسة/);
});

test('management mutations send explicit desired state and the original revision, require acknowledged replies and honor cancellation', async () => {
  const requests = []; const responses = [reply(200, { success: true, job_id: 'job', version: 8, is_active: true }), reply(200, { success: true, job_id: 'job', version: 8 }), reply(200, { success: true }), reply(409, {})];
  const api = load('features/platform/api/jobManagement.ts', { localStorage: { getItem: () => 'fixture-token' }, fetch: async (url, options) => { requests.push({ url, ...options }); return responses.shift(); } }); const client = api.createJobManagementClient('owner', 'company'); const controller = new AbortController();
  await client.setState(job, true, controller.signal); assert.deepEqual(JSON.parse(requests[0].body), { is_active: true, expected_version: 7 }); assert.equal(requests[0].signal, controller.signal); assert.equal(requests[0].credentials, 'include');
  await client.save('company', job, helper.jobEditorPayload(helper.jobDraft(job), 'company', job), controller.signal); assert.equal(JSON.parse(requests[1].body).expected_version, 7);
  await assert.rejects(client.setState(job, false), /تأكيد حالة الوظيفة/); await assert.rejects(client.setState(job, true), error => error.status === 409);
  const before = requests.length; await assert.rejects(client.save('other', job, {}), /الشركة المحددة/); assert.equal(requests.length, before);
});

test('company account reads must match their owner and failed mutation transport never turns into a successful save', async () => {
  const wrong = load('features/platform/api/jobManagement.ts', { localStorage: { getItem: () => 'fixture-token' }, fetch: async () => reply(200, { success: true, company: { _id: 'company', name_ar: 'Company', user_id: 'other' } }) }).createJobManagementClient('owner', 'company'); await assert.rejects(wrong.companies(), /الشركة المرتبطة/);
  const offline = load('features/platform/api/jobManagement.ts', { localStorage: { getItem: () => 'fixture-token' }, fetch: async () => { throw new TypeError('Failed to fetch'); } }).createJobManagementClient('owner', 'company'); await assert.rejects(offline.setState(job, true), error => error.status === 0 && error.message.includes('تأكيد الحفظ'));
  const seeker = load('features/platform/api/jobManagement.ts', { localStorage: { getItem: () => 'fixture-token' }, fetch: async () => { throw new Error('Must not fetch'); } }).createJobManagementClient('owner', 'seeker'); await assert.rejects(seeker.jobs('company'), error => error.status === 401);
  assert.equal(copy(helper.jobEditorPayload(helper.jobDraft(), 'company')).company_id, 'company');
});
