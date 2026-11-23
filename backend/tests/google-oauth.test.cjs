const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'google-oauth-isolated-test-secret-at-least-32-characters';
process.env.GOOGLE_CLIENT_ID = 'fixture-client.apps.googleusercontent.com';
process.env.GOOGLE_CLIENT_SECRET = 'fixture-only-not-a-real-client-secret';
process.env.GOOGLE_CALLBACK_URL = 'http://127.0.0.1:5173/api/auth/google/callback';
process.env.CLIENT_URL = 'http://127.0.0.1:5173';
process.env.EMAIL_USER = 'fixture@example.com'; process.env.EMAIL_PASS = 'fixture-only';
process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(__dirname, '../../.cache/mongodb'); process.env.MONGOMS_VERSION = '7.0.24';
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const session = require('express-session');
const request = require('supertest');
const User = require('../models/User');
const Challenge = require('../models/VerificationChallenge');
const transporter = require('../modules/auth/services/email/transporter');
const { findOrCreateGoogleUser } = require('../modules/auth/services/googleAccounts');
let database, app, nextProfile, tokens = 0, mailFailure = false;
const codes = new Map();
const profile = (id, email, extra = {}) => ({ id, displayName: 'Google fixture', emails: [{ value: email, verified: true }], photos: [{ value: 'https://example.com/avatar.png' }], ...extra });
before(async () => {
  database = await MongoMemoryServer.create(); await mongoose.connect(database.getUri()); await User.init();
  transporter.sendMail = async mail => { if (mailFailure) throw Error('PRIVATE_SMTP_FAILURE'); codes.set(mail.to, mail.html.match(/\b(\d{5})\b/)[1]); return { messageId: 'stub' }; };
  app = require('../app').createApp({ sessionStore: new session.MemoryStore() });
  const strategy = require('passport')._strategy('google');
  strategy._oauth2.getOAuthAccessToken = (_code, _params, done) => { tokens++; done(null, 'fixture-access', 'fixture-refresh', {}); };
  strategy.userProfile = (_access, done) => done(null, structuredClone(nextProfile));
}, { timeout: 180000 });
after(async () => { await mongoose.disconnect(); await database?.stop(); });
async function start(agent, from) {
  const response = await agent.get('/api/auth/google').query(from ? { from } : {});
  assert.equal(response.status, 302);
  const destination = new URL(response.headers.location);
  assert.equal(destination.hostname, 'accounts.google.com');
  return { state: destination.searchParams.get('state'), destination };
}
async function callback(agent, state, identity) {
  nextProfile = identity;
  return agent.get('/api/auth/google/callback').query({ state, code: 'fixture-authorization-code' });
}

test('Google start binds random state to its browser and requests only profile and email scopes', async () => {
  const agent = request.agent(app); const first = await start(agent, '/jobs?q=React'); const second = await start(agent);
  assert.ok(first.state && first.state !== second.state);
  assert.equal(first.destination.searchParams.get('redirect_uri'), process.env.GOOGLE_CALLBACK_URL);
  assert.deepEqual(first.destination.searchParams.get('scope').split(' ').sort(), ['email', 'profile']);
  assert.equal(first.destination.searchParams.get('prompt'), 'select_account');
  assert.equal(await User.countDocuments(), 0);
});

test('missing, wrong-browser and replayed state fail before profile or token exchange', async () => {
  const agent = request.agent(app); const { state } = await start(agent); const beforeTokens = tokens;
  for (const target of [request(app), agent]) {
    const response = await target.get('/api/auth/google/callback').query({ state: target === agent ? 'wrong-state' : state, code: 'fixture' });
    assert.equal(new URL(response.headers.location).searchParams.get('error'), 'google');
  }
  assert.equal(tokens, beforeTokens); assert.equal(await User.countDocuments(), 0);
});

test('new Google registrations are seekers and require the browser-bound platform OTP before receiving a token', async () => {
  const agent = request.agent(app); const { state } = await start(agent, '/jobs?q=React#results');
  const response = await callback(agent, state, profile('google-new', 'new-google@example.com', { role: 'admin', score: 999 }));
  const destination = new URL(response.headers.location);
  assert.equal(destination.pathname, '/verify-email'); assert.equal(destination.searchParams.get('from'), '/jobs?q=React#results');
  assert.equal(destination.searchParams.has('token'), false); assert.equal(response.headers['cache-control'], 'no-store');
  const user = await User.findOne({ email: 'new-google@example.com' }).select('+googleId');
  assert.equal(user.provider, 'google'); assert.equal(user.role, 'seeker'); assert.equal(user.score, 0); assert.equal(user.googleId, 'google-new'); assert.equal(user.isVerified, false);
  const body = { email: user.email, code: codes.get(user.email) };
  assert.equal((await request(app).post('/api/auth/verify-code').send(body)).status, 400);
  const verified = await agent.post('/api/auth/verify-code').send(body);
  assert.equal(verified.status, 200); assert.ok(verified.body.token); assert.equal(verified.body.user.googleId, undefined);
  const mailCount = codes.size; const replay = await callback(agent, state, profile('google-new', user.email));
  assert.equal(new URL(replay.headers.location).searchParams.get('error'), 'google'); assert.equal(codes.size, mailCount);
});

