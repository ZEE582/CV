const { test, before, after } = require('node:test'); const assert = require('node:assert/strict'); const path = require('node:path');
process.env.NODE_ENV = 'test'; process.env.JWT_SECRET = 'a-local-test-secret-that-is-at-least-32-characters-long';
process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(__dirname, '../../.cache/mongodb'); process.env.MONGOMS_VERSION = '7.0.24';
const mongoose = require('mongoose'); const { MongoMemoryServer } = require('mongodb-memory-server'); const session = require('express-session'); const request = require('supertest');
const Company = require('../models/Company'); const Job = require('../models/Job'); const User = require('../models/User'); const { signToken } = require('../config/jwtConfig');
let database, app;
before(async () => { database = await MongoMemoryServer.create(); await mongoose.connect(database.getUri()); app = require('../app').createApp({ sessionStore: new session.MemoryStore() }); }, { timeout: 180000 });
after(async () => { await mongoose.disconnect(); await database?.stop(); });

test('job search covers all records and company names literally, combines filters and paginates deterministically', async () => {
  const company = await Company.create({ name_ar: 'شركة بحث [C++]', name_en: 'Acme (Lab)' });
  await Job.insertMany(Array.from({ length: 205 }, (_, index) => ({ company_id: company._id, title: 'Vacancy ' + index, description: 'Description', field: index % 2 ? 'مالية وبنوك' : 'تكنولوجيا', region: 'ضفة', job_type: 'دوام كامل', experience_level: 'حديث التخرج', location: 'Nablus' })));
  const found = await request(app).get('/api/jobs').query({ search: 'Vacancy 204', availability: 'open' }); assert.equal(found.status, 200); assert.equal(found.body.total, 1);
  const first = await request(app).get('/api/jobs').query({ search: 'شركة بحث [C++]', limit: 12, page: 1 });
  const second = await request(app).get('/api/jobs').query({ search: 'Acme (Lab)', limit: 12, page: 2 });
  assert.equal(first.body.total, 205); assert.equal(second.body.total, 205); assert.equal(first.body.pages, 18); assert.equal(second.body.jobs.length, 12);
  assert.equal(first.body.jobs.some(job => second.body.jobs.some(other => other._id === job._id)), false);
  const last = await request(app).get('/api/jobs').query({ search: 'Acme (Lab)', limit: 12, page: 9999 }); assert.equal(last.body.page, 18); assert.equal(last.body.jobs.length, 1);
  const combined = await request(app).get('/api/jobs').query({ search: 'Nablus', field: 'تكنولوجيا', region: 'ضفة', type: 'دوام كامل', exp: 'حديث التخرج' }); assert.equal(combined.body.total, 103);
  for (const query of [{ search: '.*' }, { search: '((((' }]) { const reply = await request(app).get('/api/jobs').query(query); assert.equal(reply.status, 200); assert.equal(reply.body.total, 0); }
  for (const query of [{ search: 'x'.repeat(121) }, { page: -1 }, { page: '2x' }, { limit: 201 }, { sort: 'unexpected' }, { search: { $ne: '' } }]) assert.equal((await request(app).get('/api/jobs').query(query)).status, 400, JSON.stringify(query));
});

test('public job reads honor deadlines and active companies and conceal hidden salaries while owners retain management access', async () => {
  const owner = await User.create({ email: 'jobs-owner@example.com', password: 'FixturePassword123!', role: 'company' });
  const active = await Company.create({ name_ar: 'Visibility', user_id: owner._id }); const inactive = await Company.create({ name_ar: 'Visibility inactive', is_active: false });
  const base = { title: 'Visibility role', description: 'Description', company_id: active._id };
  const [open, expired, hidden, disabled, orphan] = await Job.create([
    { ...base, deadline: new Date(Date.now() + 3600000) }, { ...base, deadline: new Date(Date.now() - 3600000) },
    { ...base, salary_visible: false, salary_min: 9000, salary_max: 12000 }, { ...base, company_id: inactive._id }, { ...base, company_id: new mongoose.Types.ObjectId() },
  ]);
  const onlyOpen = await request(app).get('/api/jobs').query({ search: 'Visibility role', availability: 'open' }); assert.equal(onlyOpen.body.total, 2); assert.ok(!onlyOpen.body.jobs.some(job => job._id === String(expired._id)));
  const all = await request(app).get('/api/jobs').query({ search: 'Visibility role', availability: 'all' }); assert.equal(all.body.total, 3);
  const salary = all.body.jobs.find(job => job._id === String(hidden._id)); assert.equal(salary.salary_min, null); assert.equal(salary.salary_max, null);
  const detail = await request(app).get('/api/jobs/' + hidden._id); assert.equal(detail.status, 200); assert.equal(detail.body.job.salary_max, null);
  const company = await request(app).get('/api/companies/' + active._id); assert.equal(company.body.jobs.find(job => job._id === String(hidden._id)).salary_min, null);
  for (const job of [disabled, orphan]) assert.equal((await request(app).get('/api/jobs/' + job._id)).status, 404);
  const manage = await request(app).get('/api/jobs/manage').set('Authorization', 'Bearer ' + signToken(owner)); assert.equal(manage.body.jobs.find(job => job._id === String(hidden._id)).salary_max, 12000);
  assert.equal((await request(app).get('/api/jobs/' + open._id)).status, 200);
});

test('salary sorting uses visible amounts and a single currency including minimum-only amounts', async () => {
  const company = await Company.create({ name_ar: 'Salary sorting' }); const base = { company_id: company._id, title: 'Salary check', description: 'Description', salary_currency: '₪' };
  const [low, minimum, high, usd] = await Job.create([{ ...base, salary_max: 4000 }, { ...base, salary_min: 5000 }, { ...base, salary_max: 8000 }, { ...base, salary_currency: '$', salary_max: 99999 }, { ...base, salary_visible: false, salary_max: 999999 }]);
  const result = await request(app).get('/api/jobs').query({ search: 'Salary check', sort: 'salary', currency: '₪' }); assert.equal(result.status, 200, JSON.stringify(result.body)); assert.deepEqual(result.body.jobs.map(job => job._id), [high, minimum, low].map(job => String(job._id)));
  const dollars = await request(app).get('/api/jobs').query({ search: 'Salary check', sort: 'salary', currency: '$' }); assert.deepEqual(dollars.body.jobs.map(job => job._id), [String(usd._id)]);
});
