/**
 * @file tests/health.test.js
 */
const request = require('supertest');
const app     = require('../server');
const { connectTestDB, disconnectTestDB } = require('./helpers/testSetup');

beforeAll(async () => { await connectTestDB(); });
afterAll(async () => { await disconnectTestDB(); });

describe('GET /api/health', () => {
  it('يعيد حالة الخادم', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('healthy');
    expect(res.body.version).toBe('2.0.0');
  });
});

describe('404 handler', () => {
  it('يعيد 404 لمسار غير موجود', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('ROUTE_NOT_FOUND');
  });
});
