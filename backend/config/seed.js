/**
 * seed.js
 * يضيف الشركات والوظائف التجريبية لقاعدة البيانات waseem_foras
 * الاستخدام: node config/seed.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql  = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT) || 3306,
  database:           process.env.DB_NAME     || 'waseem_foras',
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || 'waseemxd12',
  waitForConnections: true,
  connectionLimit:    5,
  charset:            'utf8mb4'
});

const HASH = bcrypt.hashSync('password123', 10);

// ═══════════════════════════════════════════════════════════════════
//  COMPANIES  (id = login username)
// ═══════════════════════════════════════════════════════════════════
const COMPANIES = [
  {
    id:'jawwal', email:'hr@jawwal.ps',
    name_ar:'جوال', name_en:'Jawwal',
    sector:'اتصالات', size:'+1000 موظف', founded_year:1999,
    location:'رام الله', region:'ضفة', website:'jawwal.ps',
    color:'#1a7a4a', is_verified:1,
    about_ar:'الشركة الفلسطينية للاتصالات الخلوية — رائدة قطاع الاتصالات بأكثر من 3 مليون مشترك في الضفة الغربية وقطاع غزة. تقدم خدمات الجيل الرابع وتعمل على تطوير الجيل الخامس.'
  },
  {
    id:'paltel', email:'careers@paltel.ps',
    name_ar:'بالتل', name_en:'Paltel',
    sector:'اتصالات', size:'+2000 موظف', founded_year:1995,
    location:'رام الله', region:'ضفة', website:'paltel.ps',
    color:'#0e6b9e', is_verified:1,
    about_ar:'المجموعة الفلسطينية للاتصالات — أكبر مجموعة اتصالات في فلسطين. تمتلك شركات جوال وهوب للإنترنت وتخدم الملايين من المشتركين في الضفة والقطاع.'
  },
  {
    id:'exalt', email:'jobs@exalt.ps',
    name_ar:'Exalt Technologies', name_en:'Exalt Technologies',
    sector:'تكنولوجيا', size:'201-500 موظف', founded_year:2010,
    location:'رام الله', region:'ضفة', website:'exalt.ps',
    color:'#6b21a8', is_verified:1,
    about_ar:'شركة تطوير برمجيات عالمية تعمل من رام الله. متخصصة في الأتمتة الذكية وتطوير البرمجيات المخصصة لعملاء في أوروبا وأمريكا الشمالية. تبني منتجات SaaS وتعتمد منهجية Agile.'
  },
  {
    id:'asal', email:'hr@asal.ps',
    name_ar:'Asal Technologies', name_en:'Asal Technologies',
    sector:'تكنولوجيا', size:'51-200 موظف', founded_year:2009,
    location:'رام الله', region:'ضفة', website:'asal.ps',
    color:'#9333ea', is_verified:1,
    about_ar:'شركة تطوير برمجيات فلسطينية متخصصة في حلول الجوال والويب لعملاء دوليين. تطور تطبيقات iOS وAndroid وحلول مؤسسية متكاملة بمعايير عالمية.'
  },
  {
    id:'arabbank', email:'recruitment@arabbank.com.jo',
    name_ar:'عرب بنك', name_en:'Arab Bank',
    sector:'مالية وبنوك', size:'+500 موظف', founded_year:1930,
    location:'رام الله', region:'ضفة', website:'arabbank.ps',
    color:'#b45309', is_verified:1,
    about_ar:'أحد أعرق البنوك العربية بتاريخ يمتد لأكثر من 90 عاماً. يقدم خدمات مصرفية شاملة للأفراد والشركات عبر شبكة فروع واسعة في فلسطين والأردن ودول عربية عديدة.'
  },
  {
    id:'bop', email:'hr@bankofpalestine.com',
    name_ar:'بنك فلسطين', name_en:'Bank of Palestine',
    sector:'مالية وبنوك', size:'+500 موظف', founded_year:1960,
    location:'رام الله', region:'ضفة', website:'bankofpalestine.com',
    color:'#0369a1', is_verified:1,
    about_ar:'ثاني أكبر بنك في فلسطين بشبكة فروع تغطي كامل التراب الفلسطيني. متخصص في خدمات الأفراد والشركات الصغيرة والمتوسطة ويقدم حلولاً رقمية مبتكرة.'
  },
  {
    id:'pib', email:'jobs@pib.ps',
    name_ar:'البنك الإسلامي الفلسطيني', name_en:'Palestine Islamic Bank',
    sector:'مالية وبنوك', size:'+500 موظف', founded_year:1995,
    location:'نابلس', region:'ضفة', website:'pib.ps',
    color:'#0f766e', is_verified:1,
    about_ar:'من أكبر البنوك الإسلامية في فلسطين. يقدم خدمات مصرفية متكاملة وفق أحكام الشريعة الإسلامية عبر شبكة فروع تمتد في كل المحافظات الفلسطينية.'
  },
  {
    id:'undp', email:'jobs@undp.org',
    name_ar:'UNDP فلسطين', name_en:'UNDP Palestine',
    sector:'منظمات دولية', size:'+200 موظف', founded_year:1994,
    location:'القدس', region:'قدس', website:'ps.undp.org',
    color:'#1d4ed8', is_verified:1,
    about_ar:'برنامج الأمم المتحدة الإنمائي — مكتب فلسطين. يعمل على دعم التنمية المستدامة وتعزيز حقوق الإنسان والحوكمة الرشيدة عبر برامج متنوعة في الضفة وغزة.'
  },
  {
    id:'oxfam', email:'palestine@oxfam.org',
    name_ar:'Oxfam فلسطين', name_en:'Oxfam Palestine',
    sector:'منظمات دولية', size:'51-200 موظف', founded_year:1948,
    location:'القدس', region:'قدس', website:'oxfam.org/palestine',
    color:'#e11d48', is_verified:1,
    about_ar:'منظمة أوكسفام الدولية — مكتب فلسطين. تعمل على مكافحة الفقر وتعزيز العدالة الاجتماعية من خلال برامج الاستجابة الإنسانية والتنمية المجتمعية والمناصرة.'
  },
  {
    id:'unrwa', email:'jobs@unrwa.org',
    name_ar:'الأونروا UNRWA', name_en:'UNRWA',
    sector:'منظمات دولية', size:'+30000 موظف', founded_year:1949,
    location:'القدس', region:'قدس', website:'unrwa.org',
    color:'#0891b2', is_verified:1,
    about_ar:'وكالة الأمم المتحدة لإغاثة وتشغيل اللاجئين الفلسطينيين. تقدم خدمات التعليم والصحة والإغاثة لما يزيد عن 5 ملايين لاجئ فلسطيني في المنطقة.'
  },
  {
    id:'birzeit', email:'careers@birzeit.edu',
    name_ar:'جامعة بيرزيت', name_en:'Birzeit University',
    sector:'تعليم', size:'+1000 موظف', founded_year:1924,
    location:'بيرزيت', region:'ضفة', website:'birzeit.edu',
    color:'#7c3aed', is_verified:1,
    about_ar:'أعرق الجامعات الفلسطينية وأكثرها تميزاً. تضم أكثر من 14,000 طالب في 11 كلية وتتصدر تصنيفات الجامعات الفلسطينية. مركز للبحث العلمي والابتكار الأكاديمي.'
  },
  {
    id:'hospital', email:'hr@moh.ps',
    name_ar:'مستشفى رام الله الحكومي', name_en:'Ramallah Government Hospital',
    sector:'صحة', size:'+1000 موظف', founded_year:1966,
    location:'رام الله', region:'ضفة', website:'moh.ps',
    color:'#dc2626', is_verified:1,
    about_ar:'أكبر المستشفيات الحكومية في الضفة الغربية بطاقة استيعابية تتجاوز 350 سريراً. يقدم خدمات طبية متخصصة في جميع المجالات ويضم كوادر طبية وتمريضية متميزة.'
  },
  {
    id:'jedco', email:'jobs@jedco.ps',
    name_ar:'شركة كهرباء القدس', name_en:'Jerusalem Electric Co.',
    sector:'طاقة', size:'+500 موظف', founded_year:1966,
    location:'القدس', region:'قدس', website:'jedco.ps',
    color:'#d97706', is_verified:1,
    about_ar:'المزود الرئيسي للكهرباء لمدينة القدس وضواحيها. تعمل على تطوير شبكة الكهرباء ودمج مصادر الطاقة المتجددة لتحقيق مستقبل طاقوي مستدام.'
  },
  {
    id:'masar', email:'hr@masarco.ps',
    name_ar:'المسار للمقاولات', name_en:'Masar Contracting',
    sector:'هندسة', size:'51-200 موظف', founded_year:2007,
    location:'رام الله', region:'ضفة', website:'masarco.ps',
    color:'#64748b', is_verified:0,
    about_ar:'شركة مقاولات وإنشاء متخصصة في مشاريع البنية التحتية والطرق والمباني التجارية والسكنية في الضفة الغربية. نفّذت مئات المشاريع الكبرى بجودة عالية.'
  },
  {
    id:'remotely', email:'jobs@remotely.ps',
    name_ar:'Remotely Palestine', name_en:'Remotely Palestine',
    sector:'تكنولوجيا', size:'11-50 موظف', founded_year:2020,
    location:'عن بُعد', region:'remote', website:'remotely.ps',
    color:'#0ea5e9', is_verified:0,
    about_ar:'منصة تربط المواهب الفلسطينية بفرص العمل عن بُعد مع الشركات العالمية. تقدم تدريباً مهنياً وبناء ملفات احترافية وبرامج توجيه وظيفي للشباب الفلسطيني.'
  }
];

// ═══════════════════════════════════════════════════════════════════
//  JOBS
// ═══════════════════════════════════════════════════════════════════
const JOBS = [
  {
    co:'jawwal', title:'مهندس شبكات 4G/5G',
    field:'اتصالات', type:'دوام كامل', exp:'3-5 سنوات',
    loc:'رام الله', region:'ضفة', min:5500, max:8000, cur:'₪', feat:1, hoursAgo:1,
    desc:'تبحث شركة جوال عن مهندس شبكات متخصص في تقنيات LTE/5G للإشراف على تطوير وصيانة شبكة الاتصالات الخلوية على مستوى الضفة الغربية. ستعمل مع فريق هندسي متميز على أحدث المعدات.',
    req:['CCNP أو شهادة معادلة','خبرة 3+ سنوات في شبكات LTE','معرفة معمّقة بـ BGP وMPLS','خبرة Cisco وHuawei','رخصة قيادة سارية'],
    ben:['خطة هاتف مجانية كاملة','سيارة خدمة','تأمين صحي وحياة','تدريب دولي','بونص سنوي']
  },
  {
    co:'jawwal', title:'مطور تطبيقات موبايل',
    field:'تكنولوجيا', type:'دوام كامل', exp:'1-3 سنوات',
    loc:'رام الله', region:'ضفة', min:4000, max:5500, cur:'₪', feat:0, hoursAgo:3,
    desc:'مطلوب مطور موبايل موهوب للعمل على تطبيقات جوال الرسمية على iOS وAndroid. ستشارك في تطوير ميزات جديدة تخدم ملايين المشتركين.',
    req:['Flutter أو React Native','خبرة نشر على AppStore وPlayStore','REST APIs','Git وCI/CD'],
    ben:['دوام هجين','تأمين صحي','فرص التطوير المهني']
  },
  {
    co:'paltel', title:'مدير تسويق رقمي',
    field:'تسويق وإعلام', type:'دوام كامل', exp:'+5 سنوات',
    loc:'رام الله', region:'ضفة', min:7000, max:10500, cur:'₪', feat:1, hoursAgo:6,
    desc:'مجموعة بالتل تبحث عن مدير تسويق رقمي لقيادة استراتيجية الحضور الرقمي لأكبر مجموعة اتصالات فلسطينية. ستدير فريقاً من 8 أشخاص وتتولى ميزانية تسويقية ضخمة.',
    req:['5+ سنوات تسويق رقمي','Google Ads وMeta متقدم','تحليل بيانات وROI','خبرة إدارة فريق','إنجليزية ممتازة'],
    ben:['راتب عالٍ جداً','سيارة مديرية + هاتف','بونص ربع سنوي','تأمين صحي وحياة شامل','إجازة 26 يوم']
  },
  {
    co:'exalt', title:'مطور Full Stack (React + Node.js)',
    field:'تكنولوجيا', type:'دوام كامل', exp:'3-5 سنوات',
    loc:'رام الله', region:'ضفة', min:4800, max:6500, cur:'₪', feat:1, hoursAgo:12,
    desc:'نبحث عن مطور Full Stack متمكن يمتلك شغفاً حقيقياً بالتقنية. ستعمل مع فريق صغير ومتحمس على منصات SaaS يستخدمها آلاف المستخدمين في فلسطين والأردن وأوروبا.',
    req:['React 18+ وHooks وContext API','Node.js وExpress وRESTful APIs','PostgreSQL أو MongoDB','Docker وGit وCI/CD','إنجليزية جيدة'],
    ben:['راتب تنافسي','تأمين صحي كامل','دوام هجين 3 أيام مكتب','ميزانية تطوير 1200₪/سنة','MacBook Pro']
  },
  {
    co:'exalt', title:'مهندس DevOps / Cloud',
    field:'تكنولوجيا', type:'دوام كامل', exp:'3-5 سنوات',
    loc:'رام الله', region:'ضفة', min:5500, max:8000, cur:'₪', feat:0, hoursAgo:18,
    desc:'نبحث عن مهندس DevOps لبناء وإدارة بنية تحتية سحابية موثوقة لعملائنا في أوروبا وأمريكا. ستعمل على AWS وGCP وتدير pipelines تخدم ملايين المستخدمين.',
    req:['AWS أو GCP شهادة معتمدة','Kubernetes وDocker','Terraform وAnsible','Prometheus وGrafana','3+ سنوات DevOps'],
    ben:['راتب بالدولار USD','شهادات مدفوعة بالكامل','عمل هجين','تأمين طبي دولي']
  },
  {
    co:'exalt', title:'مهندس AI / LLM Integration',
    field:'تكنولوجيا', type:'دوام كامل', exp:'1-3 سنوات',
    loc:'رام الله', region:'ضفة', min:5000, max:7500, cur:'₪', feat:0, hoursAgo:8,
    desc:'Exalt تبحث عن مهندس متخصص في دمج نماذج اللغة الكبيرة LLMs في منتجات SaaS. تجربة مع LangChain أو LlamaIndex ضرورية.',
    req:['Python','LangChain أو LlamaIndex','OpenAI API أو Anthropic','Vector Databases','REST APIs'],
    ben:['راتب مميز','MacBook Pro','بيئة بحثية','تدريب دولي']
  },
  {
    co:'asal', title:'مصمم UI/UX Senior',
    field:'تكنولوجيا', type:'دوام كامل', exp:'3-5 سنوات',
    loc:'رام الله', region:'ضفة', min:4500, max:6000, cur:'₪', feat:0, hoursAgo:36,
    desc:'نبحث عن مصمم UX/UI بخبرة حقيقية لتصميم تجارب مستخدم استثنائية لتطبيقات موبايل وويب تخدم ملايين المستخدمين.',
    req:['Figma وPrototyping متقدم','Design Systems وComponent Libraries','User Research وUsability Testing','Portfolio قوي مع نتائج قابلة للقياس'],
    ben:['بيئة إبداعية مميزة','معدات Apple كاملة','دوام هجين','دورات تدريبية مدفوعة']
  },
  {
    co:'asal', title:'مطور Flutter / موبايل',
    field:'تكنولوجيا', type:'دوام كامل', exp:'1-3 سنوات',
    loc:'رام الله', region:'ضفة', min:4000, max:5500, cur:'₪', feat:0, hoursAgo:48,
    desc:'نطور تطبيقات موبايل لعملاء دوليين ونحتاج مطور Flutter يحب الكود النظيف ويهتم بالتفاصيل.',
    req:['Flutter وDart','Bloc أو Riverpod','REST APIs وFirebase','نشر على AppStore وPlayStore'],
    ben:['راتب مميز','تأمين صحي','مرونة في الدوام']
  },
  {
    co:'arabbank', title:'محلل مخاطر ائتمانية',
    field:'مالية وبنوك', type:'دوام كامل', exp:'3-5 سنوات',
    loc:'رام الله', region:'ضفة', min:5000, max:7000, cur:'₪', feat:1, hoursAgo:72,
    desc:'يبحث عرب بنك عن محلل مخاطر لتقييم محافظ الائتمان وضمان الامتثال لمتطلبات إدارة المخاطر المصرفية الدولية.',
    req:['Excel متقدم وPython أو R','إحصاء تطبيقي','خبرة Credit Analysis','معرفة IFRS 9 وBasel III'],
    ben:['راتب بنكي مميز','بيئة مهنية عالية','فرص ترقٍ واضحة','تقاعد مضمون']
  },
  {
    co:'arabbank', title:'مستشار مالي — أفراد',
    field:'مالية وبنوك', type:'دوام كامل', exp:'1-3 سنوات',
    loc:'نابلس', region:'ضفة', min:3500, max:5000, cur:'₪', feat:0, hoursAgo:96,
    desc:'مطلوب مستشار مالي لفرع نابلس لخدمة عملاء الأفراد وتقديم حلول مالية مخصصة ومنتجات مصرفية متنوعة.',
    req:['بكالوريوس مالية أو محاسبة','مهارات تفاوض ومبيعات عالية','تواصل ممتاز','رخصة قيادة سارية'],
    ben:['راتب ثابت + عمولة','تأمين صحي','تدريب مستمر','بيئة مهنية']
  },
  {
    co:'bop', title:'محلل بيانات Data Analyst',
    field:'مالية وبنوك', type:'دوام كامل', exp:'1-3 سنوات',
    loc:'رام الله', region:'ضفة', min:4200, max:6000, cur:'₪', feat:0, hoursAgo:120,
    desc:'بنك فلسطين يبحث عن محلل بيانات للعمل في قسم تحليل الأعمال وتحسين القرارات التشغيلية والتسويقية.',
    req:['SQL متقدم','Python وPandas','Power BI أو Tableau','إحصاء تطبيقي','Excel احترافي'],
    ben:['راتب بنكي مميز','تأمين صحي شامل','بيئة رقمية متطورة']
  },
  {
    co:'pib', title:'مراجع داخلي أول — CPA',
    field:'مالية وبنوك', type:'دوام كامل', exp:'+5 سنوات',
    loc:'نابلس', region:'ضفة', min:5500, max:8000, cur:'₪', feat:0, hoursAgo:144,
    desc:'مطلوب مراجع داخلي أول للعمل في قسم المراجعة الداخلية وفق أعلى معايير الحوكمة المصرفية الإسلامية.',
    req:['CPA أو CIA','خبرة 5+ سنوات تدقيق مصرفي','معرفة IFRS وBasel','خبرة تدقيق مصارف إسلامية ميزة'],
    ben:['بونص سنوي مميز','تقاعد مضمون','تأمين طبي شامل','قروض بفائدة تفضيلية']
  },
  {
    co:'undp', title:'أخصائي موارد بشرية — HR Specialist',
    field:'منظمات دولية', type:'عقد مؤقت', exp:'3-5 سنوات',
    loc:'القدس', region:'قدس', min:1200, max:1800, cur:'$', feat:1, hoursAgo:168,
    desc:'UNDP يبحث عن أخصائي موارد بشرية لمكتب القدس، عقد 12 شهراً قابل للتجديد. المهام تشمل التوظيف والتطوير المؤسسي وإدارة الأداء.',
    req:['بكالوريوس إدارة أو علم نفس تنظيمي','خبرة 3+ سنوات بمنظمات أممية','إنجليزية ممتازة كتابة وتحدثاً','HRIS Systems'],
    ben:['راتب USD دولي مميز','تأمين طبي دولي شامل','26 يوم إجازة سنوية','بيئة متعددة الثقافات']
  },
  {
    co:'undp', title:'مسؤول متابعة وتقييم M&E',
    field:'منظمات دولية', type:'عقد مؤقت', exp:'3-5 سنوات',
    loc:'رام الله', region:'ضفة', min:900, max:1300, cur:'$', feat:0, hoursAgo:200,
    desc:'UNDP يبحث عن مسؤول M&E لمتابعة مؤشرات أداء برامج التنمية وتقييم أثرها في المجتمعات الفلسطينية.',
    req:['خبرة M&E 3 سنوات','KoboToolbox أو أدوات مشابهة','SPSS أو R','إنجليزية ممتازة','تقارير للجهات المانحة'],
    ben:['راتب USD','تأمين دولي','سيارة ميدانية','بيئة أممية احترافية']
  },
  {
    co:'oxfam', title:'مدير مشروع PMP',
    field:'منظمات دولية', type:'عقد مؤقت', exp:'+5 سنوات',
    loc:'رام الله', region:'ضفة', min:1400, max:2200, cur:'$', feat:1, hoursAgo:240,
    desc:'أوكسفام تبحث عن مدير مشروع أول لقيادة برنامج تطوير اقتصادي بميزانية 2 مليون دولار في الضفة الغربية.',
    req:['PMP أو PRINCE2','5+ سنوات إدارة مشاريع دولية','إنجليزية ممتازة','Logical Framework','إدارة فريق ميداني'],
    ben:['راتب USD دولي مميز جداً','سيارة خدمة','تأمين طبي دولي','تدريب قيادي']
  },
  {
    co:'oxfam', title:'أخصائي مناصرة — Advocacy',
    field:'منظمات دولية', type:'عقد مؤقت', exp:'3-5 سنوات',
    loc:'القدس', region:'قدس', min:900, max:1400, cur:'$', feat:0, hoursAgo:288,
    desc:'مطلوب أخصائي مناصرة لتطوير مواقف سياسية ومواد مناصرة تتعلق بحقوق الشعب الفلسطيني والقضايا الإنسانية.',
    req:['خبرة مناصرة سياسية','كتابة تقارير Policy احترافية','إنجليزية ممتازة','فهم القانون الدولي الإنساني'],
    ben:['راتب دولي','تأمين طبي','سيارة ميدانية']
  },
  {
    co:'unrwa', title:'معلم رياضيات — مرحلة إعدادية',
    field:'تعليم', type:'دوام كامل', exp:'1-3 سنوات',
    loc:'رام الله', region:'ضفة', min:3800, max:5200, cur:'₪', feat:0, hoursAgo:320,
    desc:'الأونروا تعلن عن شواغر تدريسية في مدارس اللاجئين الفلسطينيين في محافظات الضفة الغربية.',
    req:['بكالوريوس تعليم رياضيات','دبلوم تأهيل تربوي','خبرة سنتين','التزام بمبادئ حقوق الإنسان'],
    ben:['نظام تقاعد أممي مميز','إجازات أممية كاملة','تطوير مهني مستمر']
  },
  {
    co:'unrwa', title:'مسؤول مشتريات — Procurement Officer',
    field:'منظمات دولية', type:'دوام كامل', exp:'3-5 سنوات',
    loc:'القدس', region:'قدس', min:900, max:1400, cur:'$', feat:0, hoursAgo:360,
    desc:'مطلوب مسؤول مشتريات لإدارة عمليات المناقصات والشراء وفق قواعد الأمم المتحدة الصارمة.',
    req:['CIPS أو شهادة مشتريات معتمدة','خبرة UN Procurement Rules','إنجليزية ممتازة','دقة عالية وانتباه للتفاصيل'],
    ben:['نظام أممي شامل','راتب USD مميز','بيئة دولية احترافية']
  },
  {
    co:'birzeit', title:'أستاذ مساعد — قسم علوم الحاسوب',
    field:'تعليم', type:'دوام كامل', exp:'+5 سنوات',
    loc:'بيرزيت', region:'ضفة', min:5500, max:8000, cur:'₪', feat:0, hoursAgo:400,
    desc:'تعلن جامعة بيرزيت عن شاغر أستاذ مساعد في قسم علوم الحاسوب للمساهمة في التدريس والبحث العلمي وإرشاد الطلاب.',
    req:['دكتوراه في علوم الحاسوب أو ذات صلة','تخصص AI أو Networks أو Security','أبحاث منشورة في مجلات محكّمة Q1/Q2','إنجليزية ممتازة'],
    ben:['مسار أكاديمي واضح','إجازة بحثية مدفوعة','تأمين طبي جامعي','مكانة أكاديمية مرموقة']
  },
  {
    co:'hospital', title:'طبيب طوارئ — دوام نوبات',
    field:'صحة', type:'دوام كامل', exp:'3-5 سنوات',
    loc:'رام الله', region:'ضفة', min:6000, max:9000, cur:'₪', feat:1, hoursAgo:12,
    desc:'مستشفى رام الله الحكومي يعلن عن شاغر طبيب طوارئ للعمل في قسم الطوارئ دوام متناوب 24/7. الفريق الطبي المتميز يضم أطباء من أعلى المستويات.',
    req:['دكتوراه طب','تخصص طوارئ أو إجازة Boards','خبرة 3+ سنوات طوارئ','ACLS وBLS معتمدة'],
    ben:['راتب تنافسي جداً','تأمين صحي حكومي شامل','بدل نوبات مرتفع','حوافز أداء']
  },
  {
    co:'hospital', title:'ممرضة أولى — وحدة ICU',
    field:'صحة', type:'دوام كامل', exp:'3-5 سنوات',
    loc:'رام الله', region:'ضفة', min:4000, max:5500, cur:'₪', feat:0, hoursAgo:24,
    desc:'مطلوبة ممرضة أولى للعمل في وحدة العناية المركزة ICU دوام متناوب. فرصة للعمل مع أفضل الكوادر الطبية.',
    req:['بكالوريوس تمريض','ترخيص نقابة التمريض الفلسطينية','خبرة 3+ سنوات ICU','BLS وACLS معتمدة'],
    ben:['بدل مواصلات','بدل نوبات','تأمين طبي حكومي','استقرار وظيفي']
  },
  {
    co:'jedco', title:'مهندس كهرباء — محطات تحويل',
    field:'هندسة', type:'دوام كامل', exp:'3-5 سنوات',
    loc:'القدس', region:'قدس', min:5000, max:7000, cur:'₪', feat:0, hoursAgo:48,
    desc:'شركة كهرباء القدس تبحث عن مهندس كهرباء للعمل في صيانة وتشغيل محطات التحويل الكهربائية وتطوير الشبكة.',
    req:['بكالوريوس هندسة كهرباء','خبرة High Voltage','AutoCAD Electrical','رخصة مزاولة مهنة سارية'],
    ben:['راتب ممتاز','استقرار وظيفي كامل','تأمين صحي وتقاعد']
  },
  {
    co:'masar', title:'مهندس مدني — بنية تحتية ومياه',
    field:'هندسة', type:'دوام كامل', exp:'3-5 سنوات',
    loc:'رام الله', region:'ضفة', min:4500, max:6500, cur:'₪', feat:0, hoursAgo:72,
    desc:'مطلوب مهندس مدني ذو خبرة في مشاريع البنية التحتية والمياه للإشراف الميداني على مشاريع كبيرة في الضفة الغربية.',
    req:['بكالوريوس هندسة مدنية','AutoCAD وCivil 3D','خبرة مشاريع مائية وطرق','رخصة قيادة سارية'],
    ben:['سيارة ميدانية','بدل سفر','بيئة مهنية']
  },
  {
    co:'remotely', title:'مطور Backend Python/FastAPI — Remote',
    field:'تكنولوجيا', type:'عمل عن بُعد', exp:'1-3 سنوات',
    loc:'عن بُعد', region:'remote', min:900, max:1400, cur:'$', feat:0, hoursAgo:96,
    desc:'فرصة للعمل من أي مكان مع شركة تقنية دولية. تطوير APIs وخدمات Backend لمنصة SaaS تخدم الشرق الأوسط وأوروبا.',
    req:['Python وFastAPI أو Django','PostgreSQL','Docker','REST APIs وOpenAPI'],
    ben:['راتب دولي بالدولار','كامل من البيت','دوام مرن','بيئة دولية متنوعة']
  },
  {
    co:'remotely', title:'كاتب محتوى تسويقي عربي/إنجليزي',
    field:'تسويق وإعلام', type:'فريلانس', exp:'1-3 سنوات',
    loc:'عن بُعد', region:'remote', min:700, max:1100, cur:'$', feat:0, hoursAgo:120,
    desc:'مطلوب كاتب محتوى ثنائي اللغة للعمل مع شركة دولية على محتوى تسويقي B2B وblog posts وحملات إعلانية.',
    req:['كتابة محتوى احترافية','SEO وKeyword Research','عربية وإنجليزية طلاقة كاملة','HubSpot أو ما يعادله'],
    ben:['دفع بالدولار','عمل كامل من البيت','جدول مرن جداً','فريق دولي محترف']
  }
];

// ═══════════════════════════════════════════════════════════════════
//  SEED
// ═══════════════════════════════════════════════════════════════════
async function seed() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // clear in safe order
    const tables = ['contact_messages','saved_jobs','applications','seeker_profiles','jobs','companies','users'];
    for (const t of tables) {
      try { await conn.query(`DELETE FROM ${t}`); } catch {}
    }
    console.log('🗑️  Cleared old data');

    // ── admin user
    await conn.query(
      `INSERT INTO users (id,email,password_hash,role,full_name,is_verified)
       VALUES (UUID(),'admin@foras.ps',?,'admin','مدير النظام',1)
       ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash)`,
      [HASH]
    );

    // ── seeker test
    await conn.query(
      `INSERT INTO users (id,email,password_hash,role,full_name,phone,is_verified)
       VALUES (UUID(),'seeker@test.ps',?,'seeker','أحمد محمود','+970599000001',1)
       ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash)`,
      [HASH]
    );
    const [[sk]] = await conn.query(`SELECT id FROM users WHERE email='seeker@test.ps'`);
    await conn.query(
      `INSERT INTO seeker_profiles (id,user_id,headline,skills,is_available)
       VALUES (UUID(),?,?,?,1)
       ON DUPLICATE KEY UPDATE headline=VALUES(headline)`,
      [sk.id, 'مطور برمجيات | React & Node.js', JSON.stringify(['React','Node.js','PostgreSQL','Docker'])]
    );

    // ── companies + their users
    const coIds = {};
    for (const co of COMPANIES) {
      await conn.query(
        `INSERT INTO users (id,email,password_hash,role,full_name,is_verified)
         VALUES (UUID(),?,?,'company',?,1)
         ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash)`,
        [co.email, HASH, co.name_ar]
      );
      const [[ur]] = await conn.query(`SELECT id FROM users WHERE email=?`, [co.email]);

      await conn.query(
        `INSERT INTO companies
           (id,user_id,name_ar,name_en,sector,size,founded_year,location,region,website,email,about_ar,color,is_verified)
         VALUES (UUID(),?,?,?,?,?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE name_ar=VALUES(name_ar)`,
        [ur.id, co.name_ar, co.name_en, co.sector, co.size, co.founded_year,
         co.location, co.region, co.website, co.email, co.about_ar, co.color, co.is_verified]
      );
      const [[cr]] = await conn.query(`SELECT id FROM companies WHERE user_id=?`, [ur.id]);
      coIds[co.id] = cr.id;
      console.log(`  ✅ ${co.name_ar}`);
    }

    // ── jobs
    const now = Date.now();
    let jobCount = 0;
    for (const j of JOBS) {
      const coId = coIds[j.co];
      if (!coId) { console.warn(`  ⚠️  Company not found: ${j.co}`); continue; }
      const ts = new Date(now - j.hoursAgo * 3600000).toISOString().slice(0,19).replace('T',' ');
      await conn.query(
        `INSERT INTO jobs
           (id,company_id,title,description,requirements,benefits,location,region,field,
            job_type,experience_level,salary_min,salary_max,salary_currency,salary_visible,
            is_featured,is_active,created_at,updated_at)
         VALUES (UUID(),?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,1,?,?)`,
        [coId, j.title, j.desc, JSON.stringify(j.req), JSON.stringify(j.ben),
         j.loc, j.region, j.field, j.type, j.exp,
         j.min, j.max, j.cur, j.feat, ts, ts]
      );
      jobCount++;
    }

    await conn.commit();
    console.log('');
    console.log('══════════════════════════════════════════════════');
    console.log('✅  Seed complete!');
    console.log(`    • ${COMPANIES.length} companies`);
    console.log(`    • ${jobCount} jobs`);
    console.log('');
    console.log('🔑  All accounts use password: password123');
    console.log('    admin   → admin@foras.ps');
    console.log('    seeker  → seeker@test.ps');
    COMPANIES.forEach(c => console.log(`    company → ${c.email}`));
    console.log('══════════════════════════════════════════════════');
  } catch (e) {
    await conn.rollback();
    console.error('❌ Seed failed:', e.message);
    process.exit(1);
  } finally {
    conn.release();
    await pool.end();
  }
}

seed();
