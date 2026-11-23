require('dotenv').config({ path: require('node:path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('./db');
const Company = require('../models/Company');
const source = require('../data/company-data.json');
async function seed() {
  if (process.env.NODE_ENV === 'production') throw new Error('Run sample data import only against a development database.');
  await connectDB();
  let created = 0;
  for (const item of source.companies) {
    const stacks = {};
    for (const [category, values] of Object.entries(item.tech_stack || {})) {
      stacks[category] = values.map(value => typeof value === 'string' ? { name: value } : value);
    }
    const result = await Company.updateOne({ name_ar: item.company_name }, { $setOnInsert: { name_ar: item.company_name, name_en: item.company_name, location: item.city, website: item.website || '', logo_url: item.company_logo ? '/' + item.company_logo.replace(/^\//, '') : '', sector: 'تكنولوجيا', about_ar: 'شركة تقنية ضمن دليل شركات المنصة.', stacks } }, { upsert: true });
    created += result.upsertedCount;
  }
  console.log('Company import complete; added ' + created + '. Existing data was preserved.');
}
if (require.main === module) seed().catch(() => { console.error('Import failed. Check the local database configuration.'); process.exitCode = 1; }).finally(() => mongoose.disconnect());
module.exports = { seed };
