const { test, before, after } = require('node:test'); const assert = require('node:assert/strict'); const path = require('node:path');
process.env.NODE_ENV = 'test'; process.env.JWT_SECRET = 'a-local-test-secret-that-is-at-least-32-characters-long'; process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(__dirname, '../../.cache/mongodb'); process.env.MONGOMS_VERSION = '7.0.24';
const mongoose = require('mongoose'); const { MongoMemoryServer } = require('mongodb-memory-server'); const session = require('express-session'); const request = require('supertest');
const Company = require('../models/Company'); const Job = require('../models/Job'); const User = require('../models/User'); const { signToken } = require('../config/jwtConfig');
let database, app, admin, owner, outsider, company, otherCompany;
const auth = user => 'Bearer ' + signToken(user);
const body = (patch = {}) => ({ title: 'Managed developer role', description: 'A sufficiently detailed job description for tests.', field: 'تكنولوجيا', job_type: 'دوام كامل', region: 'ضفة', experience_level: 'حديث التخرج', ...patch });
before(async () => { database = await MongoMemoryServer.create(); await mongoose.connect(database.getUri()); app = require('../app').createApp({ sessionStore: new session.MemoryStore() }); [admin, owner, outsider] = await Promise.all(['admin', 'company', 'company'].map((role, index) => User.create({ email: 'management-' + index + '@example.com', password: 'FixturePassword123!', role }))); company = await Company.create({ name_ar: 'Managed company', user_id: owner._id }); otherCompany = await Company.create({ name_ar: 'Other company', user_id: outsider._id }); }, { timeout: 180000 });
after(async () => { await mongoose.disconnect(); await database?.stop(); });

test('publishing exposes field and visibility controls while paused jobs stay private and desired activation returns a new version', async () => {
  const created = await request(app).post('/api/jobs').set('Authorization', auth(admin)).send(body({ company_id: String(company._id), field: 'مالية وبنوك', salary_min: 0, salary_max: 6000, salary_visible: false, is_active: false, is_featured: true, role: 'admin', __v: 99 }));
  assert.equal(created.status, 201, JSON.stringify(created.body)); assert.equal(created.body.version, 0); const id = created.body.job_id;
  assert.equal((await request(app).get('/api/jobs/' + id)).status, 404);
  const manage = await request(app).get('/api/jobs/manage').set('Authorization', auth(owner)); const stored = manage.body.jobs.find(job => job._id === id); assert.equal(stored.salary_max, 6000); assert.equal(stored.salary_visible, false); assert.equal(stored.field, 'مالية وبنوك');
  const activated = await request(app).patch('/api/jobs/' + id + '/toggle').set('Authorization', auth(owner)).send({ is_active: true, expected_version: 0 }); assert.equal(activated.status, 200); assert.equal(activated.body.is_active, true); assert.equal(activated.body.version, 1);
  const published = await request(app).get('/api/jobs/' + id); assert.equal(published.status, 200); assert.equal(published.body.job.salary_max, null);
});

test('concurrent editors and stale activation requests cannot overwrite a newer job revision', async () => {
  const job = await Job.create({ ...body(), company_id: company._id, salary_visible: false }); const id = String(job._id);
  const results = await Promise.all(['First editor', 'Second editor'].map(title => request(app).put('/api/jobs/' + id).set('Authorization', auth(owner)).send(body({ title, expected_version: 0 }))));
  assert.equal(results.filter(result => result.status === 200).length, 1); assert.equal(results.filter(result => result.status === 409 && result.body.code === 'JOB_CONFLICT').length, 1);
  assert.equal((await Job.findById(id)).__v, 1);
  const paused = await request(app).patch('/api/jobs/' + id + '/toggle').set('Authorization', auth(owner)).send({ is_active: false, expected_version: 1 }); assert.equal(paused.status, 200); assert.equal(paused.body.version, 2);
  const stale = await request(app).patch('/api/jobs/' + id + '/toggle').set('Authorization', auth(owner)).send({ is_active: true, expected_version: 1 }); assert.equal(stale.status, 409); assert.equal((await Job.findById(id)).is_active, false);
  const edit = await request(app).put('/api/jobs/' + id).set('Authorization', auth(owner)).send(body({ expected_version: 1 })); assert.equal(edit.status, 409); assert.equal((await Job.findById(id)).__v, 2);
});

test('job creation and mutation retain company ownership and reject malformed states and oversized data', async () => {
  const created = await request(app).post('/api/jobs').set('Authorization', auth(owner)).send(body({ company_id: String(otherCompany._id) })); assert.equal(created.status, 201); const job = await Job.findById(created.body.job_id); assert.equal(String(job.company_id), String(company._id));
  assert.equal((await request(app).put('/api/jobs/' + job._id).set('Authorization', auth(outsider)).send(body({ expected_version: 0 }))).status, 403);
  assert.equal((await request(app).patch('/api/jobs/' + job._id + '/toggle').set('Authorization', auth(outsider)).send({ is_active: false, expected_version: 0 })).status, 403);
  for (const patch of [{ salary_visible: 'false' }, { location: 'x'.repeat(201) }, { requirements: ['x'.repeat(501)] }, { benefits: Array.from({ length: 101 }, () => 'Benefit') }, { salary_max: 1000000001 }, { expected_version: -1 }]) assert.equal((await request(app).put('/api/jobs/' + job._id).set('Authorization', auth(owner)).send(body(patch))).status, 400, JSON.stringify(patch));
  for (const patch of [{ is_active: 'false' }, { expected_version: -1 }]) assert.equal((await request(app).patch('/api/jobs/' + job._id + '/toggle').set('Authorization', auth(owner)).send(patch)).status, 400);
  assert.equal((await Job.findById(job._id)).__v, 0);
});

test('deadlines are preserved on unrelated edits, new published expired jobs are rejected, and legacy revisions migrate safely', async () => {
  const past = new Date(Date.now() - 3600000).toISOString();
  const denied = await request(app).post('/api/jobs').set('Authorization', auth(owner)).send(body({ deadline: past })); assert.equal(denied.status, 400); assert.equal(denied.body.code, 'JOB_DEADLINE_PAST');
  const paused = await request(app).post('/api/jobs').set('Authorization', auth(owner)).send(body({ deadline: past, is_active: false })); assert.equal(paused.status, 201);
  const original = await Job.create({ ...body(), company_id: company._id, deadline: past }); await Job.updateOne({ _id: original._id }, { $unset: { __v: 1 } });
  const edited = await request(app).put('/api/jobs/' + original._id).set('Authorization', auth(owner)).send(body({ title: 'An unrelated title edit', expected_version: 0 })); assert.equal(edited.status, 200, JSON.stringify(edited.body)); assert.equal(edited.body.version, 1); assert.equal((await Job.findById(original._id)).deadline.toISOString(), past);
  const unchanged = await request(app).put('/api/jobs/' + original._id).set('Authorization', auth(owner)).send(body({ deadline: past, expected_version: 1 })); assert.equal(unchanged.status, 200);
  const changed = await request(app).put('/api/jobs/' + original._id).set('Authorization', auth(owner)).send(body({ deadline: new Date(Date.now() - 7200000).toISOString(), expected_version: 2 })); assert.equal(changed.status, 400); assert.equal((await Job.findById(original._id)).__v, 2);
});
