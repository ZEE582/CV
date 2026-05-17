/**
 * @file tests/auth.test.js
 * @description اختبارات E2E لمسارات المصادقة
 */
const request = require('supertest');
const app     = require('../server');
const { connectTestDB, clearDB, disconnectTestDB, createTestUser } = require('./helpers/testSetup');

beforeAll(async () => { await connectTestDB(); });
afterAll(async () => { await disconnectTestDB(); });
beforeEach(async () => { await clearDB(); });

describe('POST /api/auth/register', () => {
  it('ينجح التسجيل ببيانات صحيحة', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'new@test.com',
      password: 'password123',
      full_name: 'مستخدم جديد'
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('new@test.com');
  });

  it('يرفض التسجيل بإيميل مكرر', async () => {
    await createTestUser({ email: 'dup@test.com' });
    const res = await request(app).post('/api/auth/register').send({
      email: 'dup@test.com',
      password: 'password123',
      full_name: 'مستخدم مكرر'
    });
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('يرفض التسجيل بكلمة مرور قصيرة', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'short@test.com',
      password: '123',
      full_name: 'اختبار'
    });
    expect(res.status).toBe(400);
  });

  it('يرفض التسجيل بدون بريد إلكتروني', async () => {
    const res = await request(app).post('/api/auth/register').send({
      password: 'password123',
      full_name: 'اختبار'
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await createTestUser({ email: 'login@test.com' });
  });

  it('ينجح تسجيل الدخول ببيانات صحيحة', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@test.com',
      password: 'password123'
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  it('يرفض كلمة مرور خاطئة', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@test.com',
      password: 'wrongpass'
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('يرفض إيميل غير موجود', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'notfound@test.com',
      password: 'password123'
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('يعيد بيانات المستخدم بتوكن صالح', async () => {
    const loginRes = await request(app).post('/api/auth/register').send({
      email: 'me@test.com',
      password: 'password123',
      full_name: 'أنا'
    });
    const token = loginRes.body.token;

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('me@test.com');
  });

  it('يرفض الوصول بدون توكن', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('يرفض توكن غير صالح', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
  });
});
