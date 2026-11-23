require('dotenv').config({ path: require('node:path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const validator = require('validator');
const connectDB = require('../config/db');
const User = require('../models/User');
async function createAdmin() {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  if (!validator.isEmail(email) || password.length < 12) throw new Error('Set ADMIN_EMAIL and a unique ADMIN_PASSWORD of at least 12 characters.');
  await connectDB();
  if (await User.exists({ email })) throw new Error('This email already exists; no account was changed.');
  await User.create({ email, password, name: 'مدير المنصة', role: 'admin', isVerified: true, is_verified: true });
  console.log('Administrator created. No password was logged.');
}
createAdmin().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
