const { test, before, after } = require('node:test'); const assert = require('node:assert/strict'); const path = require('node:path');
process.env.NODE_ENV = 'test'; process.env.JWT_SECRET = 'a-local-test-secret-that-is-at-least-32-characters-long'; process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(__dirname, '../../.cache/mongodb'); process.env.MONGOMS_VERSION = '7.0.24';
const mongoose = require('mongoose'); const { MongoMemoryServer } = require('mongodb-memory-server'); const session = require('express-session'); const request = require('supertest');
const User = require('../models/User'); const Job = require('../models/Job'); const Company = require('../models/Company'); const Application = require('../models/Application'); const { signToken } = require('../config/jwtConfig');
let database, app, admin, owner, outsider, company, otherCompany, job, otherJob, candidates;
const auth = user => 'Bearer ' + signToken(user);
before(async () => {
  database = await MongoMemoryServer.create(); await mongoose.connect(database.getUri()); app = require('../app').createApp({ sessionStore: new session.MemoryStore() }); await Application.init();
  [admin, owner, outsider] = await Promise.all(['admin', 'company', 'company'].map((role, index) => User.create({ email: 'review-manager-' + index + '@example.com', password: 'FixturePassword123!', role })));
  company = await Company.create({ name_ar: 'Review company', user_id: owner._id }); otherCompany = await Company.create({ name_ar: 'Other review company', user_id: outsider._id });
  [job, otherJob] = await Job.create([{ company_id: company._id, title: 'Review job', description: 'Description' }, { company_id: otherCompany._id, title: 'Other job', description: 'Description' }]);
  candidates = await User.insertMany(Array.from({ length: 36 }, (_, index) => ({ provider: 'google', role: 'seeker', name: index === 0 ? 'Candidate [C++]' : 'Candidate ' + index, email: 'review-candidate-' + index + '@example.com', phone: '0590000000' })));
}, { timeout: 180000 });
after(async () => { await mongoose.disconnect(); await database?.stop(); });

test('authorized review pages search literal names and email, filter status, and page only the selected company job', async () => {
  const statuses = ['pending', 'viewed', 'shortlisted', 'rejected', 'hired'];
  await Application.insertMany(candidates.slice(0, 30).map((user, index) => ({ user_id: user._id, job_id: job._id, company_id: company._id, status: statuses[index % 5], cover_letter: 'Fixture letter' })));
  await Application.create({ user_id: candidates[30]._id, job_id: job._id, company_id: otherCompany._id });
  const first = await request(app).get('/api/applications/job/' + job._id).set('Authorization', auth(owner)).query({ page: 1, limit: 12 }); assert.equal(first.status, 200, JSON.stringify(first.body)); assert.equal(first.headers['cache-control'], 'no-store'); assert.equal(first.body.total, 30); assert.equal(first.body.pages, 3); assert.equal(first.body.counts.pending, 6);
  assert.equal(first.body.company_id, String(company._id)); assert.equal(first.body.job_id, String(job._id));
  for (const item of first.body.applications) { assert.equal(item.company_id, String(company._id)); for (const key of ['password', 'password_hash', 'token_version', 'role']) assert.equal(item.user_id[key], undefined); }
  const second = await request(app).get('/api/applications/job/' + job._id).set('Authorization', auth(owner)).query({ page: 2, limit: 12 }); assert.equal(second.body.applications.some(item => first.body.applications.some(other => other._id === item._id)), false);
  const last = await request(app).get('/api/applications/job/' + job._id).set('Authorization', auth(admin)).query({ page: 99, limit: 12 }); assert.equal(last.body.page, 3); assert.equal(last.body.applications.length, 6);
  for (const [search, count] of [['[C++]', 1], ['review-candidate-1@', 1], ['.*', 0]]) { const result = await request(app).get('/api/applications/job/' + job._id).set('Authorization', auth(owner)).query({ search }); assert.equal(result.status, 200); assert.equal(result.body.total, count); }
  const filtered = await request(app).get('/api/applications/job/' + job._id).set('Authorization', auth(owner)).query({ status: 'viewed', sort: 'oldest' }); assert.equal(filtered.body.total, 6); assert.ok(filtered.body.applications.every(item => item.status === 'viewed'));
  assert.equal((await request(app).get('/api/applications/job/' + job._id)).status, 401); assert.equal((await request(app).get('/api/applications/job/' + job._id).set('Authorization', auth(outsider))).status, 403);
  for (const query of [{ search: 'x'.repeat(121) }, { status: 'unknown' }, { page: -1 }, { limit: 101 }, { search: { $ne: '' } }]) assert.equal((await request(app).get('/api/applications/job/' + job._id).set('Authorization', auth(owner)).query(query)).status, 400);
});

