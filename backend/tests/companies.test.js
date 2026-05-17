/**
 * @file tests/companies.test.js
 * @description اختبارات E2E لمسارات الشركات
 */
const request = require('supertest');
const app     = require('../server');
const bcrypt  = require('bcryptjs');
const User    = require('../models/User');
const { connectTestDB, clearDB, disconnectTestDB, createTestCompany, createTestJob } = require('./helpers/testSetup');

let adminToken, company;

beforeAll(async () => { await connectTestDB(); });
afterAll(async () => { await disconnectTestDB(); });

beforeEach(async () => {
  await clearDB();

  const admin = await User.create({
    email: 'admin@test.com',
    password_hash: bcrypt.hashSync('admin123', 10),
    full_name: 'أدمن',
    role: 'admin'
  });
  const loginRes = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'admin123' });
  adminToken = loginRes.body.token;

  company = await createTestCompany();
  await createTestJob(company._id);
});

describe('GET /api/companies', () => {
  it('يعيد قائمة الشركات', async () => {
    const res = await request(app).get('/api/companies');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.companies)).toBe(true);
    expect(res.body.companies.length).toBeGreaterThanOrEqual(1);
  });

  it('يعيد jobs_count لكل شركة', async () => {
    const res = await request(app).get('/api/companies');
    expect(res.body.companies[0]).toHaveProperty('jobs_count');
    expect(typeof res.body.companies[0].jobs_count).toBe('number');
  });

  it('يفلتر حسب المنطقة', async () => {
    const res = await request(app).get('/api/companies?region=ضفة');
    expect(res.status).toBe(200);
    res.body.companies.forEach(c => expect(c.region).toBe('ضفة'));
  });

  it('يدعم البحث', async () => {
    const res = await request(app).get('/api/companies?search=اختبار');
    expect(res.status).toBe(200);
  });
});

describe('GET /api/companies/:id', () => {
  it('يعيد تفاصيل شركة مع وظائفها', async () => {
    const res = await request(app).get(`/api/companies/${company._id}`);
    expect(res.status).toBe(200);
    expect(res.body.company._id.toString()).toBe(company._id.toString());
    expect(Array.isArray(res.body.jobs)).toBe(true);
  });

  it('يعيد 404 لشركة غير موجودة', async () => {
    const res = await request(app).get('/api/companies/000000000000000000000000');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('COMPANY_NOT_FOUND');
  });
});

describe('POST /api/companies', () => {
  const companyData = {
    name_ar: 'شركة جديدة للاختبار',
    name_en: 'New Test Company',
    sector: 'تكنولوجيا',
    location: 'رام الله',
    region: 'ضفة',
    about_ar: 'نبذة عن الشركة الجديدة للاختبار فقط'
  };

  it('الأدمن يستطيع إضافة شركة', async () => {
    const res = await request(app)
      .post('/api/companies')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(companyData);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('يرفض الإضافة بدون توكن', async () => {
    const res = await request(app).post('/api/companies').send(companyData);
    expect(res.status).toBe(401);
  });

  it('يرفض بدون اسم الشركة', async () => {
    const { name_ar, ...withoutName } = companyData;
    const res = await request(app)
      .post('/api/companies')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(withoutName);
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/companies/:id', () => {
  it('الأدمن يحذف الشركة ووظائفها', async () => {
    const res = await request(app)
      .delete(`/api/companies/${company._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('يرفض الحذف بدون توكن', async () => {
    const res = await request(app).delete(`/api/companies/${company._id}`);
    expect(res.status).toBe(401);
  });
});
