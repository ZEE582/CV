const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'a-local-test-secret-that-is-at-least-32-characters-long';
process.env.EMAIL_USER = 'test@example.com';
process.env.EMAIL_PASS = 'local-smtp-stub';
process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(__dirname, '../../.cache/mongodb');
process.env.MONGOMS_VERSION = '7.0.24';
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const session = require('express-session');
const request = require('supertest');
const transporter = require('../modules/auth/services/email/transporter');
const User = require('../models/User');
const { signToken } = require('../config/jwtConfig');
const codes = new Map();
transporter.sendMail = async mail => { const match = mail.html.match(/\b(\d{5})\b/); assert.ok(match); codes.set(mail.to, match[1]); return { messageId: 'local-stub' }; };
let database, app;
before(async () => {
  database = await MongoMemoryServer.create();
  await mongoose.connect(database.getUri());
  app = require('../app').createApp({ sessionStore: new session.MemoryStore() });
}, { timeout: 180000 });
after(async () => { await mongoose.disconnect(); await database?.stop(); });
function auth(user) { return 'Bearer ' + signToken(user); }

test('profile edits merge fields, synchronize names and avatars, and reject unsafe inputs', async () => {
  const user = await User.create({ email: 'profile-editor@example.com', password: 'FixturePassword123!', name: 'Original', onboardingData: { fullName: 'Original', city: 'Nablus', university: 'University', programmingLanguages: ['Python'] } });
  const other = await User.create({ email: 'other-profile@example.com', password: 'FixturePassword123!', name: 'Other name' });
  const authorization = auth(user);
  const saved = await request(app).put('/api/user/profile').set('Authorization', authorization).send({ name: '  الاسم الجديد  ', avatar: 'https://example.com/avatar.png', phone: ' 0590000000 ', onboardingData: { age: 29 }, role: 'admin', score: 9999, email: 'changed@example.com', hasCompletedQuestions: true, token_version: 20 });
  assert.equal(saved.status, 200, JSON.stringify(saved.body));
  assert.equal(saved.headers['cache-control'], 'no-store');
  assert.equal(saved.body.user.name, 'الاسم الجديد'); assert.equal(saved.body.user.onboardingData.fullName, 'الاسم الجديد');
  assert.equal(saved.body.user.onboardingData.city, 'Nablus'); assert.equal(saved.body.user.onboardingData.university, 'University');
  assert.deepEqual(saved.body.user.onboardingData.programmingLanguages, ['Python']);
  assert.equal(saved.body.user.avatar_url, saved.body.user.avatar); assert.equal(saved.body.user.phone, '0590000000');
  assert.equal(saved.body.user.role, 'seeker'); assert.equal(saved.body.user.score, 0); assert.equal(saved.body.user.email, user.email); assert.equal(saved.body.user.hasCompletedQuestions, false);
  for (const key of ['password', 'password_hash', 'token_version']) assert.equal(saved.body.user[key], undefined);
  for (const body of [{ name: ' ' }, { role: 'admin' }, { onboardingData: {} }, { onboardingData: { age: -1 } }, { onboardingData: { age: 151 } }, { onboardingData: { age: 2.5 } }, { onboardingData: { programmingLanguages: [{}] } }, { onboardingData: { programmingLanguages: ['Python', 'Python'] } }, { onboardingData: { lookingForJob: 'false' } }, { avatar: 'javascript:alert(1)' }]) {
    assert.equal((await request(app).put('/api/user/profile').set('Authorization', authorization).send(body)).status, 400, JSON.stringify(body));
  }
  const cleared = await request(app).put('/api/user/profile').set('Authorization', authorization).send({ avatar: '', phone: '', onboardingData: { fullName: 'Nested name', age: null, programmingLanguages: [] } });
  assert.equal(cleared.status, 200); assert.equal(cleared.body.user.name, 'Nested name'); assert.equal(cleared.body.user.avatar_url, '');
  assert.equal(cleared.body.user.onboardingData.age, null); assert.equal(cleared.body.user.onboardingData.city, 'Nablus');
  const fetched = await request(app).get('/api/user/profile').set('Authorization', authorization);
  assert.equal(fetched.body.user.name, 'Nested name'); assert.equal(fetched.headers['cache-control'], 'no-store');
  assert.equal((await User.findById(other._id)).name, 'Other name');
});

