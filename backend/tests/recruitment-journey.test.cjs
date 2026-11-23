const { test, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const vm = require('node:vm');
const { randomUUID } = require('node:crypto');
const ts = require('typescript');
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'isolated-recruitment-journey-test-secret-at-least-32-chars';
process.env.EMAIL_USER = 'journey-mail@example.com';
process.env.EMAIL_PASS = 'isolated-mail-stub-only';
for (const key of ['SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'EMAIL_FROM']) delete process.env[key];
process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(__dirname, '../../.cache/mongodb');
process.env.MONGOMS_VERSION = '7.0.24';
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const session = require('express-session');
const request = require('supertest');
const User = require('../models/User');
const Application = require('../models/Application');
const Job = require('../models/Job');
const CV = require('../models/CV');
const Message = require('../models/ContactMessage');
const transporter = require('../modules/auth/services/email/transporter');
const password = 'JourneyFixturePassword123!';
const codes = new Map();
transporter.sendMail = async mail => {
  const match = mail.text.match(/\b(\d{5})\b/); assert.ok(match);
  codes.set(mail.to, match[1]); return { accepted: [mail.to], rejected: [] };
};
let database, app, admin, alpha, beta, candidate, otherCandidate;
function freshApp() { return require('../app').createApp({ sessionStore: new session.MemoryStore() }); }
function call(actor, method, url, body) {
  const operation = request(app)[method](url);
  if (actor) operation.set('Authorization', 'Bearer ' + actor.token);
  return body === undefined ? operation : operation.send(body);
}
function status(response, expected) {
  // Report only status/code on failure; never print a session token or OTP.
  assert.equal(response.status, expected, `HTTP ${response.status}; code=${response.body.code || 'none'}`);
  return response.body;
}
async function verify(agent, email) {
  const result = await agent.post('/api/auth/verify-code').send({ email, code: codes.get(email) });
  const data = status(result, 200); assert.ok(data.token); assert.ok(data.user._id);
  for (const key of ['password', 'password_hash', 'token_version']) assert.equal(data.user[key], undefined);
  return { token: data.token, user: data.user };
}
async function login(email) {
  const agent = request.agent(app);
  const pending = await agent.post('/api/auth/login').send({ email, password });
  assert.equal(status(pending, 200).token, undefined);
  return verify(agent, email);
}
async function register(email, name) {
  const agent = request.agent(app);
  status(await agent.post('/api/auth/signup').send({ email, password, full_name: name, role: 'admin' }), 201);
  const actor = await verify(agent, email); assert.equal(actor.user.role, 'seeker'); return actor;
}
async function provision(name, email) {
  const company = status(await call(admin, 'post', '/api/companies', { name_ar: name, about_ar: 'A synthetic company for an isolated recruitment journey.' }), 201);
  const account = status(await call(admin, 'post', '/api/auth/company-account', { company_id: company.company_id, expected_version: company.version, full_name: name + ' owner', email, password }), 201);
  assert.equal(account.user.role, 'company'); assert.equal(account.user.password, undefined);
  const actor = await login(email); return { ...actor, companyId: company.company_id };
}
const vacancy = (title, extra = {}) => ({ title, description: 'ORIGINAL_ADVERTISEMENT_MARKER: a sufficiently detailed synthetic vacancy.', field: 'تكنولوجيا', salary_min: 1000, salary_max: 2000, salary_visible: false, ...extra });
async function publish(actor, title, extra = {}) { return status(await call(actor, 'post', '/api/jobs', vacancy(title, extra)), 201).job_id; }
async function apply(actor, jobId, extra = {}) {
  return status(await call(actor, 'post', '/api/applications', { job_id: jobId, cover_letter: 'PRIVATE_LETTER_MARKER: synthetic candidate application.', cv_url: 'https://example.com/private-journey-resume.pdf', ...extra }), 201).application_id;
}
function loadPlatform(file) {
  const root = path.resolve(__dirname, '../../frontend/src'); const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, URL, URLSearchParams, Intl, DOMException, TextEncoder, require: name => name === '../../../shared/api' ? { API_BASE_URL: '/api' } : loadPlatform(path.posix.normalize(path.posix.join(path.posix.dirname(file), name)) + '.ts') });
  return module.exports;
}
before(async () => {
  database = await MongoMemoryServer.create();
  const uri = database.getUri('ttwar_recruitment_journey');
  assert.equal(new URL(uri).port === '27171', false, 'Never connect journey writes to the development database');
  await mongoose.connect(uri); app = freshApp();
  await Promise.all([Application.init(), CV.init(), Message.init()]);
  // Only the first administrator is bootstrapped directly, in the disposable database.
  await User.create({ email: 'journey-admin@example.com', password, role: 'admin', isVerified: true, is_verified: true });
  admin = await login('journey-admin@example.com');
  alpha = await provision('Journey Alpha', 'journey-alpha@example.com');
  beta = await provision('Journey Beta', 'journey-beta@example.com');
  candidate = await register('journey-candidate@example.com', 'Journey candidate');
  otherCandidate = await register('journey-other@example.com', 'Other journey candidate');
}, { timeout: 180000 });
beforeEach(() => { app = freshApp(); });
after(async () => { await mongoose.disconnect(); await database?.stop(); });

test('verified accounts complete publish, apply, review, historical export, contact and pending withdrawal through real API contracts', async () => {
  const profile = status(await call(candidate, 'put', '/api/user/profile', { name: 'Updated journey candidate' }), 200);
  assert.equal(profile.user.name, 'Updated journey candidate');
  const builder = { fullName: 'Updated journey candidate', jobTitle: 'Developer', email: candidate.user.email, projects: [{ id: 'p1', name: 'Synthetic project', description: 'A fixture only', tech: ['React'] }] };
  status(await call(candidate, 'post', '/api/cv', { builder_data: builder, expected_updated_at: null }), 200);
  assert.equal(status(await call(candidate, 'get', '/api/cv/my'), 200).cv.builder_data.projects[0].name, 'Synthetic project');

  const jobId = await publish(alpha, 'Journey complete vacancy', { is_active: false });
  status(await call(null, 'get', '/api/jobs/' + jobId), 404);
  status(await call(alpha, 'patch', '/api/jobs/' + jobId + '/toggle', { is_active: true, expected_version: 0 }), 200);
  const publicJob = status(await call(null, 'get', '/api/jobs/' + jobId), 200).job;
  assert.equal(publicJob.salary_min, null); assert.equal(publicJob.salary_max, null);
  const search = status(await call(null, 'get', '/api/jobs?search=' + encodeURIComponent('Journey complete vacancy')), 200);
  assert.ok(search.jobs.some(job => job._id === jobId));
  status(await call(candidate, 'post', '/api/applications', { job_id: jobId, job_snapshot: { title: 'FORGED_ADVERTISEMENT' } }), 400);
  const applicationId = await apply(candidate, jobId);
  status(await call(candidate, 'post', '/api/applications', { job_id: jobId }), 409);
  const review = status(await call(alpha, 'get', '/api/applications/job/' + jobId), 200);
  assert.equal(review.total, 1); assert.equal(review.applications[0].user_id.email, candidate.user.email);
  assert.equal(review.applications[0].user_id.password, undefined);
  assert.equal(review.applications[0].job_snapshot, undefined);
  status(await call(alpha, 'put', '/api/jobs/' + jobId, vacancy('Changed current vacancy', { expected_version: 1, description: 'CHANGED_DESCRIPTION_MARKER: current advertisement after submission.' })), 200);
  status(await call(alpha, 'patch', '/api/applications/' + applicationId + '/status', { status: 'shortlisted', expected_version: 0, company_id: alpha.companyId, job_id: jobId }), 200);
  status(await call(admin, 'patch', '/api/applications/' + applicationId + '/status', { status: 'hired', expected_version: 1, company_id: alpha.companyId, job_id: jobId }), 200);
  status(await call(alpha, 'patch', '/api/applications/' + applicationId + '/status', { status: 'rejected', expected_version: 0 }), 409);
  status(await call(candidate, 'delete', '/api/applications/' + applicationId + '/withdraw', { expected_version: 2 }), 400);
  const mine = status(await call(candidate, 'get', '/api/applications/my'), 200).applications;
  assert.equal(mine.find(item => item._id === applicationId).status, 'hired');
  const response = await call(candidate, 'get', '/api/applications/' + applicationId + '/report');
  const report = status(response, 200); assert.equal(response.headers['cache-control'], 'no-store');
  assert.equal(report.application.status, 'hired'); assert.equal(report.application.version, 2);
  assert.equal(report.snapshot.job.title, 'Journey complete vacancy'); assert.equal(report.snapshot.job.salary_max, null);
  assert.deepEqual(report.history.events.map(event => event.actor_role), ['seeker', 'company', 'admin']);
  assert.deepEqual(report.history.events.map(event => event.to_status), ['pending', 'shortlisted', 'hired']);
  assert.equal(report.history.complete, true);
  const normalized = loadPlatform('features/platform/api/applicationReport.ts').readApplicationReport(report, applicationId);
  const html = loadPlatform('features/platform/utils/applicationExport.ts').printableApplication(normalized);
  for (const included of ['ORIGINAL_ADVERTISEMENT_MARKER', 'PRIVATE_LETTER_MARKER', 'Journey complete vacancy']) assert.ok(html.includes(included));
  for (const omitted of ['FORGED_ADVERTISEMENT', 'CHANGED_DESCRIPTION_MARKER', 'private-journey-resume.pdf', alpha.user._id, admin.user._id, candidate.token]) assert.equal(html.includes(omitted), false);

  const messageInput = { company_id: alpha.companyId, sender_name: 'Synthetic contact', sender_email: candidate.user.email, message: 'Synthetic contact stored only in the disposable journey database.', client_request_id: randomUUID() };
  const message = status(await call(null, 'post', '/api/messages', messageInput), 201);
  assert.equal(status(await call(null, 'post', '/api/messages', messageInput), 201).message_id, message.message_id);
  const inbox = status(await call(alpha, 'get', '/api/messages/company/' + alpha.companyId), 200);
  assert.ok(inbox.messages.some(item => item._id === message.message_id));
  status(await call(alpha, 'patch', '/api/messages/' + message.message_id + '/read', { is_read: true, expected_version: 0, company_id: alpha.companyId }), 200);

  const pendingJob = await publish(beta, 'Journey withdrawal vacancy'); const pendingId = await apply(candidate, pendingJob);
  assert.equal(status(await call(candidate, 'delete', '/api/applications/' + pendingId + '/withdraw', { expected_version: 0 }), 200).application_id, pendingId);
  for (const suffix of ['/report', '/history', '/job']) status(await call(candidate, 'get', '/api/applications/' + pendingId + suffix), 404);
  assert.equal(await Application.countDocuments({ _id: pendingId }), 0);
});

test('two separately verified companies and candidates cannot cross tenant or personal resource boundaries', async () => {
  const jobA = await publish(alpha, 'Isolation Alpha vacancy'); const jobB = await publish(beta, 'Isolation Beta vacancy');
  const appA = await apply(candidate, jobA); const appB = await apply(otherCandidate, jobB);
  status(await call(otherCandidate, 'post', '/api/cv', { builder_data: { fullName: 'PRIVATE_BETA_CV_MARKER', email: otherCandidate.user.email }, expected_updated_at: null }), 200);
  const message = status(await call(null, 'post', '/api/messages', { company_id: alpha.companyId, sender_name: 'Synthetic private sender', sender_email: candidate.user.email, message: 'PRIVATE_MESSAGE_MARKER: a disposable tenant-isolation fixture.', client_request_id: randomUUID() }), 201);
  const denied = [
    [beta, 'get', '/api/jobs/manage?company_id=' + alpha.companyId, undefined, 404],
    [beta, 'put', '/api/jobs/' + jobA, vacancy('Unauthorized edit', { expected_version: 0 }), 403],
    [beta, 'delete', '/api/jobs/' + jobA, undefined, 403],
    [beta, 'get', '/api/applications/job/' + jobA, undefined, 403],
    [beta, 'patch', '/api/applications/' + appA + '/status', { status: 'rejected', expected_version: 0 }, 403],
    [beta, 'get', '/api/messages/company/' + alpha.companyId, undefined, 403],
    [beta, 'patch', '/api/messages/' + message.message_id + '/read', { is_read: true, expected_version: 0 }, 403],
    [beta, 'get', '/api/companies/' + alpha.companyId + '/overview', undefined, 403],
    [candidate, 'get', '/api/applications/job/' + jobB, undefined, 403],
    [candidate, 'patch', '/api/applications/' + appB + '/status', { status: 'hired', expected_version: 0 }, 403],
    [otherCandidate, 'delete', '/api/applications/' + appA + '/withdraw', { expected_version: 0 }, 404],
    [null, 'get', '/api/applications/' + appA + '/report', undefined, 401],
  ];
  for (const suffix of ['/report', '/history', '/job']) {
    denied.push([otherCandidate, 'get', '/api/applications/' + appA + suffix, undefined, 404]);
    for (const actor of [alpha, beta, admin]) denied.push([actor, 'get', '/api/applications/' + appA + suffix, undefined, 403]);
  }
  for (const [actor, method, url, body, expected] of denied) {
    const response = await call(actor, method, url, body); status(response, expected);
    for (const secret of [candidate.user.email, 'PRIVATE_LETTER_MARKER', 'PRIVATE_MESSAGE_MARKER', 'PRIVATE_BETA_CV_MARKER']) assert.equal(JSON.stringify(response.body).includes(secret), false);
  }
  const ownCV = status(await call(otherCandidate, 'get', '/api/cv/my?user_id=' + candidate.user._id), 200).cv;
  assert.equal(ownCV.builder_data.fullName, 'PRIVATE_BETA_CV_MARKER'); assert.equal(ownCV.user_id, otherCandidate.user._id);
  assert.equal(status(await call(candidate, 'get', '/api/applications/' + appA + '/report'), 200).application.status, 'pending');
  assert.equal(status(await call(otherCandidate, 'get', '/api/applications/' + appB + '/report'), 200).application.status, 'pending');
  assert.equal((await Job.findById(jobA)).title, 'Isolation Alpha vacancy'); assert.equal((await Message.findById(message.message_id)).is_read, false);
  const adminA = status(await call(admin, 'get', '/api/applications/job/' + jobA), 200);
  assert.equal(adminA.total, 1); assert.ok(adminA.applications.every(item => item.company_id === alpha.companyId));
});

test('administrative suspension and reactivation cannot restore old sessions, and company archival preserves submitted records', async () => {
  const jobId = await publish(alpha, 'Session and archival vacancy'); const applicationId = await apply(candidate, jobId);
  const access = '/api/admin/users/' + alpha.user._id + '/access';
  const paused = status(await call(admin, 'patch', access, { is_active: false, expected_revision: 0 }), 200);
  assert.equal(paused.sessions_revoked, true);
  for (const url of ['/api/auth/me', '/api/jobs/manage?company_id=' + alpha.companyId, '/api/applications/job/' + jobId]) status(await call(alpha, 'get', url), 401);
  status(await call(beta, 'get', '/api/jobs/manage?company_id=' + beta.companyId), 200);
  status(await call(candidate, 'get', '/api/applications/' + applicationId + '/report'), 200);
  status(await call(admin, 'patch', access, { is_active: true, expected_revision: paused.revision }), 200);
  status(await call(alpha, 'get', '/api/auth/me'), 401);
  const renewed = { ...await login(alpha.user.email), companyId: alpha.companyId };
  status(await call(renewed, 'patch', '/api/applications/' + applicationId + '/status', { status: 'viewed', expected_version: 0 }), 200);
  const company = status(await call(admin, 'get', '/api/companies/manage/' + alpha.companyId), 200).company;
  const archived = status(await call(admin, 'delete', '/api/companies/' + alpha.companyId, { expected_version: company.__v }), 200);
  assert.equal(archived.archived, true);
  status(await call(null, 'get', '/api/jobs/' + jobId), 404);
  status(await call(otherCandidate, 'post', '/api/applications', { job_id: jobId }), 404);
  const report = status(await call(candidate, 'get', '/api/applications/' + applicationId + '/report'), 200);
  assert.equal(report.application.status, 'viewed'); assert.equal(report.snapshot.job.title, 'Session and archival vacancy');
  status(await call(renewed, 'get', '/api/applications/job/' + jobId), 200);
  const history = status(await call(candidate, 'get', '/api/applications/' + applicationId + '/history'), 200);
  assert.equal(history.events.at(-1).actor_role, 'company');
  status(await call(admin, 'put', '/api/companies/' + alpha.companyId, { is_active: true, expected_version: archived.version }), 200);
  status(await call(null, 'get', '/api/jobs/' + jobId), 200);
  status(await call(alpha, 'get', '/api/auth/me'), 401);
});
