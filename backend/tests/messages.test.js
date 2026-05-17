/**
 * @file tests/messages.test.js
 * @description اختبارات E2E لمسارات الرسائل
 */
const request = require('supertest');
const app     = require('../server');
const { connectTestDB, clearDB, disconnectTestDB, createTestCompany } = require('./helpers/testSetup');

let company;

beforeAll(async () => { await connectTestDB(); });
afterAll(async () => { await disconnectTestDB(); });

beforeEach(async () => {
  await clearDB();
  company = await createTestCompany();
});

describe('POST /api/messages', () => {
  const msgData = {
    sender_name: 'أحمد محمد',
    sender_email: 'ahmed@example.com',
    subject: 'استفسار عن وظيفة',
    message: 'مرحباً، أرغب في الاستفسار عن الوظائف المتاحة في شركتكم'
  };

  it('يرسل رسالة بنجاح لشركة موجودة', async () => {
    const res = await request(app)
      .post('/api/messages')
      .send({ ...msgData, company_id: company._id });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('يرفض الإرسال لشركة غير موجودة', async () => {
    const res = await request(app)
      .post('/api/messages')
      .send({ ...msgData, company_id: '000000000000000000000000' });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('COMPANY_NOT_FOUND');
  });

  it('يرفض بدون company_id', async () => {
    const res = await request(app).post('/api/messages').send(msgData);
    expect(res.status).toBe(400);
  });

  it('يرفض الرسالة القصيرة جداً', async () => {
    const res = await request(app)
      .post('/api/messages')
      .send({ ...msgData, company_id: company._id, message: 'قصير' });
    expect(res.status).toBe(400);
  });

  it('يرفض إيميل غير صالح', async () => {
    const res = await request(app)
      .post('/api/messages')
      .send({ ...msgData, company_id: company._id, sender_email: 'not-an-email' });
    expect(res.status).toBe(400);
  });
});
