/**
 * @file server.js
 * @description سيرفر منصة تطور الموحد — يشغّل جميع صفحات الموقع من نقطة واحدة
 *
 * الصفحات المشمولة:
 *  - صفحة الوظائف         /api/jobs
 *  - صفحة الشركة          /api/companies
 *  - تسجيل الدخول/التسجيل /api/auth
 *  - رسائل التواصل         /api/messages
 *  - المساعد الذكي         /api/ai
 *  - CV Builder            /api/cv
 *  - التقديم على الوظائف   /api/applications
 *  - الوظائف المحفوظة      /api/saved-jobs
 *  - لوحة التحكم (أدمن)   /api/admin
 *  - توثيق Swagger الموحد  /api/docs
 *
 * بدون helmet | بدون health endpoint
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express    = require('express');
const cors       = require('cors');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const swaggerUi  = require('swagger-ui-express');

const { connectDB }              = require('./config/db');
const swaggerSpec                = require('./swagger/config');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// ─────────────────────────────────────────────────────────────
// CORS
// ─────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials:    true,
  methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─────────────────────────────────────────────────────────────
// Rate Limiting
// ─────────────────────────────────────────────────────────────
app.use(rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             300,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: 'طلبات كثيرة جداً، يرجى المحاولة لاحقاً',
    code:    'RATE_LIMIT_EXCEEDED',
  },
}));

// ─────────────────────────────────────────────────────────────
// Parsing & Logging
// ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─────────────────────────────────────────────────────────────
// Swagger الموحد لكامل المنصة — ملف واحد لجميع الصفحات
// ─────────────────────────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Ttwar — توثيق API الموحد',
  customCss: `
    .swagger-ui .topbar { background: linear-gradient(135deg, #1a7a4a 0%, #5b4ff6 100%); }
    .swagger-ui .topbar-wrapper img { display: none; }
    .swagger-ui .topbar-wrapper::after {
      content: "🤖 منصة تطور — API الموحد";
      color: white; font-size: 18px; font-weight: bold;
    }
  `,
  swaggerOptions: { persistAuthorization: true },
}));

// ─────────────────────────────────────────────────────────────
// Routes الموحدة — جميع صفحات المنصة
// ─────────────────────────────────────────────────────────────

// صفحة تسجيل الدخول/التسجيل | إنشاء حساب شركة (admin) | بيانات المستخدم
app.use('/api/auth',         require('./routes/auth'));

// صفحة الوظائف | تفاصيل وظيفة | إدارة وظائف الشركة | لوحة تحكم الأدمن
app.use('/api/jobs',         require('./routes/jobs'));

// قائمة الشركات | صفحة شركة | إدارة الشركات
app.use('/api/companies',    require('./routes/companies'));

// إرسال رسالة لشركة | قراءة الرسائل (company/admin)
app.use('/api/messages',     require('./routes/messages'));

// المساعد الذكي (Groq AI) — عام بدون توكن إلزامي
app.use('/api/ai',           require('./routes/ai'));

// بناء السيرة الذاتية (CV Builder) — يتطلب تسجيل الدخول
app.use('/api/cv',           require('./routes/cv'));

// التقديم على الوظائف — seeker | تحديث الحالة: company/admin
app.use('/api/applications', require('./routes/applications'));

// الوظائف المحفوظة — يتطلب تسجيل الدخول
app.use('/api/saved-jobs',   require('./routes/savedJobs'));

// لوحة تحكم الأدمن — admin فقط لجميع المسارات
app.use('/api/admin',        require('./routes/admin'));

// ─────────────────────────────────────────────────────────────
// 404 & معالج الأخطاء العام
// ─────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─────────────────────────────────────────────────────────────
// تشغيل السيرفر بعد الاتصال بقاعدة البيانات
// ─────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '5000', 10);

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log('');
      console.log('╔══════════════════════════════════════════════════════╗');
      console.log('║        🤖  منصة تطور — السيرفر الموحد v2.0           ║');
      console.log(`║  🌐  http://localhost:${PORT}                           ║`);
      console.log('║  📚  Swagger Docs:   /api/docs                       ║');
      console.log('╠══════════════════════════════════════════════════════╣');
      console.log('║  🔐  Auth:           /api/auth                       ║');
      console.log('║  💼  Jobs:           /api/jobs                       ║');
      console.log('║  🏢  Companies:      /api/companies                  ║');
      console.log('║  📩  Messages:       /api/messages                   ║');
      console.log('║  🤖  AI Chat:        /api/ai                         ║');
      console.log('║  📄  CV Builder:     /api/cv                         ║');
      console.log('║  📋  Applications:   /api/applications               ║');
      console.log('║  🔖  Saved Jobs:     /api/saved-jobs                 ║');
      console.log('║  ⚙️   Admin:          /api/admin                      ║');
      console.log('╚══════════════════════════════════════════════════════╝');
      console.log('');
    });
  })
  .catch((err) => {
    console.error('❌ فشل الاتصال بقاعدة البيانات:', err.message);
    process.exit(1);
  });

module.exports = app;
