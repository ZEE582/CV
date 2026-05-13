/**
 * @file server.js
 * @description نقطة دخول الخادم الرئيسية
 * المسارات المتاحة: jobs، companies، messages (POST عام فقط)
 * ملاحظة: auth، applications، dashboard routes محذوفة — ستُضاف مع الداشبورد
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');
const swaggerUi   = require('swagger-ui-express');
const swaggerSpec = require('./swagger/config');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// ── Security Headers ──────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'طلبات كثيرة جداً، يرجى المحاولة بعد 15 دقيقة',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

app.use(generalLimiter);

// ── Request Parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── HTTP Request Logging ──────────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/jobs',      require('./routes/jobs'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/messages',  require('./routes/messages'));  // POST عام فقط (إرسال رسالة لشركة)

// ── Health Check ──────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: فحص صحة الخادم
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: الخادم يعمل بشكل طبيعي
 */
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0'
  });
});

// ── Swagger API Documentation ─────────────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'فُرص فلسطين - API Docs',
  customCss: `
    .swagger-ui .topbar { background: #0d5c30; }
    .swagger-ui .topbar-wrapper img { display: none; }
    .swagger-ui .topbar-wrapper::after { content: '🌿 فُرص فلسطين API'; color: white; font-size: 18px; font-weight: bold; }
  `,
  swaggerOptions: { persistAuthorization: true }
}));

// ── Error Handlers ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  🌿  فُرص فلسطين  — Server v2.0             ║');
  console.log(`║  http://localhost:${PORT}                       ║`);
  console.log(`║  📚 Swagger: http://localhost:${PORT}/api/docs  ║`);
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
});

module.exports = app;
