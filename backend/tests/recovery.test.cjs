const { test, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'a-local-test-secret-that-is-at-least-32-characters-long';
process.env.EMAIL_USER = 'test@example.com'; process.env.EMAIL_PASS = 'local-smtp-stub';
process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(__dirname, '../../.cache/mongodb'); process.env.MONGOMS_VERSION = '7.0.24';
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const session = require('express-session');
const request = require('supertest');
const transporter = require('../modules/auth/services/email/transporter');
const User = require('../models/User');
const Reset = require('../models/PasswordResetChallenge');
const { signToken } = require('../config/jwtConfig');
const { createHmac } = require('node:crypto');
const codes = new Map(); const loginCodes = new Map();
transporter.sendMail = async mail => {
  const recovery = mail.subject.includes('استعادة');
  const code = mail.html.match(recovery ? /\b(\d{6})\b/ : /\b(\d{5})\b/);
  assert.ok(code); (recovery ? codes : loginCodes).set(mail.to, code[1]); return { messageId: 'stub-only' };
};
let database, app;
before(async () => { database = await MongoMemoryServer.create(); await mongoose.connect(database.getUri()); await Reset.init(); }, { timeout: 180000 });
// Each app instance owns fresh rate limit counters, exactly as at server startup.
beforeEach(() => { app = require('../app').createApp({ sessionStore: new session.MemoryStore() }); });
after(async () => { await mongoose.disconnect(); await database?.stop(); });
const auth = user => 'Bearer ' + signToken(user);
const resetId = email => createHmac('sha256', process.env.JWT_SECRET).update('password-reset:' + email).digest('hex');
async function fixture(name, extra = {}) { return User.create({ email: name + '@example.com', password: 'OriginalPassword123!', ...extra }); }
async function start(user) {
  const agent = request.agent(app);
  const result = await agent.post('/api/auth/forgot-password').send({ email: user.email });
  assert.equal(result.status, 202, JSON.stringify(result.body));
  return { agent, result, code: codes.get(user.email) };
}
const reset = (agent, email, code, password = 'RecoveredPassword456!') => agent.post('/api/auth/reset-password').send({ email, code, new_password: password });

test('recovery requests conceal nonexistent, OAuth and inactive accounts and never return codes', async () => {
  const local = await fixture('recovery-visible');
  const oauth = await fixture('recovery-oauth', { provider: 'google' });
  const inactive = await fixture('recovery-inactive', { is_active: false });
  const results = [];
  for (const email of [local.email, 'recovery-missing@example.com', oauth.email, inactive.email]) {
    const agent = request.agent(app);
    const result = await agent.post('/api/auth/forgot-password').send({ email }); results.push(result);
    assert.equal(result.status, 202); assert.equal(result.headers['cache-control'], 'no-store');
    assert.match(result.headers['set-cookie'][0], /ttwar_password_reset=.*HttpOnly/);
    assert.match(result.headers['set-cookie'][0], /SameSite=Lax/);
    assert.equal(result.body.code, undefined); assert.equal(result.body.token, undefined);
    assert.equal((await agent.post('/api/auth/forgot-password').send({ email })).status, 429);
  }
  results.forEach(result => assert.deepEqual(result.body, results[0].body));
  assert.ok(codes.get(local.email)); assert.equal(codes.has(oauth.email), false); assert.equal(codes.has(inactive.email), false);
  const stored = await Reset.findById(resetId(local.email)).select('+codeHash +nonceHash').lean();
  assert.notEqual(stored.codeHash, codes.get(local.email)); assert.match(stored.codeHash, /^[a-f0-9]{64}$/); assert.match(stored.nonceHash, /^[a-f0-9]{64}$/);
  assert.equal(JSON.stringify(stored).includes(local.email), false);
});

test('valid recovery replaces the password, revokes tokens and pending login codes, and requires a fresh login', async () => {
  const user = await fixture('recovery-flow'); const oldToken = auth(user);
  const login = request.agent(app);
  assert.equal((await login.post('/api/auth/login').send({ email: user.email, password: 'OriginalPassword123!' })).status, 200);
  const oldLoginCode = loginCodes.get(user.email);
  const { agent, code } = await start(user);
  const result = await reset(agent, user.email, code);
  assert.equal(result.status, 200, JSON.stringify(result.body)); assert.equal(result.body.token, undefined); assert.equal(result.body.user, undefined);
  assert.equal(result.headers['cache-control'], 'no-store'); assert.ok(result.headers['set-cookie'].every(cookie => cookie.includes('Expires=Thu, 01 Jan 1970')));
  assert.equal((await reset(agent, user.email, code)).status, 400);
  assert.equal((await request(app).get('/api/auth/me').set('Authorization', oldToken)).body.code, 'SESSION_REVOKED');
  assert.equal((await login.post('/api/auth/verify-code').send({ email: user.email, code: oldLoginCode })).status, 401);
  assert.equal((await login.post('/api/auth/login').send({ email: user.email, password: 'OriginalPassword123!' })).status, 401);
  assert.equal((await login.post('/api/auth/login').send({ email: user.email, password: 'RecoveredPassword456!' })).status, 200);
  const verified = await login.post('/api/auth/verify-code').send({ email: user.email, code: loginCodes.get(user.email) });
  assert.equal(verified.status, 200); assert.equal((await request(app).get('/api/auth/me').set('Authorization', 'Bearer ' + verified.body.token)).status, 200);
  const stored = await User.findById(user._id).select('+password +password_hash');
  assert.equal(stored.token_version, 1); assert.equal(await stored.matchPassword('RecoveredPassword456!'), true); assert.equal(stored.role, 'seeker');
});

test('recovery is bound to its browser and email and stops after five incorrect guesses', async () => {
  const user = await fixture('recovery-bound'); const { agent, code } = await start(user);
  assert.equal((await reset(request(app), user.email, code)).status, 400);
  assert.equal((await reset(agent, 'somebody-else@example.com', code)).status, 400);
  assert.equal((await agent.post('/api/auth/verify-code').send({ email: user.email, code })).status, 400);
  const wrong = code === '111111' ? '222222' : '111111';
  for (let i = 0; i < 5; i++) assert.equal((await reset(agent, user.email, wrong)).status, 400);
  assert.equal((await reset(agent, user.email, code)).status, 400);
  assert.equal((await User.findById(user._id)).token_version, 0);
});

test('expired codes fail before TTL cleanup; resending cancels the old browser and code', async () => {
  const user = await fixture('recovery-expired'); const first = await start(user);
  await Reset.updateOne({ _id: resetId(user.email) }, { $set: { expiresAt: new Date(Date.now() - 1000), lastSentAt: new Date(Date.now() - 61000) } });
  assert.equal((await reset(first.agent, user.email, first.code)).status, 400);
  const second = await start(user);
  assert.equal((await reset(first.agent, user.email, second.code)).status, 400);
  // The nonce changes even in the unlikely event the new six-digit value is identical.
  assert.notEqual(first.result.headers['set-cookie'][0], second.result.headers['set-cookie'][0]);
  assert.equal((await reset(second.agent, user.email, second.code)).status, 200);
});

test('only one concurrent reset may consume a code and legacy password hashes migrate', async () => {
  const bcrypt = require('bcryptjs');
  const user = await fixture('recovery-concurrent', { password: undefined, password_hash: await bcrypt.hash('OriginalPassword123!', 4) });
  await User.updateOne({ _id: user._id }, { $unset: { token_version: 1 } });
  const { agent, code } = await start(user);
  const passwords = ['RecoveredPasswordA!', 'RecoveredPasswordB!'];
  const results = await Promise.all(passwords.map(password => reset(agent, user.email, code, password)));
  assert.deepEqual(results.map(result => result.status).sort(), [200, 400]);
  const userAfter = await User.findById(user._id).select('+password +password_hash');
  assert.equal(userAfter.password_hash, undefined); assert.equal(userAfter.token_version, 1);
  assert.equal(await userAfter.matchPassword(passwords[results.findIndex(result => result.status === 200)]), true);
});

test('password changes, account deactivation and input errors prevent pending recovery', async () => {
  const user = await fixture('recovery-stale'); const { agent, code } = await start(user);
  for (const new_password of ['short', '        ', 'أ'.repeat(40)]) {
    assert.equal((await reset(agent, user.email, code, new_password)).status, 400);
  }
  assert.equal((await Reset.findById(resetId(user.email))).attempts, 0);
  assert.equal((await request(app).put('/api/auth/change-password').set('Authorization', auth(user)).send({ current_password: 'OriginalPassword123!', new_password: 'ChangedPassword987!' })).status, 200);
  assert.equal((await reset(agent, user.email, code)).status, 400);
  assert.equal(await (await User.findById(user._id).select('+password')).matchPassword('ChangedPassword987!'), true);
  const inactive = await fixture('recovery-disabled-later'); const pending = await start(inactive);
  await User.updateOne({ _id: inactive._id }, { $set: { is_active: false } });
  assert.equal((await reset(pending.agent, inactive.email, pending.code)).status, 400);
});

test('missing SMTP gives the same unavailable response for known and unknown addresses', async () => {
  const user = await fixture('recovery-no-smtp');
  const previous = process.env.EMAIL_PASS; delete process.env.EMAIL_PASS;
  try {
    const known = await request(app).post('/api/auth/forgot-password').send({ email: user.email });
    const missing = await request(app).post('/api/auth/forgot-password').send({ email: 'no-smtp-missing@example.com' });
    assert.equal(known.status, 503); assert.equal(missing.status, 503); assert.deepEqual(known.body, missing.body);
    assert.equal(await Reset.findById(resetId(user.email)), null);
  } finally { process.env.EMAIL_PASS = previous; }
});

test('recovery requests are limited per IP, including unknown accounts', async () => {
  for (let i = 0; i < 10; i++) assert.equal((await request(app).post('/api/auth/forgot-password').send({ email: `rate-missing-${i}@example.com` })).status, 202);
  const denied = await request(app).post('/api/auth/forgot-password').send({ email: 'rate-final@example.com' });
  assert.equal(denied.status, 429); assert.match(denied.body.message, /طلبات استعادة كثيرة/);
});


test('SMTP delivery failures keep generic responses and cooldowns without changing credentials', async () => {
  const user = await fixture('recovery-smtp-failure');
  const original = transporter.sendMail;
  transporter.sendMail = async () => { throw new Error('Simulated SMTP outage'); };
  try {
    const known = await request(app).post('/api/auth/forgot-password').send({ email: user.email });
    const unknown = await request(app).post('/api/auth/forgot-password').send({ email: 'recovery-smtp-missing@example.com' });
    assert.equal(known.status, 202); assert.equal(unknown.status, 202); assert.deepEqual(known.body, unknown.body);
    let pending;
    for (let attempt = 0; attempt < 80; attempt++) {
      pending = await Reset.findById(resetId(user.email));
      if (pending?.user_id === null) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.equal(pending.user_id, null);
    for (const email of [user.email, 'recovery-smtp-missing@example.com']) assert.equal((await request(app).post('/api/auth/forgot-password').send({ email })).status, 429);
    const stored = await User.findById(user._id).select('+password');
    assert.equal(stored.token_version, 0); assert.equal(await stored.matchPassword('OriginalPassword123!'), true);
  } finally { transporter.sendMail = original; }
});
