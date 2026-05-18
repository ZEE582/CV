/**
 * @file config/seed.js
 * @description ملف البيانات الأولية الشامل — يُنشئ كل ما يحتاجه المشروع
 *
 * يشمل:
 *  1. حساب الأدمن
 *  2. مستخدمي اختبار (seeker + company)
 *  3. الشركات من companies.json
 *  4. وظائف حقيقية لكل شركة
 *  5. رسائل تواصل تجريبية
 *  6. تقديمات تجريبية
 *  7. وظائف محفوظة
 *
 * تشغيل: node config/seed.js
 * تشغيل مع مسح كامل: node config/seed.js --fresh
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const path     = require('path');
const fs       = require('fs');

const User           = require('../models/User');
const Company        = require('../models/Company');
const Job            = require('../models/Job');
const Application    = require('../models/Application');
const SavedJob       = require('../models/SavedJob');
const ContactMessage = require('../models/ContactMessage');
const CV             = require('../models/CV');

const URI   = process.env.MONGO_URI || 'mongodb://localhost:27017/ttwar';
const FRESH = process.argv.includes('--fresh');

// ─────────────────────────────────────────────────────────────
// بيانات الوظائف — قائمة شاملة لكل مجالات التكنولوجيا
// ─────────────────────────────────────────────────────────────
const JOB_TEMPLATES = [

  // ── Frontend ──────────────────────────────────────────────
  {
    title: 'مطور Frontend — React',
    description: 'نبحث عن مطور Frontend متمرّس في React.js لبناء واجهات مستخدم احترافية وسريعة الأداء. ستعمل ضمن فريق Agile وتساهم في تطوير منتجاتنا الرئيسية.',
    requirements: ['React.js', 'TypeScript', 'CSS / Tailwind', 'REST APIs', 'Git'],
    benefits: ['راتب تنافسي', 'تأمين صحي', 'دوام مرن', 'تدريب مستمر'],
    field: 'تكنولوجيا', job_type: 'دوام كامل', experience_level: '1-3 سنوات',
    region: 'ضفة', salary_min: 2500, salary_max: 4000, salary_currency: '₪',
    salary_visible: true, is_featured: true,
  },
  {
    title: 'مطور Frontend — Vue.js',
    description: 'فرصة للانضمام إلى فريق هندسي متميّز للعمل على تطبيقات ويب بـ Vue.js 3. المشاريع متنوعة وتمسّ حياة الناس.',
    requirements: ['Vue.js 3', 'Pinia / Vuex', 'HTML5', 'SCSS', 'Vite'],
    benefits: ['بيئة عمل ودية', 'إجازة سنوية مدفوعة', 'أجهزة عمل حديثة'],
    field: 'تكنولوجيا', job_type: 'دوام كامل', experience_level: '1-3 سنوات',
    region: 'ضفة', salary_min: 2000, salary_max: 3500, salary_currency: '₪',
    salary_visible: true, is_featured: false,
  },
  {
    title: 'مصمم UI/UX وMطور Frontend',
    description: 'دور مزدوج — مصمم يفهم الكود. نريد شخصاً يصمم في Figma ويُحوّل التصاميم إلى كود React نظيف.',
    requirements: ['Figma', 'React.js', 'CSS Animations', 'تجربة المستخدم UX', 'Responsive Design'],
    benefits: ['راتب تنافسي', 'مشاريع إبداعية', 'دوام جزئي ممكن'],
    field: 'تكنولوجيا', job_type: 'دوام كامل', experience_level: '1-3 سنوات',
    region: 'ضفة', salary_min: 2200, salary_max: 3800, salary_currency: '₪',
    salary_visible: true, is_featured: false,
  },

  // ── Backend ───────────────────────────────────────────────
  {
    title: 'مطور Backend — Node.js',
    description: 'نحتاج مطور Backend قوي في Node.js وExpress لبناء APIs موثوقة وقابلة للتوسع. ستعمل مع قواعد بيانات MongoDB وPostgreSQL.',
    requirements: ['Node.js', 'Express.js', 'MongoDB', 'REST API', 'JWT', 'Docker'],
    benefits: ['راتب تنافسي', 'عمل عن بُعد جزئي', 'فريق صغير ومرن'],
    field: 'تكنولوجيا', job_type: 'دوام كامل', experience_level: '1-3 سنوات',
    region: 'ضفة', salary_min: 2800, salary_max: 4500, salary_currency: '₪',
    salary_visible: true, is_featured: true,
  },
  {
    title: 'مطور Backend — Python / Django',
    description: 'فرصة لمطور Python متمرّن للعمل على منصة SaaS ضخمة. ستبني APIs وتُحسّن الأداء وتكتب اختبارات جودة.',
    requirements: ['Python 3', 'Django / DRF', 'PostgreSQL', 'Redis', 'Celery'],
    benefits: ['تأمين صحي', 'حصص ربح', 'دورات تدريبية مدفوعة'],
    field: 'تكنولوجيا', job_type: 'دوام كامل', experience_level: '3-5 سنوات',
    region: 'ضفة', salary_min: 3500, salary_max: 5500, salary_currency: '₪',
    salary_visible: true, is_featured: true,
  },
  {
    title: 'مطور Backend — Java / Spring Boot',
    description: 'نبحث عن مهندس Java لتطوير خدمات Microservices على منصة مصرفية. خبرة في بيئات Enterprise مطلوبة.',
    requirements: ['Java 17+', 'Spring Boot', 'Microservices', 'Kafka', 'MySQL'],
    benefits: ['راتب عالي', 'تأمين طبي عائلي', 'بدل سكن'],
    field: 'تكنولوجيا', job_type: 'دوام كامل', experience_level: '3-5 سنوات',
    region: 'ضفة', salary_min: 4000, salary_max: 7000, salary_currency: '₪',
    salary_visible: true, is_featured: false,
  },
  {
    title: 'مطور .NET / C#',
    description: 'فرصة للعمل على أنظمة ERP وإدارة الأعمال. خبرة في .NET Framework و.NET Core مطلوبة.',
    requirements: ['.NET Core', 'C#', 'SQL Server', 'Entity Framework', 'Azure'],
    benefits: ['راتب تنافسي', 'بيئة استقرار', 'دوام رسمي'],
    field: 'تكنولوجيا', job_type: 'دوام كامل', experience_level: '1-3 سنوات',
    region: 'ضفة', salary_min: 2500, salary_max: 4500, salary_currency: '₪',
    salary_visible: true, is_featured: false,
  },

  // ── Full Stack ─────────────────────────────────────────────
  {
    title: 'مطور Full Stack — React + Node',
    description: 'نريد مطور Full Stack يستطيع العمل على كامل المنظومة من قاعدة البيانات إلى الواجهة. مشاريعنا تقنية وتؤثر على الملايين.',
    requirements: ['React.js', 'Node.js', 'MongoDB', 'TypeScript', 'AWS'],
    benefits: ['راتب عالي', 'مرونة في العمل', 'أسهم في الشركة'],
    field: 'تكنولوجيا', job_type: 'دوام كامل', experience_level: '3-5 سنوات',
    region: 'ضفة', salary_min: 4000, salary_max: 7000, salary_currency: '₪',
    salary_visible: true, is_featured: true,
  },
  {
    title: 'مطور Full Stack — Laravel + Vue',
    description: 'بناء تطبيقات ويب متكاملة بـ Laravel في الخلفية وVue.js في الواجهة لعملاء محليين وإقليميين.',
    requirements: ['Laravel', 'Vue.js', 'MySQL', 'PHP 8', 'Livewire'],
    benefits: ['بيئة عمل داعمة', 'مشاريع متنوعة', 'تطوير مهني'],
    field: 'تكنولوجيا', job_type: 'دوام كامل', experience_level: '1-3 سنوات',
    region: 'ضفة', salary_min: 2200, salary_max: 3800, salary_currency: '₪',
    salary_visible: true, is_featured: false,
  },

  // ── Mobile ────────────────────────────────────────────────
  {
    title: 'مطور تطبيقات موبايل — React Native',
    description: 'نبحث عن مطور React Native لبناء تطبيقات iOS و Android. ستعمل على تطبيق التجارة الإلكترونية الخاص بنا.',
    requirements: ['React Native', 'Expo', 'Redux / Zustand', 'iOS + Android', 'REST APIs'],
    benefits: ['هاتف عمل', 'دوام مرن', 'راتب تنافسي'],
    field: 'تكنولوجيا', job_type: 'دوام كامل', experience_level: '1-3 سنوات',
    region: 'ضفة', salary_min: 2800, salary_max: 4500, salary_currency: '₪',
    salary_visible: true, is_featured: false,
  },
  {
    title: 'مطور تطبيقات Flutter',
    description: 'فرصة لمطور Flutter للعمل على تطبيق جوال يُستخدم في أكثر من 10 دول. الفريق موزّع وهناك تواصل يومي.',
    requirements: ['Flutter', 'Dart', 'Firebase', 'State Management (BLoC/Riverpod)', 'App Store & Google Play'],
    benefits: ['عمل عن بُعد كامل', 'راتب بالدولار', 'إجازة مدفوعة'],
    field: 'تكنولوجيا', job_type: 'عمل عن بُعد', experience_level: '1-3 سنوات',
    region: 'remote', salary_min: 1500, salary_max: 2800, salary_currency: '$',
    salary_visible: true, is_featured: true,
  },
  {
    title: 'مطور Android — Kotlin',
    description: 'تطوير تطبيق Android نيتف بـ Kotlin لمنصة تعليمية تستخدمها المدارس الفلسطينية.',
    requirements: ['Kotlin', 'Android SDK', 'Jetpack Compose', 'Room DB', 'MVVM'],
    benefits: ['تأمين صحي', 'راتب ثابت', 'مشاريع ذات تأثير'],
    field: 'تكنولوجيا', job_type: 'دوام كامل', experience_level: '1-3 سنوات',
    region: 'ضفة', salary_min: 2500, salary_max: 4000, salary_currency: '₪',
    salary_visible: true, is_featured: false,
  },

  // ── DevOps & Cloud ─────────────────────────────────────────
  {
    title: 'مهندس DevOps',
    description: 'نحتاج مهندس DevOps لإدارة البنية التحتية وCI/CD pipelines وتحسين عمليات النشر. خبرة في Kubernetes مطلوبة.',
    requirements: ['Kubernetes', 'Docker', 'CI/CD (Jenkins/GitLab)', 'AWS / GCP', 'Terraform', 'Linux'],
    benefits: ['راتب عالي', 'دوام مرن', 'أدوات عمل حديثة'],
    field: 'تكنولوجيا', job_type: 'دوام كامل', experience_level: '3-5 سنوات',
    region: 'ضفة', salary_min: 4500, salary_max: 7500, salary_currency: '₪',
    salary_visible: true, is_featured: true,
  },
  {
    title: 'مهندس Cloud — AWS',
    description: 'إدارة وتحسين البنية التحتية السحابية على AWS. تصميم حلول عالية التوفر وتحسين التكاليف.',
    requirements: ['AWS (EC2, S3, RDS, Lambda)', 'Infrastructure as Code', 'CloudFormation', 'Monitoring'],
    benefits: ['راتب تنافسي', 'شهادات AWS مدفوعة', 'عمل هجين'],
    field: 'تكنولوجيا', job_type: 'دوام كامل', experience_level: '3-5 سنوات',
    region: 'ضفة', salary_min: 5000, salary_max: 8000, salary_currency: '₪',
    salary_visible: true, is_featured: false,
  },

  // ── Data & AI ─────────────────────────────────────────────
  {
    title: 'مهندس البيانات — Data Engineer',
    description: 'بناء وصيانة pipelines للبيانات ومستودعات البيانات. العمل مع فريق علوم البيانات لتحليل سلوك المستخدمين.',
    requirements: ['Python', 'Apache Spark', 'Airflow', 'SQL', 'Data Warehousing (Redshift/BigQuery)'],
    benefits: ['راتب عالي', 'بيانات ضخمة وتحديات حقيقية', 'فريق أكاديمي'],
    field: 'تكنولوجيا', job_type: 'دوام كامل', experience_level: '3-5 سنوات',
    region: 'ضفة', salary_min: 5000, salary_max: 8000, salary_currency: '₪',
    salary_visible: true, is_featured: true,
  },
  {
    title: 'محلل بيانات — Data Analyst',
    description: 'تحليل بيانات المبيعات والمستخدمين واستخراج رؤى تدعم قرارات الأعمال. ستعمل مع Power BI وSQL.',
    requirements: ['SQL', 'Power BI / Tableau', 'Excel متقدم', 'Python (Pandas)', 'إحصاء أساسي'],
    benefits: ['بيئة تعلّم مستمر', 'راتب تنافسي', 'مرونة'],
    field: 'تكنولوجيا', job_type: 'دوام كامل', experience_level: '1-3 سنوات',
    region: 'ضفة', salary_min: 2500, salary_max: 4000, salary_currency: '₪',
    salary_visible: true, is_featured: false,
  },
  {
    title: 'مهندس تعلم الآلة — ML Engineer',
    description: 'تطوير ونشر نماذج Machine Learning في بيئة الإنتاج. العمل على نماذج NLP لمعالجة اللغة العربية.',
    requirements: ['Python', 'TensorFlow / PyTorch', 'Scikit-learn', 'MLOps', 'API deployment'],
    benefits: ['راتب استثنائي', 'بيئة بحثية', 'نشر أوراق علمية'],
    field: 'تكنولوجيا', job_type: 'دوام كامل', experience_level: '+5 سنوات',
    region: 'ضفة', salary_min: 7000, salary_max: 12000, salary_currency: '₪',
    salary_visible: true, is_featured: true,
  },

  // ── QA & Testing ──────────────────────────────────────────
  {
    title: 'مهندس ضمان الجودة — QA Engineer',
    description: 'اختبار وضمان جودة تطبيقات الويب والجوال. كتابة خطط اختبار وتنفيذ اختبارات يدوية وآلية.',
    requirements: ['اختبار يدوي', 'Selenium / Playwright', 'JIRA', 'API Testing', 'SQL'],
    benefits: ['بيئة عمل منظّمة', 'راتب ثابت', 'تطوير مهني'],
    field: 'تكنولوجيا', job_type: 'دوام كامل', experience_level: '1-3 سنوات',
    region: 'ضفة', salary_min: 2000, salary_max: 3500, salary_currency: '₪',
    salary_visible: true, is_featured: false,
  },

  // ── Cybersecurity ─────────────────────────────────────────
  {
    title: 'محلل أمن سيبراني',
    description: 'حماية أنظمة الشركة من التهديدات الإلكترونية. مراقبة الأحداث الأمنية وإجراء اختبارات الاختراق.',
    requirements: ['Penetration Testing', 'SIEM', 'Network Security', 'CEH / CISSP', 'Linux'],
    benefits: ['راتب عالي', 'شهادات مدفوعة', 'عمل حساس ومهم'],
    field: 'تكنولوجيا', job_type: 'دوام كامل', experience_level: '3-5 سنوات',
    region: 'ضفة', salary_min: 5000, salary_max: 9000, salary_currency: '₪',
    salary_visible: true, is_featured: false,
  },

  // ── Entry Level / Internship ───────────────────────────────
  {
    title: 'متدرب مطور ويب — Web Developer Intern',
    description: 'فرصة تدريب مدفوعة لطلاب السنة الأخيرة أو الخريجين الجدد. ستتعلم من مطورين محترفين وتعمل على مشاريع حقيقية.',
    requirements: ['HTML/CSS', 'JavaScript أساسي', 'مشاريع شخصية أو GitHub', 'رغبة في التعلم'],
    benefits: ['مكافأة شهرية', 'إمكانية التوظيف الدائم', 'تدريب مهني متخصص'],
    field: 'تكنولوجيا', job_type: 'تدريب مدفوع', experience_level: 'حديث التخرج',
    region: 'ضفة', salary_min: 800, salary_max: 1500, salary_currency: '₪',
    salary_visible: true, is_featured: false,
  },
  {
    title: 'مطور جونيور — Junior Developer',
    description: 'فرصة لخريج جديد بمهارات برمجية أساسية للانضمام لفريق تطوير. المشاريع متنوعة وبيئة التعلّم قوية.',
    requirements: ['أي لغة برمجة (JavaScript / Python / PHP)', 'Git أساسي', 'فضول وحب التعلم'],
    benefits: ['راتب أعلى من المتوسط للخريجين', 'مرشد مهني', 'بيئة تعليمية'],
    field: 'تكنولوجيا', job_type: 'دوام كامل', experience_level: 'حديث التخرج',
    region: 'ضفة', salary_min: 1500, salary_max: 2500, salary_currency: '₪',
    salary_visible: true, is_featured: false,
  },

  // ── Management & Senior ────────────────────────────────────
  {
    title: 'مدير تقني — CTO / Tech Lead',
    description: 'قيادة الفريق التقني ورسم الرؤية التقنية. إدارة المطورين واتخاذ القرارات المعمارية للمنتج.',
    requirements: ['خبرة قيادية 3+ سنوات', 'هندسة البرمجيات', 'Agile/Scrum', 'تواصل ممتاز', 'رؤية استراتيجية'],
    benefits: ['راتب تنفيذي', 'حصص في الشركة', 'صلاحيات واسعة'],
    field: 'تكنولوجيا', job_type: 'دوام كامل', experience_level: '+5 سنوات',
    region: 'ضفة', salary_min: 8000, salary_max: 15000, salary_currency: '₪',
    salary_visible: false, is_featured: true,
  },
  {
    title: 'مهندس برمجيات أول — Senior Software Engineer',
    description: 'دور قيادي في بناء منتجات تقنية معقدة. ستُرشد المطورين الصغار وتساهم في التصميم المعماري.',
    requirements: ['7+ سنوات خبرة', 'System Design', 'Code Review', 'تقنيات متعددة', 'أداء عالي'],
    benefits: ['راتب استثنائي', 'عمل هجين', 'ميزانية تطوير شخصية'],
    field: 'تكنولوجيا', job_type: 'دوام كامل', experience_level: '+5 سنوات',
    region: 'ضفة', salary_min: 7000, salary_max: 12000, salary_currency: '₪',
    salary_visible: true, is_featured: true,
  },

  // ── Product & Design ───────────────────────────────────────
  {
    title: 'مدير منتج — Product Manager',
    description: 'تعريف رؤية المنتج والعمل مع الفرق الهندسية والتصميمية. تحليل احتياجات السوق والمستخدمين.',
    requirements: ['خبرة في إدارة المنتج', 'تحليل البيانات', 'User Research', 'Agile', 'تواصل ممتاز'],
    benefits: ['راتب تنافسي', 'دور محوري', 'مشاريع عالمية'],
    field: 'تكنولوجيا', job_type: 'دوام كامل', experience_level: '3-5 سنوات',
    region: 'ضفة', salary_min: 5000, salary_max: 9000, salary_currency: '₪',
    salary_visible: false, is_featured: false,
  },
  {
    title: 'مصمم UX/UI',
    description: 'تصميم تجارب مستخدم استثنائية لمنتجاتنا الرقمية. بحث المستخدمين وإنشاء Wireframes وPrototypes.',
    requirements: ['Figma', 'Adobe XD', 'User Research', 'Prototyping', 'Design Systems'],
    benefits: ['بيئة إبداعية', 'راتب تنافسي', 'مشاريع متنوعة'],
    field: 'تكنولوجيا', job_type: 'دوام كامل', experience_level: '1-3 سنوات',
    region: 'ضفة', salary_min: 2500, salary_max: 4500, salary_currency: '₪',
    salary_visible: true, is_featured: false,
  },

  // ── Freelance / Remote ─────────────────────────────────────
  {
    title: 'مطور Freelance — مشاريع متنوعة',
    description: 'نبحث عن مطور freelance للعمل على مشاريع قصيرة ومتوسطة المدة. مرونة كاملة في أوقات العمل.',
    requirements: ['مهارة تقنية واحدة على الأقل', 'التزام بالمواعيد', 'تواصل جيد', 'محفظة أعمال'],
    benefits: ['مرونة تامة', 'دفع بالمشروع', 'تنوع المشاريع'],
    field: 'تكنولوجيا', job_type: 'فريلانس', experience_level: '1-3 سنوات',
    region: 'remote', salary_min: 500, salary_max: 3000, salary_currency: '$',
    salary_visible: true, is_featured: false,
  },
  {
    title: 'مطور Backend عن بُعد — Remote',
    description: 'عمل عن بُعد كامل مع شركة دولية. ساعات عمل مرنة وفريق موزّع حول العالم.',
    requirements: ['Node.js أو Python', 'APIs', 'قواعد بيانات', 'إنجليزية جيدة', 'Self-motivated'],
    benefits: ['راتب بالدولار', 'عمل من المنزل', 'إجازة مرنة'],
    field: 'تكنولوجيا', job_type: 'عمل عن بُعد', experience_level: '3-5 سنوات',
    region: 'remote', salary_min: 2000, salary_max: 5000, salary_currency: '$',
    salary_visible: true, is_featured: true,
  },
];

// بيانات اختبار للمستخدمين
const TEST_USERS = [
  {
    email:     'seeker1@test.com',
    password:  'Test@1234',
    full_name: 'أحمد محمود',
    role:      'seeker',
    phone:     '0599111222',
  },
  {
    email:     'seeker2@test.com',
    password:  'Test@1234',
    full_name: 'سارة خالد',
    role:      'seeker',
    phone:     '0598333444',
  },
  {
    email:     'company.user@test.com',
    password:  'Test@1234',
    full_name: 'مدير الشركة التجريبية',
    role:      'company',
    phone:     '0597555666',
  },
];

// ─────────────────────────────────────────────────────────────
// الدالة الرئيسية
// ─────────────────────────────────────────────────────────────
async function seed() {
  await mongoose.connect(URI);
  console.log('\n✅ MongoDB connected:', URI);

  // ── مسح كامل إذا طُلب ────────────────────────────────────
  if (FRESH) {
    console.log('\n⚠️  --fresh flag detected — مسح جميع البيانات...');
    await Promise.all([
      User.deleteMany({}),
      Company.deleteMany({}),
      Job.deleteMany({}),
      Application.deleteMany({}),
      SavedJob.deleteMany({}),
      ContactMessage.deleteMany({}),
      CV.deleteMany({}),
    ]);
    console.log('✅ All collections cleared');
  }

  // ──────────────────────────────────────────────────────────
  // 1. الأدمن
  // ──────────────────────────────────────────────────────────
  console.log('\n─── 1. Admin ───────────────────────────────────');
  const adminEmail    = process.env.ADMIN_EMAIL    || 'admin@ttwar.ps';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@2024';

  let adminUser = await User.findOne({ email: adminEmail });
  if (!adminUser) {
    adminUser = await User.create({
      email:         adminEmail,
      password_hash: await bcrypt.hash(adminPassword, 10),
      full_name:     'مدير المنصة',
      role:          'admin',
      is_active:     true,
      is_verified:   true,
    });
    console.log(`✅ Admin created:  ${adminEmail}  /  ${adminPassword}`);
  } else {
    console.log(`ℹ️  Admin exists:  ${adminEmail}`);
  }

  // ──────────────────────────────────────────────────────────
  // 2. مستخدمو الاختبار
  // ──────────────────────────────────────────────────────────
  console.log('\n─── 2. Test Users ──────────────────────────────');
  const createdUsers = {};
  for (const u of TEST_USERS) {
    let user = await User.findOne({ email: u.email });
    if (!user) {
      user = await User.create({
        email:         u.email,
        password_hash: await bcrypt.hash(u.password, 10),
        full_name:     u.full_name,
        role:          u.role,
        phone:         u.phone,
        is_active:     true,
      });
      console.log(`✅ ${u.role.padEnd(8)} created: ${u.email}  /  ${u.password}`);
    } else {
      console.log(`ℹ️  ${u.role.padEnd(8)} exists:  ${u.email}`);
    }
    createdUsers[u.role === 'seeker' ? (createdUsers.seeker1 ? 'seeker2' : 'seeker1') : u.role] = user;
    if (u.role === 'seeker' && !createdUsers.seeker1) createdUsers.seeker1 = user;
    else if (u.role === 'seeker') createdUsers.seeker2 = user;
    else createdUsers[u.role] = user;
  }

  // ──────────────────────────────────────────────────────────
  // 3. الشركات
  // ──────────────────────────────────────────────────────────
  console.log('\n─── 3. Companies ───────────────────────────────');
  const companiesFile = require('path').join(__dirname, 'companies.json');
  const rawCompanies  = JSON.parse(require('fs').readFileSync(companiesFile, 'utf8'));

  const allCompanies = [];
  let companiesAdded = 0;

  for (const co of rawCompanies) {
    let company = await Company.findOne({ name_ar: co.name_ar });
    if (!company) {
      company = await Company.create(co);
      companiesAdded++;
    }
    allCompanies.push(company);
  }

  // ربط مستخدم company بأول شركة
  if (createdUsers.company && allCompanies.length > 0) {
    const firstCo = allCompanies[0];
    if (!firstCo.user_id) {
      await Company.findByIdAndUpdate(firstCo._id, { user_id: createdUsers.company._id });
      console.log(`✅ Company user linked to: ${firstCo.name_ar}`);
    }
  }

  console.log(`✅ Companies: ${companiesAdded} new, ${allCompanies.length} total`);

  // ──────────────────────────────────────────────────────────
  // 4. الوظائف
  // ──────────────────────────────────────────────────────────
  console.log('\n─── 4. Jobs ────────────────────────────────────');
  const existingJobsCount = await Job.countDocuments();
  let jobsAdded = 0;
  const allJobs = [];

  if (existingJobsCount === 0 || FRESH) {
    // توزيع الوظائف على الشركات بشكل دوري
    for (let i = 0; i < JOB_TEMPLATES.length; i++) {
      const company  = allCompanies[i % allCompanies.length];
      const template = JOB_TEMPLATES[i];

      // تعديل المنطقة لتتوافق مع منطقة الشركة أحياناً
      const region = template.region === 'remote' ? 'remote' : (company.region || 'ضفة');

      // deadline بعد 30-90 يوم
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 30 + Math.floor(Math.random() * 60));

      const job = await Job.create({
        ...template,
        company_id:  company._id,
        region,
        location:    region === 'remote' ? 'عمل عن بُعد' : company.location,
        deadline,
      });

      allJobs.push(job);
      jobsAdded++;
    }

    // إضافة وظائف إضافية لشركات مختلفة للتنويع
    const extraJobs = [
      {
        title: 'مطور React Native — تطبيق توصيل',
        description: 'تطوير تطبيق توصيل الطعام على iOS وAndroid. ستعمل مع خرائط Google Maps ونظام دفع إلكتروني.',
        requirements: ['React Native', 'Google Maps API', 'Payment Integration', 'Real-time (Sockets)'],
        benefits: ['وجبات مجانية 😄', 'راتب جيد', 'فريق شاب'],
        field: 'تكنولوجيا', job_type: 'دوام كامل', experience_level: '1-3 سنوات',
        region: 'ضفة', salary_min: 2500, salary_max: 4000, salary_currency: '₪',
        salary_visible: true, is_featured: false,
      },
      {
        title: 'مهندس Blockchain',
        description: 'تطوير حلول Blockchain لقطاع المال والأعمال. خبرة في Ethereum وSolidity مطلوبة.',
        requirements: ['Solidity', 'Ethereum', 'Web3.js', 'Smart Contracts', 'DeFi'],
        benefits: ['راتب بالعملات الرقمية اختياري', 'مشاريع مستقبلية', 'فريق مبتكر'],
        field: 'تكنولوجيا', job_type: 'دوام كامل', experience_level: '3-5 سنوات',
        region: 'remote', salary_min: 3000, salary_max: 6000, salary_currency: '$',
        salary_visible: true, is_featured: true,
      },
      {
        title: 'متخصص Scrum Master',
        description: 'قيادة فرق Agile وضمان تطبيق منهجية Scrum بشكل صحيح. تحسين أداء الفريق وإزالة العوائق.',
        requirements: ['Scrum Master Certified', 'Agile Coaching', 'JIRA', 'تواصل ممتاز', 'قيادة'],
        benefits: ['دور محوري', 'تأثير واسع على الفريق', 'راتب جيد'],
        field: 'تكنولوجيا', job_type: 'دوام كامل', experience_level: '3-5 سنوات',
        region: 'ضفة', salary_min: 4000, salary_max: 7000, salary_currency: '₪',
        salary_visible: false, is_featured: false,
      },
      {
        title: 'مطور WordPress / WooCommerce',
        description: 'تطوير وتخصيص مواقع WordPress للشركات والمتاجر الإلكترونية. خبرة في WooCommerce وبناء Themes وPlugins.',
        requirements: ['WordPress', 'WooCommerce', 'PHP', 'CSS', 'Elementor/Divi'],
        benefits: ['عمل مرن', 'مشاريع متنوعة', 'راتب جيد'],
        field: 'تكنولوجيا', job_type: 'دوام جزئي', experience_level: '1-3 سنوات',
        region: 'ضفة', salary_min: 1500, salary_max: 2500, salary_currency: '₪',
        salary_visible: true, is_featured: false,
      },
      {
        title: 'مهندس شبكات وأمن معلومات',
        description: 'إدارة البنية التحتية للشبكات وتأمينها. تكوين Firewalls وVPN وأنظمة المراقبة.',
        requirements: ['CCNA / CCNP', 'Firewall Management', 'VPN', 'Network Monitoring', 'Security+'],
        benefits: ['راتب ثابت', 'بيئة استقرار', 'تأمين شامل'],
        field: 'تكنولوجيا', job_type: 'دوام كامل', experience_level: '3-5 سنوات',
        region: 'ضفة', salary_min: 3500, salary_max: 6000, salary_currency: '₪',
        salary_visible: true, is_featured: false,
      },
    ];

    for (let i = 0; i < extraJobs.length; i++) {
      const company  = allCompanies[(JOB_TEMPLATES.length + i) % allCompanies.length];
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 20 + Math.floor(Math.random() * 40));
      const job = await Job.create({
        ...extraJobs[i],
        company_id: company._id,
        location:   extraJobs[i].region === 'remote' ? 'عمل عن بُعد' : company.location,
        deadline,
      });
      allJobs.push(job);
      jobsAdded++;
    }

    console.log(`✅ Jobs created: ${jobsAdded}`);
  } else {
    const existingJobs = await Job.find().lean();
    allJobs.push(...existingJobs);
    console.log(`ℹ️  Jobs already exist: ${existingJobs.length}`);
  }

  // ──────────────────────────────────────────────────────────
  // 5. رسائل تواصل تجريبية
  // ──────────────────────────────────────────────────────────
  console.log('\n─── 5. Contact Messages ────────────────────────');
  const existingMessages = await ContactMessage.countDocuments();
  if (existingMessages === 0 || FRESH) {
    const sampleMessages = [
      {
        company_id:   allCompanies[0]?._id,
        sender_name:  'محمد العلي',
        sender_email: 'mohammed.ali@gmail.com',
        sender_phone: '0599123456',
        subject:      'استفسار عن فرص العمل',
        message:      'السلام عليكم، أود الاستفسار عن فرص العمل المتاحة في شركتكم، خاصة في مجال تطوير الواجهات الأمامية.',
        is_read:      false,
      },
      {
        company_id:   allCompanies[1]?._id,
        sender_name:  'ريم أبو سليم',
        sender_email: 'reem@outlook.com',
        sender_phone: '0598234567',
        subject:      'تعاون في مشروع تقني',
        message:      'أتواصل معكم للاستفسار عن إمكانية التعاون في مشروع تطوير تطبيق جوال. لدينا فكرة جاهزة للتنفيذ.',
        is_read:      true,
      },
      {
        company_id:   allCompanies[2]?._id,
        sender_name:  'خالد يوسف',
        sender_email: 'khaled.yousuf@yahoo.com',
        sender_phone: '0597345678',
        subject:      'سؤال عن التدريب الصيفي',
        message:      'مرحباً، أنا طالب في سنتي الثالثة في تخصص الحاسوب وأريد الاستفسار عن برامج التدريب الصيفي لديكم.',
        is_read:      false,
      },
    ].filter(m => m.company_id);

    if (sampleMessages.length > 0) {
      await ContactMessage.insertMany(sampleMessages);
      console.log(`✅ Messages created: ${sampleMessages.length}`);
    }
  } else {
    console.log(`ℹ️  Messages already exist: ${existingMessages}`);
  }

  // ──────────────────────────────────────────────────────────
  // 6. تقديمات تجريبية
  // ──────────────────────────────────────────────────────────
  console.log('\n─── 6. Applications ────────────────────────────');
  const seekerUser = await User.findOne({ role: 'seeker' });
  const existingApps = await Application.countDocuments();

  if (existingApps === 0 && seekerUser && allJobs.length > 0) {
    const appsToCreate = allJobs.slice(0, 3).map((job, i) => ({
      job_id:       job._id,
      user_id:      seekerUser._id,
      company_id:   job.company_id,
      cover_letter: [
        'أتقدم بطلبي لهذه الوظيفة وأنا على ثقة بأن مهاراتي تناسب متطلباتها. لدي خبرة عملية في المجال وأتطلع للانضمام لفريقكم.',
        'أنا خريج حديث متحمس للتعلم والعمل. أحب التحديات التقنية وأسعى دائماً لتطوير نفسي.',
        'لدي سنتان من الخبرة في هذا المجال وأعتقد أنني سأضيف قيمة حقيقية لفريقكم.',
      ][i],
      status: ['pending', 'viewed', 'shortlisted'][i],
    }));

    await Application.insertMany(appsToCreate);
    console.log(`✅ Applications created: ${appsToCreate.length}`);
  } else {
    console.log(`ℹ️  Applications already exist: ${existingApps}`);
  }

  // ──────────────────────────────────────────────────────────
  // 7. وظائف محفوظة تجريبية
  // ──────────────────────────────────────────────────────────
  console.log('\n─── 7. Saved Jobs ──────────────────────────────');
  const existingSaved = await SavedJob.countDocuments();
  if (existingSaved === 0 && seekerUser && allJobs.length >= 5) {
    const savedToCreate = allJobs.slice(3, 6).map(job => ({
      user_id: seekerUser._id,
      job_id:  job._id,
    }));
    await SavedJob.insertMany(savedToCreate);
    console.log(`✅ Saved jobs created: ${savedToCreate.length}`);
  } else {
    console.log(`ℹ️  Saved jobs already exist: ${existingSaved}`);
  }

  // ──────────────────────────────────────────────────────────
  // ملخص نهائي
  // ──────────────────────────────────────────────────────────
  const [uCount, coCount, jCount, aCount, sCount, mCount] = await Promise.all([
    User.countDocuments(),
    Company.countDocuments(),
    Job.countDocuments(),
    Application.countDocuments(),
    SavedJob.countDocuments(),
    ContactMessage.countDocuments(),
  ]);

  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║          📊 ملخص قاعدة البيانات           ║');
  console.log('╠═══════════════════════════════════════════╣');
  console.log(`║  👤 المستخدمون:      ${String(uCount).padEnd(20)} ║`);
  console.log(`║  🏢 الشركات:         ${String(coCount).padEnd(20)} ║`);
  console.log(`║  💼 الوظائف:         ${String(jCount).padEnd(20)} ║`);
  console.log(`║  📋 التقديمات:       ${String(aCount).padEnd(20)} ║`);
  console.log(`║  🔖 محفوظة:          ${String(sCount).padEnd(20)} ║`);
  console.log(`║  📩 الرسائل:         ${String(mCount).padEnd(20)} ║`);
  console.log('╠═══════════════════════════════════════════╣');
  console.log('║          🔑 بيانات الدخول                 ║');
  console.log('╠═══════════════════════════════════════════╣');
  console.log(`║  Admin:   ${adminEmail.padEnd(32)} ║`);
  console.log(`║           ${adminPassword.padEnd(32)} ║`);
  console.log('║  Seeker:  seeker1@test.com                ║');
  console.log('║           Test@1234                       ║');
  console.log('║  Company: company.user@test.com           ║');
  console.log('║           Test@1234                       ║');
  console.log('╠═══════════════════════════════════════════╣');
  console.log('║  📚 Swagger:  http://localhost:5000/api/docs ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('\n❌ Seed error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
