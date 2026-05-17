/**
 * @file tests/jobs.test.js
 * @description اختبارات E2E لمسارات الوظائف
 */
const request = require('supertest');
const app     = require('../server');
const bcrypt  = require('bcryptjs');
const User    = require('../models/User');
const { connectTestDB, clearDB, disconnectTestDB, createTestCompany, createTestJob } = require('./helpers/testSetup');

let adminToken, companyUser, company, job;

beforeAll(async () => { await connectTestDB(); });
afterAll(async () => { await disconnectTestDB(); });

beforeEach(async () => {
  await clearDB();

  // إنشاء Admin
  const admin = await User.create({
    email: 'admin@test.com',
    password_hash: bcrypt.hashSync('admin123', 10),
    full_name: 'أدمن',
    role: 'admin'
  });
  const adminLogin = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'admin123' });
  adminToken = adminLogin.body.token;

  // إنشاء مستخدم شركة
  companyUser = await User.create({
    email: 'company@test.com',
    password_hash: bcrypt.hashSync('company123', 10),
    full_name: 'مدير شركة',
    role: 'company'
  });

  company = await createTestCompany({ user_id: companyUser._id });
  job     = await createTestJob(company._id);
});

describe('GET /api/jobs', () => {
  it('يعيد قائمة الوظائف بنجاح', async () => {
    const res = await request(app).get('/api/jobs');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.jobs)).toBe(true);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
  });

  it('يفلتر الوظائف حسب المجال', async () => {
    const res = await request(app).get('/api/jobs?field=تكنولوجيا');
    expect(res.status).toBe(200);
    res.body.jobs.forEach(j => expect(j.field).toBe('تكنولوجيا'));
  });

  it('يدعم البحث النصي', async () => {
    const res = await request(app).get('/api/jobs?search=Frontend');
    expect(res.status).toBe(200);
    expect(res.body.jobs.length).toBeGreaterThanOrEqual(1);
  });

  it('يدعم الصفحات', async () => {
    const res = await request(app).get('/api/jobs?page=1&limit=1');
    expect(res.status).toBe(200);
    expect(res.body.jobs.length).toBeLessThanOrEqual(1);
  });
});

describe('GET /api/jobs/:id', () => {
  it('يعيد تفاصيل وظيفة موجودة', async () => {
    const res = await request(app).get(`/api/jobs/${job._id}`);
    expect(res.status).toBe(200);
    expect(res.body.job._id.toString()).toBe(job._id.toString());
  });

  it('يعيد 404 لوظيفة غير موجودة', async () => {
    const fakeId = '000000000000000000000000';
    const res = await request(app).get(`/api/jobs/${fakeId}`);
    expect(res.status).toBe(404);
  });
});

describe('POST /api/jobs', () => {
  const jobData = {
    title: 'وظيفة اختبار جديدة',
    description: 'وصف مفصل للوظيفة للاختبار يجب أن يكون 20 حرف على الأقل',
    field: 'تكنولوجيا',
    job_type: 'دوام كامل',
    experience_level: '1-3 سنوات',
    region: 'ضفة'
  };

  it('الأدمن يستطيع نشر وظيفة', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...jobData, company_id: company._id });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('يرفض النشر بدون توكن', async () => {
    const res = await request(app).post('/api/jobs').send(jobData);
    expect(res.status).toBe(401);
  });

  it('يرفض النشر بدون عنوان', async () => {
    const { title, ...withoutTitle } = jobData;
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...withoutTitle, company_id: company._id });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/jobs/:id', () => {
  it('الأدمن يستطيع حذف وظيفة', async () => {
    const res = await request(app)
      .delete(`/api/jobs/${job._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('يرفض الحذف بدون توكن', async () => {
    const res = await request(app).delete(`/api/jobs/${job._id}`);
    expect(res.status).toBe(401);
  });
});
