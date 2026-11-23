const { test, before, after } = require('node:test'); const assert = require('node:assert/strict'); const path = require('node:path');
process.env.NODE_ENV = 'test'; process.env.JWT_SECRET = 'isolated-management-history-feed-test-secret-longer-than-32'; process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(__dirname, '../../.cache/mongodb'); process.env.MONGOMS_VERSION = '7.0.24';
const mongoose = require('mongoose'); const { MongoMemoryServer } = require('mongodb-memory-server'); const session = require('express-session'); const request = require('supertest');
const User = require('../models/User'); const Company = require('../models/Company'); const { signToken } = require('../config/jwtConfig'); const { entry, append, companyState } = require('../services/managementHistory');
let server, app, admin, owner, seeker, target, company;
const auth = user => 'Bearer ' + signToken(user); const get = (query = {}, actor = admin) => request(app).get('/api/admin/history').set('Authorization', auth(actor)).query(query);
before(async () => {
 server = await MongoMemoryServer.create(); assert.notEqual(new URL(server.getUri()).port, '27171'); await mongoose.connect(server.getUri('management_history_feed_fixture')); app = require('../app').createApp({ sessionStore: new session.MemoryStore() });
 [admin, owner, seeker, target] = await User.create([{ role: 'admin', name: 'Actor admin', email: 'actor-admin@example.com', provider: 'google' }, { role: 'company', name: 'Actor owner', email: 'actor-owner@example.com', provider: 'google' }, { role: 'seeker', email: 'seeker@example.com', provider: 'google' }, { role: 'seeker', name: 'Literal [C++]', email: 'PRIVATE_EMAIL@example.com', provider: 'google' }]);
 company = await Company.create({ name_ar: 'Timeline company', user_id: owner._id, email: 'PRIVATE_COMPANY@example.com', about_ar: 'PRIVATE_DESCRIPTION' });
 for (let revision = 1; revision <= 25; revision++) {
  const accountEvent = { ...entry({ user: { id: String(admin._id), role: 'admin' } }, 'account.access', revision, ['is_active'], { role: 'seeker', is_active: true }, { role: 'seeker', is_active: false }), at: new Date('2026-11-19T12:00:00Z') };
  await User.updateOne({ _id: target._id }, append({ $inc: { admin_revision: 1 } }, accountEvent));
 }
 const companyEvent = { ...entry({ user: { id: String(owner._id), role: 'company' } }, 'company.update', 1, ['email'], companyState(company), companyState(company)), at: new Date('2026-11-20T00:00:00Z') }; await Company.updateOne({ _id: company._id }, append({ $inc: { __v: 1 } }, companyEvent));
}, { timeout: 180000 });
after(async () => { await mongoose.disconnect(); await server?.stop(); });
test('unified history is admin-only and returns bounded retained results without private target values', async () => {
 assert.equal((await request(app).get('/api/admin/history')).status, 401); for (const actor of [owner, seeker]) assert.equal((await get({}, actor)).status, 403);
 const result = await get(); assert.equal(result.status, 200, JSON.stringify(result.body)); assert.equal(result.headers['cache-control'], 'no-store'); assert.equal(result.body.total, 26); assert.equal(result.body.items.length, 20); assert.equal(result.body.pages, 2); assert.equal(result.body.items[0].kind, 'company'); assert.equal(result.body.retained_limit_per_target, 100); assert.equal(result.body.older_history_available, false); assert.equal(JSON.stringify(result.body).includes('PRIVATE_'), false); assert.equal(JSON.stringify(result.body).includes('token_version'), false);
});
test('pagination has stable tie-breaking and out-of-range pages explicitly return no results', async () => {
 const first = await get({ limit: 10 }); const second = await get({ limit: 10, page: 2 }); const third = await get({ limit: 10, page: 3 }); const key = item => item.kind + ':' + item.target_id + ':' + item.event.revision;
 assert.equal(new Set([...first.body.items, ...second.body.items, ...third.body.items].map(key)).size, 26); assert.deepEqual(first.body.items.slice(1).map(item => item.event.revision), [25, 24, 23, 22, 21, 20, 19, 18, 17]);
 const outside = await get({ page: 999 }); assert.equal(outside.body.out_of_range, true); assert.equal(outside.body.page, 999); assert.equal(outside.body.pages, 2); assert.deepEqual(outside.body.items, []);
});
test('kind, literal current-name search, action, actor and target filters compose without leaking other records', async () => {
 assert.equal((await get({ kind: 'account', search: '[C++]', action: 'account.access', actor_id: String(admin._id), target_id: String(target._id) })).body.total, 25);
 assert.equal((await get({ search: '.*' })).body.total, 0); assert.equal((await get({ search: 'PRIVATE_EMAIL' })).body.total, 0);
 const companies = await get({ kind: 'company', actor_id: String(owner._id), action: 'company.update' }); assert.equal(companies.body.total, 1); assert.equal(companies.body.items[0].event.actor_name, 'Actor owner'); assert.equal((await get({ kind: 'company', target_id: String(target._id) })).body.total, 0);
});
test('UTC day filters include both day endpoints and reject reversed, invalid or impossible dates', async () => {
 assert.equal((await get({ from: '2026-11-19', to: '2026-11-19' })).body.total, 25); assert.equal((await get({ from: '2026-11-20', to: '2026-11-20' })).body.total, 1); assert.equal((await get({ from: '2026-11-19', to: '2026-11-20' })).body.total, 26);
 for (const query of [{ from: '2026-02-29' }, { to: '2026-13-01' }, { from: '2026-11-20', to: '2026-11-19' }, { from: '2026-11-19T00:00:00Z' }, { from: '1800-01-01' }]) assert.equal((await get(query)).status, 400);
});
test('invalid kinds, actions, identifiers, pagination and filter combinations are refused', async () => {
 for (const query of [{ kind: 'secret' }, { action: 'account.delete' }, { kind: 'account', action: 'company.update' }, { actor_id: 'invalid' }, { target_id: { $ne: '' } }, { page: 0 }, { page: 1.2 }, { limit: 51 }, { search: 'x'.repeat(121) }]) assert.equal((await get(query)).status, 400, JSON.stringify(query));
});
test('database deadline failures return a safe retry response and retained reads never create history', async () => {
 const before = await User.findById(target._id).select({ change_history_total: 1 }).lean(); const aggregate = User.aggregate;
 User.aggregate = () => ({ option: async () => { const error = new Error('PRIVATE_DATABASE_DIAGNOSTIC'); error.code = 50; throw error; } });
 try { const result = await get(); assert.equal(result.status, 503); assert.equal(JSON.stringify(result.body).includes('PRIVATE'), false); }
 finally { User.aggregate = aggregate; }
 await get(); const after = await User.findById(target._id).select({ change_history_total: 1 }).lean(); assert.equal(after.change_history_total, before.change_history_total);
});
