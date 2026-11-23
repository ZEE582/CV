const { test, before, after } = require('node:test'); const assert = require('node:assert/strict'); const path = require('node:path');
process.env.NODE_ENV = 'test'; process.env.JWT_SECRET = 'a-local-test-secret-that-is-at-least-32-characters-long'; process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(__dirname, '../../.cache/mongodb'); process.env.MONGOMS_VERSION = '7.0.24';
const mongoose = require('mongoose'); const { MongoMemoryServer } = require('mongodb-memory-server'); const session = require('express-session'); const request = require('supertest');
const Company = require('../models/Company'); const Job = require('../models/Job'); const User = require('../models/User'); const Application = require('../models/Application'); const Message = require('../models/ContactMessage'); const { signToken } = require('../config/jwtConfig');
let database, app, admin, owner, outsider, seeker, company, otherCompany, jobs; const auth = user => 'Bearer ' + signToken(user);
before(async () => {
  database = await MongoMemoryServer.create(); await mongoose.connect(database.getUri()); app = require('../app').createApp({ sessionStore: new session.MemoryStore() });
  [admin, owner, outsider, seeker] = await Promise.all(['admin', 'company', 'company', 'seeker'].map((role, index) => User.create({ email: 'overview-' + index + '@example.com', password: 'FixturePassword123!', role })));
  company = await Company.create({ name_ar: 'Overview company', user_id: owner._id }); otherCompany = await Company.create({ name_ar: 'Other company', user_id: outsider._id });
  jobs = await Job.create([
    { company_id: company._id, title: 'Open indefinitely', description: 'Fixture' },
    { company_id: company._id, title: 'Expired', description: 'Fixture', deadline: new Date(Date.now() - 3600000) },
    { company_id: company._id, title: 'Paused', description: 'Fixture', is_active: false },
    { company_id: company._id, title: 'Open future', description: 'Fixture', deadline: new Date(Date.now() + 3600000) },
    { company_id: company._id, title: 'Paused expired', description: 'Fixture', is_active: false, deadline: new Date(Date.now() - 3600000) },
    { company_id: otherCompany._id, title: 'Other private job', description: 'Fixture' },
  ]);
}, { timeout: 180000 });
after(async () => { await mongoose.disconnect(); await database?.stop(); });
const get = user => request(app).get('/api/companies/' + company._id + '/overview').set('Authorization', auth(user));

test('company summaries count publication state and only applications linked to the same existing company jobs, without private message or candidate data', async () => {
  await Application.create(['pending', 'pending', 'viewed', 'hired'].map(status => ({ company_id: company._id, job_id: jobs[0]._id, user_id: new mongoose.Types.ObjectId(), status, cover_letter: 'Private fixture letter' })));
  await Application.collection.insertOne({ company_id: company._id, job_id: jobs[0]._id, user_id: new mongoose.Types.ObjectId(), status: 'legacy', cv_url: 'https://example.com/private-fixture.pdf' });
  await Application.create([{ company_id: company._id, job_id: jobs[5]._id, user_id: new mongoose.Types.ObjectId() }, { company_id: company._id, job_id: new mongoose.Types.ObjectId(), user_id: new mongoose.Types.ObjectId() }, { company_id: otherCompany._id, job_id: jobs[0]._id, user_id: new mongoose.Types.ObjectId() }]);
  await Message.create([false, false, true].map(is_read => ({ company_id: company._id, sender_name: 'Private sender fixture', sender_email: 'private-fixture@example.com', message: 'Private synthetic message', is_read })));
  await Message.create({ company_id: otherCompany._id, sender_name: 'Other sender', sender_email: 'other@example.com', message: 'Other private message' });
  const response = await get(owner); assert.equal(response.status, 200, JSON.stringify(response.body)); assert.equal(response.headers['cache-control'], 'no-store'); assert.equal(response.body.company_id, String(company._id)); assert.ok(Number.isFinite(Date.parse(response.body.generated_at)));
  assert.deepEqual(response.body.jobs, { total: 5, open: 2, paused: 2, expired: 1, company_paused: 0 }); assert.equal(response.body.applications.total, 5); assert.equal(response.body.applications.by_status.pending, 2); assert.equal(response.body.applications.by_status.other, 1); assert.deepEqual(response.body.messages, { total: 3, read: 1, unread: 2 });
  for (const privateValue of ['Private fixture letter', 'private-fixture@example.com', 'private-fixture.pdf', 'Private synthetic message']) assert.equal(JSON.stringify(response.body).includes(privateValue), false);
  assert.equal((await Job.findById(jobs[0]._id)).views_count, 0); assert.equal((await Company.findById(company._id)).views_count, 0);
});

test('overview requires the owner or administrator and rejects missing, malformed, foreign and anonymous scopes', async () => {
  assert.equal((await request(app).get('/api/companies/' + company._id + '/overview')).status, 401); assert.equal((await get(seeker)).status, 403); assert.equal((await get(outsider)).status, 403); assert.equal((await get(admin)).status, 200);
  assert.equal((await request(app).get('/api/companies/' + new mongoose.Types.ObjectId() + '/overview').set('Authorization', auth(admin))).status, 404);
  assert.equal((await request(app).get('/api/companies/not-an-id/overview').set('Authorization', auth(admin))).status, 400);
});

test('admin management includes paused companies while the public catalogue stays active-only and company accounts cannot enumerate managed companies', async () => {
  await Company.updateOne({ _id: company._id }, { $set: { is_active: false } });
  const managed = await request(app).get('/api/companies/manage').set('Authorization', auth(admin)); assert.equal(managed.status, 200); assert.equal(managed.headers['cache-control'], 'no-store'); assert.equal(managed.body.companies.length, 2); assert.equal(managed.body.companies.find(item => item._id === String(company._id)).is_active, false);
  assert.equal((await request(app).get('/api/companies/manage').set('Authorization', auth(owner))).status, 403); assert.equal((await request(app).get('/api/companies/manage')).status, 401);
  const publicList = await request(app).get('/api/companies'); assert.equal(publicList.body.companies.some(item => item._id === String(company._id)), false);
  const overview = await get(owner); assert.deepEqual(overview.body.jobs, { total: 5, open: 0, paused: 2, expired: 0, company_paused: 3 }); assert.equal(overview.body.applications.total, 5);
});

test('deleted jobs cease contributing application counts and empty company summaries contain zeros instead of invented activity', async () => {
  await Job.deleteOne({ _id: jobs[0]._id }); assert.equal((await get(owner)).body.applications.total, 0);
  const empty = await Company.create({ name_ar: 'Empty overview' }); const response = await request(app).get('/api/companies/' + empty._id + '/overview').set('Authorization', auth(admin)); assert.equal(response.status, 200); assert.equal(response.body.jobs.total, 0); assert.equal(response.body.messages.total, 0); assert.equal(response.body.applications.total, 0);
});