test('onboarding validates age and field types before marking the account complete', async () => {
  const user = await User.create({ email: 'onboarding-check@example.com', password: 'FixturePassword123!' });
  const body = { fullName: '  Completed name ', age: '25', city: 'City', university: 'University', major: 'CS', programmingLanguages: ['Python'], jobTitle: 'Developer', experienceYears: '1-2', lookingForJob: false, jobInterest: 'Backend' };
  for (const patch of [{ age: '-4' }, { age: null }, { programmingLanguages: [{}] }, { fullName: ' ' }, { lookingForJob: 'false' }]) {
    assert.equal((await request(app).post('/api/user/questions').set('Authorization', auth(user)).send({ ...body, ...patch })).status, 400);
  }
  assert.equal((await User.findById(user._id)).hasCompletedQuestions, false);
  const saved = await request(app).post('/api/user/questions').set('Authorization', auth(user)).send({ ...body, role: 'admin' });
  assert.equal(saved.status, 200, JSON.stringify(saved.body)); assert.equal(saved.body.user.hasCompletedQuestions, true);
  assert.equal(saved.body.user.onboardingData.age, 25); assert.equal(saved.body.user.name, 'Completed name');
  assert.equal(saved.body.user.onboardingData.fullName, saved.body.user.name); assert.equal(saved.body.user.role, 'seeker');
});

test('password changes preserve the current session, revoke previous tokens and pending OTPs, and require the new password', async () => {
  const user = await User.create({ email: 'password-change@example.com', password: 'FixturePassword123!' });
  const oldToken = auth(user);
  const jwt = require('jsonwebtoken');
  const legacyToken = 'Bearer ' + jwt.sign({ id: String(user._id), role: user.role }, process.env.JWT_SECRET, { issuer: 'ttwar', audience: 'ttwar-web', expiresIn: '1h' });
  assert.equal((await request(app).get('/api/auth/me').set('Authorization', legacyToken)).status, 200);
  const agent = request.agent(app);
  assert.equal((await agent.post('/api/auth/login').send({ email: user.email, password: 'FixturePassword123!' })).status, 200);
  const pendingCode = codes.get(user.email);
  const invalid = await request(app).put('/api/auth/change-password').set('Authorization', oldToken).send({ current_password: 'WrongPassword', new_password: 'NewPassword456!' });
  assert.equal(invalid.status, 401);
  for (const new_password of ['short', '        ', 'FixturePassword123!', 'أ'.repeat(40)]) {
    assert.equal((await request(app).put('/api/auth/change-password').set('Authorization', oldToken).send({ current_password: 'FixturePassword123!', new_password })).status, 400);
  }
  const changed = await request(app).put('/api/auth/change-password').set('Authorization', oldToken).send({ current_password: 'FixturePassword123!', new_password: 'NewPassword456!', role: 'admin' });
  assert.equal(changed.status, 200, JSON.stringify(changed.body)); assert.ok(changed.body.token); assert.equal(changed.headers['cache-control'], 'no-store');
  for (const key of ['password', 'password_hash', 'token_version']) assert.equal(changed.body.user[key], undefined);
  assert.equal(changed.body.user.role, 'seeker');
  for (const token of [oldToken, legacyToken]) {
    const denied = await request(app).get('/api/auth/me').set('Authorization', token);
    assert.equal(denied.status, 401); assert.equal(denied.body.code, 'SESSION_REVOKED');
    assert.equal((await request(app).get('/api/user/profile').set('Authorization', token)).status, 401);
  }
  assert.equal((await request(app).get('/api/auth/me').set('Authorization', 'Bearer ' + changed.body.token)).status, 200);
  assert.equal((await agent.post('/api/auth/verify-code').send({ email: user.email, code: pendingCode })).status, 401);
  assert.equal((await agent.post('/api/auth/login').send({ email: user.email, password: 'FixturePassword123!' })).status, 401);
  assert.equal((await agent.post('/api/auth/login').send({ email: user.email, password: 'NewPassword456!' })).status, 200);
  const verified = await agent.post('/api/auth/verify-code').send({ email: user.email, code: codes.get(user.email) });
  assert.equal(verified.status, 200); assert.equal((await request(app).get('/api/auth/me').set('Authorization', 'Bearer ' + verified.body.token)).status, 200);
  const stored = await User.findById(user._id).select('+password');
  assert.equal(stored.token_version, 1); assert.notEqual(stored.password, 'NewPassword456!'); assert.equal(await stored.matchPassword('NewPassword456!'), true);
});

