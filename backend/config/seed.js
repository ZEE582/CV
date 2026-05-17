/**
 * seed.js — يضيف 43 شركة تقنية فلسطينية + وظائف نموذجية
 * الاستخدام: node config/seed.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const path     = require('path');
const Company  = require('../models/Company');
const Job      = require('../models/Job');
const User     = require('../models/User');

const COMPANIES = require('./companies.json'); // ← 43 شركة فلسطينية

const JOBS = [
  { title:'مطور Frontend — React',       desc:'بناء واجهات مستخدم احترافية باستخدام React وTypeScript ضمن فريق Agile.',         reqs:['React','TypeScript','Tailwind','Git'],            type:'دوام كامل', exp:'1-3 سنوات',  min:3000, max:5000, feat:true  },
  { title:'مطور Backend — Node.js',      desc:'تطوير REST APIs وخدمات مصغرة باستخدام Node.js وMongoDB.',                       reqs:['Node.js','MongoDB','Express','REST APIs'],        type:'دوام كامل', exp:'1-3 سنوات',  min:3500, max:6000 },
  { title:'مطور Full Stack',             desc:'تطوير تطبيقات ويب متكاملة باستخدام React وNode.js.',                             reqs:['React','Node.js','MongoDB','Git'],                type:'دوام كامل', exp:'3-5 سنوات',  min:5000, max:8000, feat:true  },
  { title:'مهندس DevOps',               desc:'إدارة البنية التحتية السحابية وأتمتة عمليات النشر.',                              reqs:['AWS','Docker','Kubernetes','CI/CD'],              type:'دوام كامل', exp:'3-5 سنوات',  min:6000, max:10000},
  { title:'مطور Mobile — React Native', desc:'تطوير تطبيقات موبايل متعددة المنصات وإصدارها على المتاجر.',                      reqs:['React Native','JavaScript','iOS/Android'],        type:'دوام كامل', exp:'1-3 سنوات',  min:3500, max:6000 },
  { title:'مهندسة برمجيات',             desc:'تطوير وصيانة حلول برمجية متكاملة مع فريق متعدد التخصصات.',                       reqs:['Java أو Python','SQL','Git','Agile'],             type:'دوام كامل', exp:'حديث التخرج',min:2500, max:4000 },
  { title:'محلل بيانات',               desc:'تحليل البيانات وبناء لوحات تحكم باستخدام Python وSQL.',                           reqs:['Python','SQL','Power BI','Excel'],                type:'دوام كامل', exp:'1-3 سنوات',  min:4000, max:7000 },
  { title:'مهندس QA',                  desc:'ضمان جودة البرمجيات عبر اختبارات يدوية وآلية.',                                  reqs:['Selenium','JIRA','SQL','Postman'],                type:'دوام كامل', exp:'1-3 سنوات',  min:2800, max:5000 },
  { title:'مصمم UI/UX',               desc:'تصميم تجارب مستخدم احترافية باستخدام Figma.',                                    reqs:['Figma','User Research','Prototyping'],            type:'دوام كامل', exp:'1-3 سنوات',  min:3000, max:5500 },
  { title:'مطور Laravel PHP',          desc:'بناء تطبيقات ويب باستخدام Laravel وMysql.',                                      reqs:['Laravel','PHP','MySQL','REST APIs'],              type:'دوام كامل', exp:'1-3 سنوات',  min:3000, max:5000 },
  { title:'متدرب برمجة — مدفوع',       desc:'فرصة تدريب مدفوع لحديثي التخرج لتعلم تطوير البرمجيات.',                           reqs:['أساسيات البرمجة','HTML/CSS','Git'],              type:'تدريب مدفوع',exp:'حديث التخرج',min:1000, max:2000 },
  { title:'مطور Angular',              desc:'تطوير واجهات مستخدم باستخدام Angular وTypeScript.',                               reqs:['Angular','TypeScript','RxJS','REST APIs'],        type:'دوام كامل', exp:'3-5 سنوات',  min:5000, max:8000 },
];

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ttwar');
    console.log('✅ Connected');

    await Promise.all([Company.deleteMany(), Job.deleteMany(), User.deleteMany({ role: { $ne: 'admin' } })]);
    console.log('🗑️  Cleared');

    // Admin
    await User.create({ email: 'admin@ttwar.ps', password_hash: bcrypt.hashSync('admin123', 10), role: 'admin', full_name: 'مدير المنصة', is_verified: true });

    // 43 شركة من companies.json
    const companies = await Company.insertMany(COMPANIES);
    console.log(`🏢 ${companies.length} companies inserted`);

    // وظيفة لكل شركة + 10 إضافية للأوائل
    const jobs = companies.flatMap((co, i) => {
      const main  = { ...JOBS[i % JOBS.length] };
      const extra = i < 10 ? [{ ...JOBS[(i + 5) % JOBS.length], title: JOBS[(i + 5) % JOBS.length].title + ' II' }] : [];
      return [main, ...extra].map(j => ({
        company_id: co._id, region: co.region, field: 'تكنولوجيا',
        salary_currency: '₪', salary_visible: true, is_active: true,
        title: j.title, description: j.desc,
        requirements: j.reqs, benefits: ['تأمين صحي','بيئة احترافية'],
        job_type: j.type, experience_level: j.exp,
        salary_min: j.min, salary_max: j.max,
        is_featured: !!j.feat,
      }));
    });

    const inserted = await Job.insertMany(jobs);
    console.log(`💼 ${inserted.length} jobs inserted`);
    console.log('');
    console.log('✅ Seed done! Admin: admin@ttwar.ps / admin123');
  } catch (e) {
    console.error('❌', e.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main();
