const { test } = require('node:test'); const assert = require('node:assert/strict'); const path = require('node:path'); const fs = require('node:fs'); const vm = require('node:vm'); const ts = require('typescript');
const root = path.resolve(__dirname, '../../frontend/src');
function load(file, globals = {}) { const module = { exports: {} }; const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText; vm.runInNewContext(code, { module, exports: module.exports, URL, URLSearchParams, Intl, require: name => name === '../../../shared/api' ? { API_BASE_URL: '/api' } : load(path.posix.normalize(path.posix.join(path.posix.dirname(file), name)) + '.ts', globals), ...globals }); return module.exports; }
const helper = load('features/platform/utils/companyDashboard.ts'); const parser = load('features/platform/api/companyOverview.ts');
const result = values => ({ success: true, company_id: 'company', generated_at: '2026-11-04T10:00:00Z', jobs: { total: 3, open: 1, paused: 1, expired: 1, company_paused: 0 }, applications: { total: 2, by_status: { pending: 1, viewed: 1, shortlisted: 0, rejected: 0, hired: 0, other: 0 } }, messages: { total: 3, read: 1, unread: 2 }, ...values });
const reply = (status, body) => ({ status, ok: status >= 200 && status < 300, json: async () => body });

test('company overview requires the selected company, valid count totals and timestamps before displaying activity', async () => {
  assert.equal(parser.readCompanyOverview(result(), 'company').messages.unread, 2);
  for (const body of [result({ company_id: 'other' }), result({ generated_at: 'invalid' }), result({ jobs: { total: 3, open: 1, paused: -1, expired: 3, company_paused: 0 } }), result({ messages: { total: 99, read: 1, unread: 2 } }), result({ applications: { total: 2, by_status: { pending: 2 } } })]) assert.throws(() => parser.readCompanyOverview(body, 'company'), /ملخص الشركة/);
  const calls = []; const controller = new AbortController(); const client = load('features/platform/api/jobManagement.ts', { localStorage: { getItem: () => 'fixture' }, fetch: async (url, options) => { calls.push({ url, ...options }); return reply(200, result()); } }).createJobManagementClient('owner', 'company');
  assert.equal((await client.overview('company', controller.signal)).jobs.open, 1); assert.equal(calls[0].url, '/api/companies/company/overview'); assert.equal(calls[0].signal, controller.signal); assert.equal(calls[0].cache, 'no-store'); assert.equal(calls[0].headers.Authorization, 'Bearer fixture');
});

test('overview reads refuse account changes before and after transport and preserve cancellation without exposing server errors', async () => {
  let token = 'original'; let count = 0; const globals = { localStorage: { getItem: () => token }, fetch: async () => { count++; return reply(200, result()); } };
  const client = load('features/platform/api/jobManagement.ts', globals).createJobManagementClient('owner', 'admin'); token = 'different'; await assert.rejects(client.overview('company'), /تغيّرت جلسة/); assert.equal(count, 0); token = 'original';
  const changed = load('features/platform/api/jobManagement.ts', { ...globals, fetch: async () => { token = 'different'; return reply(200, result()); } }).createJobManagementClient('owner', 'admin'); await assert.rejects(changed.overview('company'), /تغيّرت جلسة/); token = 'original';
  const denied = load('features/platform/api/jobManagement.ts', { ...globals, fetch: async () => reply(403, { message: 'private internal detail' }) }).createJobManagementClient('owner', 'company'); await assert.rejects(denied.overview('company'), error => error.status === 403 && !error.message.includes('private'));
  const controller = new AbortController(); const aborted = load('features/platform/api/jobManagement.ts', { ...globals, fetch: async () => { controller.abort(); throw new Error('cancelled'); } }).createJobManagementClient('owner', 'company'); await assert.rejects(aborted.overview('company', controller.signal), /cancelled/);
});