test('concurrent password changes cannot both overwrite a legacy password hash', async () => {
  const bcrypt = require('bcryptjs');
  const user = await User.create({ email: 'legacy-password@example.com', password_hash: await bcrypt.hash('LegacyPassword123!', 4) });
  await User.updateOne({ _id: user._id }, { $unset: { token_version: 1 } });
  const authorization = auth(user);
  const passwords = ['ConcurrentPasswordA!', 'ConcurrentPasswordB!'];
  const results = await Promise.all(passwords.map(new_password => request(app).put('/api/auth/change-password').set('Authorization', authorization).send({ current_password: 'LegacyPassword123!', new_password })));
  assert.equal(results.filter(result => result.status === 200).length, 1);
  assert.ok(results.every(result => [200, 401, 409].includes(result.status)), JSON.stringify(results.map(result => result.status)));
  const winner = results.findIndex(result => result.status === 200);
  const stored = await User.findById(user._id).select('+password +password_hash');
  assert.equal(stored.token_version, 1); assert.equal(stored.password_hash, undefined); assert.equal(await stored.matchPassword(passwords[winner]), true);
  assert.equal((await request(app).get('/api/auth/me').set('Authorization', 'Bearer ' + results[winner].body.token)).status, 200);
});

test('OAuth accounts cannot change a local password and password attempts are rate limited per account', async () => {
  const oauth = await User.create({ email: 'oauth-password@example.com', provider: 'google' });
  assert.equal((await request(app).put('/api/auth/change-password').set('Authorization', auth(oauth)).send({ current_password: 'anything', new_password: 'NewPassword123!' })).status, 403);
  const user = await User.create({ email: 'password-limit@example.com', password: 'FixturePassword123!' });
  const authorization = auth(user);
  for (let i = 0; i < 10; i++) assert.equal((await request(app).put('/api/auth/change-password').set('Authorization', authorization).send({ current_password: 'wrong', new_password: 'NewPassword123!' })).status, 401);
  assert.equal((await request(app).put('/api/auth/change-password').set('Authorization', authorization).send({ current_password: 'FixturePassword123!', new_password: 'NewPassword123!' })).status, 429);
  assert.equal((await User.findById(user._id).select('+password')).token_version, 0);
});


test('onboarding permits beginners without academic records or languages and persists only their own allowed data', async () => {
  const user = await User.create({ email: 'onboarding-beginner@example.com', password: 'FixturePassword123!' });
  const result = await request(app).post('/api/user/questions').set('Authorization', auth(user)).send({ fullName: ' Beginner ', age: 22, city: 'Nablus', jobTitle: 'Student', experienceYears: 'Less than one year', lookingForJob: false, jobInterest: 'Web', role: 'admin', score: 9999 });
  assert.equal(result.status, 200, JSON.stringify(result.body));
  assert.equal(result.body.user.hasCompletedQuestions, true); assert.equal(result.body.user.role, 'seeker'); assert.equal(result.body.user.score, 0);
  assert.equal(result.body.user.onboardingData.university, ''); assert.equal(result.body.user.onboardingData.major, ''); assert.deepEqual(result.body.user.onboardingData.programmingLanguages, []);
  const stored = await User.findById(user._id); assert.equal(stored.name, 'Beginner'); assert.equal(stored.onboardingData.lookingForJob, false);
});


test('custom programming languages round-trip through onboarding and profile without changing another account', async () => {
  const user = await User.create({ email: 'custom-languages@example.com', password: 'FixturePassword123!' });
  const other = await User.create({ email: 'custom-languages-other@example.com', password: 'FixturePassword123!', onboardingData: { programmingLanguages: ['Rust'] } });
  const authorization = auth(user);
  const onboarding = await request(app).post('/api/user/questions').set('Authorization', authorization).send({ fullName: 'Custom languages', age: 25, city: 'Nablus', jobTitle: 'Developer', experienceYears: '1-2', jobInterest: 'Web', programmingLanguages: ['Elixir', 'C++', 'C#'] });
  assert.equal(onboarding.status, 200, JSON.stringify(onboarding.body)); assert.deepEqual(onboarding.body.user.onboardingData.programmingLanguages, ['Elixir', 'C++', 'C#']);
  const saved = await request(app).put('/api/user/profile').set('Authorization', authorization).send({ onboardingData: { programmingLanguages: ['Elixir', 'لغة تجريبية'] } });
  assert.equal(saved.status, 200, JSON.stringify(saved.body));
  const read = await request(app).get('/api/user/profile').set('Authorization', authorization);
  assert.deepEqual(read.body.user.onboardingData.programmingLanguages, ['Elixir', 'لغة تجريبية']);
  for (const list of [['x'.repeat(81)], Array.from({ length: 51 }, (_, index) => 'Language-' + index)]) assert.equal((await request(app).put('/api/user/profile').set('Authorization', authorization).send({ onboardingData: { programmingLanguages: list } })).status, 400);
  assert.deepEqual((await User.findById(user._id)).onboardingData.programmingLanguages, ['Elixir', 'لغة تجريبية']);
  assert.deepEqual((await User.findById(other._id)).onboardingData.programmingLanguages, ['Rust']);
});