test('Google may continue an existing local account only through its email OTP without overwriting provider, password or role', async () => {
  const local = await User.create({ email: 'local-google@example.com', password: 'FixturePassword123!', name: 'Original', role: 'seeker' });
  const before = await User.findById(local._id).select('+password +googleId');
  const agent = request.agent(app); const { state } = await start(agent);
  const response = await callback(agent, state, profile('other-google', local.email));
  assert.equal(new URL(response.headers.location).pathname, '/verify-email');
  const after = await User.findById(local._id).select('+password +googleId');
  assert.equal(after.provider, 'local'); assert.equal(after.password, before.password); assert.equal(after.googleId, undefined); assert.equal(after.name, 'Original');
  assert.equal((await agent.post('/api/auth/verify-code').send({ email: local.email, code: codes.get(local.email) })).status, 200);
});

test('unverified emails and malformed Google subjects cannot create accounts or email challenges', async () => {
  const beforeUsers = await User.countDocuments(); const beforeChallenges = await Challenge.countDocuments();
  for (const identity of [profile('unverified', 'unverified@example.com', { emails: [{ value: 'unverified@example.com', verified: false }] }), profile('', 'empty-sub@example.com'), profile('bad subject', 'bad-sub@example.com'), profile('missing-email', '', { emails: [] })]) {
    const agent = request.agent(app); const { state } = await start(agent); const response = await callback(agent, state, identity);
    assert.equal(new URL(response.headers.location).searchParams.get('error'), 'google');
  }
  assert.equal(await User.countDocuments(), beforeUsers); assert.equal(await Challenge.countDocuments(), beforeChallenges);
});

test('inactive accounts, conflicting Google subjects and changed emails do not pass into OTP issuance', async () => {
  await User.create({ email: 'blocked-google@example.com', provider: 'google', googleId: 'blocked-sub', is_active: false });
  await User.create({ email: 'bound-google@example.com', provider: 'google', googleId: 'bound-sub' });
  const beforeMail = codes.size;
  for (const identity of [profile('blocked-sub', 'blocked-google@example.com'), profile('wrong-sub', 'bound-google@example.com'), profile('bound-sub', 'changed-google@example.com')]) {
    const agent = request.agent(app); const { state } = await start(agent); const response = await callback(agent, state, identity);
    assert.equal(new URL(response.headers.location).searchParams.get('error'), 'google');
  }
  assert.equal(codes.size, beforeMail);
});

test('Google creation races reuse the same unprivileged account without duplicate emails', async () => {
  const identity = profile('racing-sub', 'race-google@example.com');
  const rows = await Promise.all([findOrCreateGoogleUser(identity), findOrCreateGoogleUser(identity)]);
  assert.equal(String(rows[0]._id), String(rows[1]._id)); assert.equal(await User.countDocuments({ email: identity.emails[0].value }), 1);
});

test('unsafe return paths are discarded and provider errors never become arbitrary redirects or expose raw details', async () => {
  for (const from of ['https://evil.example', '//evil.example', '/\\evil.example', '/logout', '/login', '/jobs\nsecret']) {
    const agent = request.agent(app); const { state } = await start(agent, from);
    const response = await agent.get('/api/auth/google/callback').query({ state, error: 'access_denied', error_description: 'PRIVATE_PROVIDER_RESPONSE' });
    const destination = new URL(response.headers.location);
    assert.equal(destination.origin, process.env.CLIENT_URL); assert.equal(destination.pathname, '/login'); assert.equal(destination.searchParams.has('from'), false);
    assert.equal(response.headers.location.includes('PRIVATE_'), false);
  }
});

test('SMTP failure returns a generic retry path and leaves no usable email challenge', async () => {
  const agent = request.agent(app); const { state } = await start(agent, '/cv'); mailFailure = true;
  try {
    const response = await callback(agent, state, profile('mail-failure-sub', 'mail-failure-google@example.com'));
    const destination = new URL(response.headers.location);
    assert.equal(destination.searchParams.get('error'), 'email'); assert.equal(destination.searchParams.get('from'), '/cv');
    assert.equal(await Challenge.countDocuments({ email: 'mail-failure-google@example.com' }), 0);
  } finally { mailFailure = false; }
});

test('Google stays unavailable without its real server configuration', async () => {
  const secret = process.env.GOOGLE_CLIENT_SECRET; delete process.env.GOOGLE_CLIENT_SECRET;
  try { assert.equal((await request(app).get('/api/auth/providers')).body.google, false); assert.equal((await request(app).get('/api/auth/google')).status, 503); }
  finally { process.env.GOOGLE_CLIENT_SECRET = secret; }
});
