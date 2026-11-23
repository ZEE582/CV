const { test, before, after } = require('node:test'); const assert = require('node:assert/strict'); const path = require('node:path'); const { randomUUID } = require('node:crypto');
process.env.NODE_ENV = 'test'; process.env.JWT_SECRET = 'a-local-test-secret-that-is-at-least-32-characters-long'; process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(__dirname, '../../.cache/mongodb'); process.env.MONGOMS_VERSION = '7.0.24';
const mongoose = require('mongoose'); const { MongoMemoryServer } = require('mongodb-memory-server'); const session = require('express-session'); const request = require('supertest');
const User = require('../models/User'); const Company = require('../models/Company'); const Message = require('../models/ContactMessage'); const { signToken } = require('../config/jwtConfig'); const { schemas } = require('../middleware/validate');
let database, app, admin, owner, outsider, company, otherCompany; const auth = user => 'Bearer ' + signToken(user);
before(async () => {
  database = await MongoMemoryServer.create(); await mongoose.connect(database.getUri()); app = require('../app').createApp({ sessionStore: new session.MemoryStore() }); await Message.init();
  [admin, owner, outsider] = await Promise.all(['admin', 'company', 'company'].map((role, index) => User.create({ email: 'message-manager-' + index + '@example.com', password: 'FixturePassword123!', role })));
  company = await Company.create({ name_ar: 'Message company', user_id: owner._id }); otherCompany = await Company.create({ name_ar: 'Other company', user_id: outsider._id });
}, { timeout: 180000 });
after(async () => { await mongoose.disconnect(); await database?.stop(); });
const payload = () => ({ company_id: String(company._id), sender_name: '  Fixture sender  ', sender_email: ' SENDER@EXAMPLE.COM ', sender_phone: ' ', subject: ' ', message: '  This is a synthetic message for testing only.  ', client_request_id: randomUUID() });

test('public sends acknowledge storage and retries including concurrent attempts save one message without exposing retry metadata', async () => {
  const data = payload(); const responses = await Promise.all([request(app).post('/api/messages').send(data), request(app).post('/api/messages').send(data)]);
  assert.ok(responses.every(response => response.status === 201), JSON.stringify(responses.map(response => response.body))); assert.equal(responses[0].body.message_id, responses[1].body.message_id); assert.equal(await Message.countDocuments({ company_id: company._id }), 1);
  const replay = await request(app).post('/api/messages').send(data); assert.equal(replay.status, 201); assert.equal(replay.body.replayed, true); assert.equal(replay.body.company_id, String(company._id));
  const changed = await request(app).post('/api/messages').send({ ...data, message: 'A different valid message' }); assert.equal(changed.status, 409); assert.equal(await Message.countDocuments({ company_id: company._id }), 1);
  const stored = await Message.findById(replay.body.message_id); assert.equal(stored.sender_name, 'Fixture sender'); assert.equal(stored.sender_email, 'sender@example.com'); assert.equal(stored.subject, 'استفسار');
  const inbox = await request(app).get('/api/messages/company/' + company._id).set('Authorization', auth(owner)); assert.equal(inbox.status, 200); assert.equal(inbox.headers['cache-control'], 'no-store');
  for (const key of ['client_request_id', 'payload_fingerprint']) assert.equal(inbox.body.messages[0][key], undefined);
});

test('contact boundaries and inactive companies reject sends without creating records', async () => {
  const inactive = await Company.create({ name_ar: 'Inactive fixture', is_active: false });
  const response = await request(app).post('/api/messages').send({ ...payload(), company_id: String(inactive._id) }); assert.equal(response.status, 404); assert.equal(await Message.countDocuments({ company_id: inactive._id }), 0);
  const base = payload();
  for (const bad of [{ sender_name: ' ' }, { sender_email: 'no-email' }, { sender_phone: 'x'.repeat(41) }, { subject: 'x'.repeat(201) }, { message: 'short' }, { message: 'x'.repeat(5001) }, { client_request_id: 'invalid' }]) assert.ok(schemas.message.validate({ ...base, ...bad }).error);
  const invalid = await request(app).post('/api/messages').send({ ...base, message: 'x'.repeat(5001) }); assert.equal(invalid.status, 400);
});

