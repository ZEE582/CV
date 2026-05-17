/**
 * @file tests/helpers/testSetup.js
 * @description إعداد قاعدة بيانات الاختبار
 */
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('../../models/User');
const Company  = require('../../models/Company');
const Job      = require('../../models/Job');

const TEST_DB = process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/waseem_foras_test';

async function connectTestDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB);
  }
}

async function clearDB() {
  await Promise.all([
    User.deleteMany({}),
    Company.deleteMany({}),
    Job.deleteMany({})
  ]);
}

async function disconnectTestDB() {
  await mongoose.disconnect();
}

async function createTestUser(overrides = {}) {
  const defaults = {
    email: 'test@example.com',
    password_hash: bcrypt.hashSync('password123', 10),
    full_name: 'مستخدم اختبار',
    role: 'seeker'
  };
  return User.create({ ...defaults, ...overrides });
}

async function createTestCompany(overrides = {}) {
  const defaults = {
    name_ar: 'شركة الاختبار',
    name_en: 'Test Company',
    sector: 'تكنولوجيا',
    location: 'رام الله',
    region: 'ضفة',
    about_ar: 'شركة تكنولوجيا للاختبار فقط',
    is_active: true,
    is_verified: true,
    color: '#1a7a4a'
  };
  return Company.create({ ...defaults, ...overrides });
}

async function createTestJob(companyId, overrides = {}) {
  const defaults = {
    company_id: companyId,
    title: 'مطور Frontend',
    description: 'وصف الوظيفة للاختبار — React و TypeScript وأساسيات البرمجة',
    field: 'تكنولوجيا',
    job_type: 'دوام كامل',
    experience_level: '1-3 سنوات',
    region: 'ضفة',
    is_active: true
  };
  return Job.create({ ...defaults, ...overrides });
}

module.exports = { connectTestDB, clearDB, disconnectTestDB, createTestUser, createTestCompany, createTestJob };
