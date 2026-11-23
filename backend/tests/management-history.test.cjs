const { test, before, after } = require('node:test'); const assert = require('node:assert/strict'); const path = require('node:path');
process.env.NODE_ENV = 'test'; process.env.JWT_SECRET = 'isolated-management-history-test-secret-longer-than-32'; process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(__dirname, '../../.cache/mongodb'); process.env.MONGOMS_VERSION = '7.0.24';
const mongoose = require('mongoose'); const { MongoMemoryServer } = require('mongodb-memory-server'); const session = require('express-session'); const request = require('supertest');
const User = require('../models/User'); const Company = require('../models/Company'); const { signToken } = require('../config/jwtConfig');
let database, app, admin, owner, seeker; let sequence = 0;
const createUser = values => User.create({ email: 'history-' + (++sequence) + '@example.com', provider: 'google', is_verified: true, ...values });
const auth = user => 'Bearer ' + signToken(user);
const read = (kind, id, user = admin) => request(app).get('/api/admin/' + (kind === 'account' ? 'users' : 'companies') + '/' + id + '/history').set('Authorization', auth(user));
before(async () => { database = await MongoMemoryServer.create(); assert.notEqual(new URL(database.getUri()).port, '27171'); await mongoose.connect(database.getUri('management_history_fixture')); app = require('../app').createApp({ sessionStore: new session.MemoryStore() }); admin = await createUser({ role: 'admin', name: 'المشرف التجريبي' }); owner = await createUser({ role: 'company' }); seeker = await createUser({ role: 'seeker' }); }, { timeout: 180000 });
after(async () => { await mongoose.disconnect(); await database?.stop(); });
test('history is private to authenticated admins and legacy records honestly start empty', async () => {
  assert.equal((await request(app).get('/api/admin/users/' + seeker._id + '/history')).status, 401);
  for (const actor of [owner, seeker]) assert.equal((await read('account', seeker._id, actor)).status, 403);
  const legacy = await read('account', seeker._id); assert.equal(legacy.status, 200); assert.equal(legacy.headers['cache-control'], 'no-store'); assert.deepEqual(legacy.body.events, []); assert.equal(legacy.body.recorded_total, 0); assert.equal(legacy.body.older_history_available, false);
  assert.equal((await read('account', new mongoose.Types.ObjectId())).status, 404); assert.equal((await read('account', 'invalid')).status, 400);
});
test('account changes atomically retain actor, request and states; conflicts, no-ops and failed writes leave no audit entry', async () => {
  const target = await createUser({ name: 'PRIVATE_TARGET_NAME' });
  const body = { expected_revision: 0, is_active: false, change_history: [{ actor_id: seeker._id }], change_history_total: 999 };
  const responses = await Promise.all([1, 2].map(() => request(app).patch('/api/admin/users/' + target._id + '/access').set('Authorization', auth(admin)).set('X-Request-ID', 'FORGED_ID').send(body)));
  assert.deepEqual(responses.map(item => item.status).sort(), [200, 409]);
  const result = await read('account', target._id); assert.equal(result.body.recorded_total, 1); const event = result.body.events[0];
  assert.equal(event.actor_id, String(admin._id)); assert.equal(event.actor_name, admin.name); assert.equal(event.revision, 1); assert.deepEqual(event.fields, ['is_active']); assert.equal(event.before.is_active, true); assert.equal(event.after.is_active, false); assert.equal(event.request_id, responses.find(item => item.status === 200).headers['x-request-id']); assert.equal(JSON.stringify(event).includes('PRIVATE_TARGET_NAME'), false);
  assert.equal((await request(app).patch('/api/admin/users/' + target._id + '/access').set('Authorization', auth(admin)).send({ expected_revision: 1, is_active: false })).status, 400);
  const update = User.findOneAndUpdate; User.findOneAndUpdate = () => { throw new Error('synthetic storage failure'); };
  try { assert.equal((await request(app).patch('/api/admin/users/' + target._id + '/access').set('Authorization', auth(admin)).send({ expected_revision: 1, is_active: true })).status, 500); }
  finally { User.findOneAndUpdate = update; }
  assert.equal((await read('account', target._id)).body.recorded_total, 1); assert.equal((await User.findById(target._id)).is_active, false);
});
test('company creation, owner edits, verification, linking and archival keep state and history in the same document', async () => {
  const created = await request(app).post('/api/companies').set('Authorization', auth(admin)).send({ name_ar: 'History company', about_ar: 'PRIVATE_COMPANY_DESCRIPTION for audit privacy verification.' });
  assert.equal(created.status, 201); const id = created.body.company_id;
  const linked = await request(app).post('/api/auth/company-account').set('Authorization', auth(admin)).send({ email: 'history-linked@example.com', password: 'SyntheticCompanyPassword123!', full_name: 'Synthetic owner', company_id: id, expected_version: 0 }); assert.equal(linked.status, 201);
  const actor = await User.findById(linked.body.user._id);
  assert.equal((await request(app).put('/api/companies/' + id).set('Authorization', auth(actor)).send({ expected_version: 1, name_en: 'PRIVATE_ENGLISH_NAME' })).status, 200);
  assert.equal((await request(app).patch('/api/companies/' + id + '/verify').set('Authorization', auth(admin)).send({ expected_version: 2, is_verified: true })).status, 200);
  assert.equal((await request(app).delete('/api/companies/' + id).set('Authorization', auth(admin)).send({ expected_version: 3 })).status, 200);
  const result = await read('company', id); assert.equal(result.body.recorded_total, 5); assert.deepEqual(result.body.events.map(item => item.action), ['company.archive', 'company.verify', 'company.update', 'company.link_account', 'company.create']); assert.deepEqual(result.body.events.map(item => item.revision), [4, 3, 2, 1, 0]);
  assert.equal(result.body.events[2].actor_role, 'company'); assert.equal(result.body.events[4].after.is_active, true); assert.equal(result.body.events[3].before.account_linked, false); assert.equal(result.body.events[3].after.account_linked, true); assert.equal(JSON.stringify(result.body).includes('PRIVATE_'), false); assert.equal(JSON.stringify(result.body).includes('SyntheticCompanyPassword123!'), false);
  assert.equal((await read('company', id, actor)).status, 403);
});
test('company concurrent edits have one audit winner and future or stale revisions cannot fabricate before states', async () => {
  const company = await Company.create({ name_ar: 'Concurrent fixture', user_id: owner._id });
  const writes = await Promise.all(['first', 'second'].map(name_en => request(app).put('/api/companies/' + company._id).set('Authorization', auth(admin)).send({ expected_version: 0, name_en })));
  assert.deepEqual(writes.map(item => item.status).sort(), [200, 409]); assert.equal((await read('company', company._id)).body.recorded_total, 1);
  assert.equal((await request(app).put('/api/companies/' + company._id).set('Authorization', auth(admin)).send({ expected_version: 2, name_en: 'future' })).status, 409); assert.equal((await read('company', company._id)).body.recorded_total, 1);
});
test('history never leaks through ordinary user, company, owner, authentication or list responses', async () => {
  const company = await Company.create({ name_ar: 'Public history privacy', user_id: owner._id }); await request(app).put('/api/companies/' + company._id).set('Authorization', auth(admin)).send({ expected_version: 0, name_en: 'Edited' });
  const user = await createUser({}); await request(app).patch('/api/admin/users/' + user._id + '/access').set('Authorization', auth(admin)).send({ expected_revision: 0, is_active: false });
  const responses = [await request(app).get('/api/companies'), await request(app).get('/api/companies/' + company._id), await request(app).get('/api/companies/my').set('Authorization', auth(owner)), await request(app).get('/api/admin/users').set('Authorization', auth(admin)), await request(app).get('/api/auth/me').set('Authorization', auth(admin))];
  for (const response of responses) { assert.equal(response.status, 200); assert.equal(JSON.stringify(response.body).includes('change_history'), false); }
  assert.equal((await Company.findById(company._id).lean()).change_history, undefined); assert.equal((await User.findById(user._id).select('+change_history').then(record => record.toJSON())).change_history, undefined);
});
test('history retains exactly the last 100 events, preserves its total and tolerates renamed or deleted actors', async () => {
  const company = await Company.create({ name_ar: 'Retention fixture' }); const actor = await createUser({ role: 'admin', name: 'Original name' });
  const { append, entry, companyState } = require('../services/managementHistory');
  for (let revision = 1; revision <= 103; revision++) await Company.updateOne({ _id: company._id }, append({ $inc: { __v: 1 } }, entry({ user: { id: String(actor._id), role: 'admin' } }, 'company.update', revision, ['name_en'], companyState(company), companyState(company))));
  await User.updateOne({ _id: actor._id }, { $set: { name: 'Current name' } }); const result = await read('company', company._id); assert.equal(result.body.recorded_total, 103); assert.equal(result.body.events.length, 100); assert.equal(result.body.events[0].revision, 103); assert.equal(result.body.events[99].revision, 4); assert.equal(result.body.events[0].actor_name, 'Current name');
  await User.deleteOne({ _id: actor._id }); const deleted = await read('company', company._id); assert.equal(deleted.body.events[0].actor_name, null); assert.equal(deleted.body.events[0].actor_id, String(actor._id));
});
