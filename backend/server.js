/**
 * @file server.js
 * @description نقطة دخول الخادم الرئيسية
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const swaggerUi  = require('swagger-ui-express');

const { connectDB }     = require('./config/db');
const swaggerSpec       = require('./swagger/config');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// ── Security ──────────────────────────────────────────────────
app.use(helmet({ crossOriginEmbedderPolicy: false, contentSecurityPolicy: false }));

// ── CORS ──────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: (origin, cb) => (!origin || allowedOrigins.includes(origin)) ? cb(null, true) : cb(new Error('Not allowed by CORS')),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ── Rate Limit ────────────────────────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'طلبات كثيرة جداً، يرجى المحاولة لاحقاً', code: 'RATE_LIMIT_EXCEEDED' }
}));

// ── Parsing & Logging ─────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Swagger ───────────────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Ttwar API Docs',
  customCss: '.swagger-ui .topbar { background: #5b4ff6; } .swagger-ui .topbar-wrapper img { display: none; } .swagger-ui .topbar-wrapper::after { content: "🤖 Ttwar API"; color: white; font-size: 18px; font-weight: bold; }',
  swaggerOptions: { persistAuthorization: true }
}));

// ── Routes ────────────────────────────────────────────────────
app.use('/api/jobs',      require('./routes/jobs'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/messages',  require('./routes/messages'));
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/ai',        require('./routes/ai'));

// ── Health ────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({
  success: true, status: 'healthy',
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'development',
  version: '2.0.0'
}));
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'مرحباً بك في Ttwar API',
    docs: 'http://localhost:5000/api/docs',
    jobs: 'http://localhost:5000/api/jobs',
    companies: 'http://localhost:5000/api/companies'
  });
});
app.use(notFound);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║        🤖 Ttwar Server v2.0 Running         ║');
    console.log(`║  🌐 http://localhost:${PORT}                     ║`);
    console.log('║  📚 Swagger: /api/docs                      ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log('');
  });
});

module.exports = app;