test('inbox search is literal, pagination is stable and clamped, counts are company scoped, and ownership applies', async () => {
  await Message.insertMany(Array.from({ length: 25 }, (_, index) => ({ company_id: company._id, sender_name: index === 0 ? 'Sender [C++]' : 'Sender ' + index, sender_email: 'sender' + index + '@example.com', subject: 'Test subject', message: 'Synthetic inbox body', is_read: index % 2 === 0, createdAt: new Date('2026-10-30T10:00:00Z') })));
  await Message.create({ company_id: otherCompany._id, sender_name: 'Private sender', sender_email: 'other@example.com', message: 'Other private message' });
  const get = query => request(app).get('/api/messages/company/' + company._id).set('Authorization', auth(owner)).query(query);
  const first = await get({ page: 1, limit: 12 }); const second = await get({ page: 2, limit: 12 }); assert.equal(first.body.total, 26); assert.equal(first.body.counts.read, 13); assert.equal(first.body.counts.unread, 13); assert.equal(first.body.pages, 3);
  assert.ok(first.body.messages.every(item => item.company_id === String(company._id))); assert.equal(second.body.messages.some(item => first.body.messages.some(other => other._id === item._id)), false);
  assert.equal((await get({ page: 100, limit: 12 })).body.page, 3);
  for (const [search, count] of [['[C++]', 1], ['.*', 0], ['sender1@', 1]]) assert.equal((await get({ search })).body.total, count);
  const read = await get({ is_read: 'true', sort: 'oldest' }); assert.equal(read.body.total, 13); assert.ok(read.body.messages.every(item => item.is_read));
  assert.equal((await request(app).get('/api/messages/company/' + company._id)).status, 401); assert.equal((await request(app).get('/api/messages/company/' + company._id).set('Authorization', auth(outsider))).status, 403);
  assert.equal((await request(app).get('/api/messages/company/' + new mongoose.Types.ObjectId()).set('Authorization', auth(admin))).status, 404);
  for (const query of [{ search: 'x'.repeat(121) }, { is_read: 'yes' }, { page: -1 }, { limit: 101 }, { search: { $ne: '' } }]) assert.equal((await get(query)).status, 400);
});

test('explicit read and unread updates protect newer versions, selected scope and owner including legacy records', async () => {
  const message = await Message.create({ company_id: company._id, sender_name: 'Fixture', sender_email: 'fixture@example.com', message: 'Synthetic review message' });
  const patch = body => request(app).patch('/api/messages/' + message._id + '/read').set('Authorization', auth(owner)).send(body);
  const simultaneous = await Promise.all([patch({ is_read: true, expected_version: 0 }), patch({ is_read: false, expected_version: 0 })]); assert.equal(simultaneous.filter(response => response.status === 200).length, 1); assert.equal(simultaneous.filter(response => response.status === 409).length, 1);
  assert.equal((await patch({ is_read: true, expected_version: 0 })).status, 409); assert.equal((await patch({ is_read: false, expected_version: 1, company_id: String(otherCompany._id) })).status, 409);
  assert.equal((await request(app).patch('/api/messages/' + message._id + '/read').set('Authorization', auth(outsider)).send({ is_read: true, expected_version: 1 })).status, 403);
  const unread = await patch({ is_read: false, expected_version: 1, company_id: String(company._id) }); assert.equal(unread.status, 200); assert.equal(unread.body.is_read, false); assert.equal(unread.body.version, 2); assert.equal(unread.body.message_id, String(message._id)); assert.equal(unread.headers['cache-control'], 'no-store');
  await Message.updateOne({ _id: message._id }, { $unset: { __v: 1 } }); const legacy = await patch({ is_read: true, expected_version: 0 }); assert.equal(legacy.status, 200); assert.equal(legacy.body.version, 1);
  assert.equal((await patch({})).status, 200); assert.equal((await patch({})).status, 200);
  for (const body of [{ is_read: 'false' }, { expected_version: -1 }]) assert.equal((await patch(body)).status, 400);
});