test('administrators load the managed company list including paused companies while owners retain their own company endpoint', async () => {
  const urls = []; const globals = { localStorage: { getItem: () => 'fixture' }, fetch: async url => { urls.push(url); return reply(200, url.endsWith('/my') ? { success: true, company: { _id: 'company', user_id: 'owner', name_ar: 'Fixture', is_active: false } } : { success: true, companies: [{ _id: 'company', name_ar: 'Fixture', is_active: false }] }); } };
  const api = load('features/platform/api/jobManagement.ts', globals); assert.equal((await api.createJobManagementClient('admin', 'admin').companies())[0].is_active, false); assert.equal((await api.createJobManagementClient('owner', 'company').companies())[0]._id, 'company'); assert.deepEqual(urls, ['/api/companies/manage', '/api/companies/my']);
  const malformed = load('features/platform/api/jobManagement.ts', { ...globals, fetch: async () => reply(200, { success: true, jobs: [{ _id: 'job', company_id: 'company', title: 'Title', location: { private: 'data' } }] }) }).createJobManagementClient('owner', 'company'); await assert.rejects(malformed.jobs('company'), /وظائف الشركة/);
});

test('dashboard URL changes reset the page and company navigation retains only explicit company scope including invalid selections', () => {
  const params = new URLSearchParams({ company: 'one', q: 'C++', view: 'paused', page: '3', sort: 'oldest', job: 'old-job', status: 'pending' });
  const changed = helper.patchCompanyDashboardSearch(params, { company: 'two' }); assert.equal(changed.get('company'), 'two'); for (const key of ['q', 'view', 'page', 'sort', 'job', 'status']) assert.equal(changed.has(key), false); assert.equal(params.get('page'), '3');
  const filtered = helper.patchCompanyDashboardSearch(params, { view: 'open' }); assert.equal(filtered.get('company'), 'one'); assert.equal(filtered.has('page'), false);
  for (const path of ['/admin/company-dashboard', '/admin/applicants', '/admin/messages']) assert.equal(helper.companyWorkspaceLink(path, 'invalid selection'), path + '?company=invalid+selection');
  assert.equal(helper.companyWorkspaceLink('/admin/companies', 'one'), '/admin/companies'); assert.equal(helper.companyWorkspaceLink('/admin/messages', null), '/admin/messages');
  const state = helper.readCompanyDashboardSearch(new URLSearchParams({ page: 'bad', view: '__proto__', sort: 'unknown' })); assert.equal(state.page, 1); assert.equal(state.view, 'all'); assert.equal(state.sort, 'newest');
});

test('job list filters literal titles and locations, paginates without overlap, sorts ties stably and uses deadline plus company publication state', () => {
  const now = Date.parse('2026-11-04T10:00:00Z');
  const jobs = Array.from({ length: 30 }, (_, index) => ({ _id: String(index).padStart(2, '0'), title: index === 0 ? 'Developer [C++]' : 'Role ' + index, location: index === 1 ? 'رام الله' : null, field: null, createdAt: '2026-11-04T09:00:00Z', is_active: index % 3 !== 1, deadline: index % 3 === 2 ? '2026-11-04T08:00:00Z' : null }));
  const all = helper.readCompanyDashboardSearch(new URLSearchParams()); const first = helper.companyJobPage(jobs, all, true, now); const second = helper.companyJobPage(jobs, { ...all, page: 2 }, true, now); assert.equal(first.total, 30); assert.equal(first.items.length, 12); assert.equal(second.items.some(item => first.items.some(other => other._id === item._id)), false); assert.equal(helper.companyJobPage(jobs, { ...all, page: 99 }, true, now).page, 3); assert.equal(jobs[0]._id, '00');
  assert.equal(helper.companyJobPage(jobs, { ...all, search: '[C++]' }, true, now).total, 1); assert.equal(helper.companyJobPage(jobs, { ...all, search: '.*' }, true, now).total, 0); assert.equal(helper.companyJobPage(jobs, { ...all, search: 'رام' }, true, now).total, 1);
  assert.equal(helper.companyJobPage(jobs, { ...all, view: 'open' }, true, now).total, 10); assert.equal(helper.companyJobPage(jobs, { ...all, view: 'company_paused' }, false, now).total, 20); assert.equal(helper.dashboardJobState({ is_active: true, deadline: new Date(now).toISOString() }, true, now), 'open'); assert.equal(helper.dashboardJobState({ is_active: true, deadline: new Date(now - 1).toISOString() }, true, now), 'expired');
});