test('concurrent review changes have one winner and stale or wrong-scope writes cannot replace a newer status', async () => {
  const application = await Application.create({ user_id: candidates[31]._id, company_id: company._id, job_id: job._id }); const id = String(application._id);
  const responses = await Promise.all(['viewed', 'shortlisted'].map(status => request(app).patch('/api/applications/' + id + '/status').set('Authorization', auth(owner)).send({ status, expected_version: 0, job_id: String(job._id), company_id: String(company._id) })));
  assert.equal(responses.filter(response => response.status === 200).length, 1); assert.equal(responses.filter(response => response.status === 409).length, 1);
  const saved = await Application.findById(id); assert.equal(saved.__v, 1); const winner = responses.find(response => response.status === 200); assert.equal(winner.body.application_id, id); assert.equal(winner.body.version, 1); assert.equal(winner.headers['cache-control'], 'no-store');
  assert.equal((await request(app).patch('/api/applications/' + id + '/status').set('Authorization', auth(owner)).send({ status: 'pending', expected_version: 0 })).status, 409);
  assert.equal((await request(app).patch('/api/applications/' + id + '/status').set('Authorization', auth(owner)).send({ status: 'pending', expected_version: 1, job_id: String(otherJob._id) })).status, 409);
  assert.equal((await request(app).patch('/api/applications/' + id + '/status').set('Authorization', auth(outsider)).send({ status: 'hired', expected_version: 1 })).status, 403);
  assert.equal((await Application.findById(id)).status, saved.status);
  assert.equal((await request(app).patch('/api/applications/' + id + '/status').set('Authorization', auth(owner)).send({ status: 'viewed', expected_version: -1 })).status, 400);
});

test('review and pending withdrawal cannot both succeed and legacy application versions migrate safely', async () => {
  const application = await Application.create({ user_id: candidates[32]._id, company_id: company._id, job_id: job._id });
  const [review, withdrawn] = await Promise.all([request(app).patch('/api/applications/' + application._id + '/status').set('Authorization', auth(owner)).send({ status: 'viewed', expected_version: 0 }), request(app).delete('/api/applications/' + application._id + '/withdraw').set('Authorization', auth(candidates[32]))]);
  assert.ok([200, 404, 409].includes(review.status)); assert.ok([200, 400, 404, 409].includes(withdrawn.status)); assert.equal(review.status === 200 && withdrawn.status === 200, false);
  const stored = await Application.findById(application._id); if (review.status === 200) { assert.equal(stored.status, 'viewed'); assert.equal(stored.__v, 1); } else assert.equal(stored, null);
  const legacy = await Application.create({ user_id: candidates[33]._id, company_id: company._id, job_id: job._id }); await Application.updateOne({ _id: legacy._id }, { $unset: { __v: 1 } });
  const changed = await request(app).patch('/api/applications/' + legacy._id + '/status').set('Authorization', auth(owner)).send({ status: 'viewed', expected_version: 0 }); assert.equal(changed.status, 200); assert.equal(changed.body.version, 1);
});

test('missing candidate accounts remain readable and deleted jobs or mismatched company records cannot be reviewed', async () => {
  const isolatedJob = await Job.create({ company_id: company._id, title: 'Archived review', description: 'Description' });
  const application = await Application.create({ user_id: new mongoose.Types.ObjectId(), company_id: company._id, job_id: isolatedJob._id });
  const read = await request(app).get('/api/applications/job/' + isolatedJob._id).set('Authorization', auth(owner)); assert.equal(read.body.applications[0].user_id, null);
  const wrong = await Application.create({ user_id: candidates[34]._id, job_id: isolatedJob._id, company_id: otherCompany._id });
  assert.equal((await request(app).patch('/api/applications/' + wrong._id + '/status').set('Authorization', auth(admin)).send({ status: 'viewed', expected_version: 0 })).status, 409);
  await Job.deleteOne({ _id: isolatedJob._id });
  assert.equal((await request(app).patch('/api/applications/' + application._id + '/status').set('Authorization', auth(owner)).send({ status: 'viewed', expected_version: 0 })).status, 404);
  assert.equal((await Application.findById(application._id)).status, 'pending');
});
