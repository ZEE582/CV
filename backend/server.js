/**
 * @file server.js
 * @description نقطة دخول الخادم الرئيسية
 * @author Ttwar Team
 */

require('dotenv').config({
  path: require('path').join(__dirname, '.env')
});

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = require('./swagger/config');

const {
  errorHandler,
  notFound
} = require('./middleware/errorHandler');

const app = express();

/* ─────────────────────────────────────────────────────────────
 * Security Headers
 * ───────────────────────────────────────────────────────────── */
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false
  })
);

/* ─────────────────────────────────────────────────────────────
 * CORS Configuration
 * ───────────────────────────────────────────────────────────── */
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // السماح لـ Postman والمتصفح المحلي
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },

    credentials: true,

    // دعم جميع الـ methods
    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS'
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization'
    ]
  })
);

/* ─────────────────────────────────────────────────────────────
 * Rate Limiting
 * ───────────────────────────────────────────────────────────── */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 200,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message:
      'طلبات كثيرة جداً، يرجى المحاولة لاحقاً',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

app.use(generalLimiter);

/* ─────────────────────────────────────────────────────────────
 * Request Parsing
 * ───────────────────────────────────────────────────────────── */
app.use(
  express.json({
    limit: '10mb'
  })
);

app.use(
  express.urlencoded({
    extended: true
  })
);

/* ─────────────────────────────────────────────────────────────
 * HTTP Request Logging
 * ───────────────────────────────────────────────────────────── */
app.use(
  morgan(
    process.env.NODE_ENV === 'production'
      ? 'combined'
      : 'dev'
  )
);

/* ─────────────────────────────────────────────────────────────
 * Swagger API Documentation
 * ───────────────────────────────────────────────────────────── */
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Ttwar API Docs',

    customCss: `
      .swagger-ui .topbar {
        background: #5b4ff6;
      }

      .swagger-ui .topbar-wrapper img {
        display: none;
      }

      .swagger-ui .topbar-wrapper::after {
        content: '🤖 Ttwar API';
        color: white;
        font-size: 18px;
        font-weight: bold;
      }
    `,

    swaggerOptions: {
      persistAuthorization: true
    }
  })
);

/* ─────────────────────────────────────────────────────────────
 * API Routes
 * ───────────────────────────────────────────────────────────── */

// الوظائف
app.use(
  '/api/jobs',
  require('./routes/jobs')
);

// الشركات
app.use(
  '/api/companies',
  require('./routes/companies')
);

// الرسائل
app.use(
  '/api/messages',
  require('./routes/messages')
);

// المصادقة
app.use(
  '/api/auth',
  require('./routes/auth')
);

// المساعد الذكي
app.use(
  '/api/ai',
  require('./routes/ai')
);

/* ─────────────────────────────────────────────────────────────
 * Health Check
 * ───────────────────────────────────────────────────────────── */

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: فحص حالة الخادم
 */

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: فحص حالة الخادم
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: الخادم يعمل بشكل طبيعي
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 status:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                 environment:
 *                   type: string
 *                 version:
 *                   type: string
 */
app.get('/api/health', (_req, res) => {
  return res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment:
      process.env.NODE_ENV || 'development',
    version: '2.0.0'
  });
});

/* ─────────────────────────────────────────────────────────────
 * 404 Handler
 * ───────────────────────────────────────────────────────────── */
app.use(notFound);

/* ─────────────────────────────────────────────────────────────
 * Global Error Handler
 * ───────────────────────────────────────────────────────────── */
app.use(errorHandler);

/* ─────────────────────────────────────────────────────────────
 * Start Server
 * ───────────────────────────────────────────────────────────── */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('');
  console.log(
    '╔══════════════════════════════════════════════╗'
  );
  console.log(
    '║        🤖 Ttwar Server v2.0 Running         ║'
  );
  console.log(
    `║  🌐 http://localhost:${PORT}                     ║`
  );
  console.log(
    `║  📚 Swagger: /api/docs                     ║`
  );
  console.log(
    '╚══════════════════════════════════════════════╝'
  );
  console.log('');
});

module.exports = app;