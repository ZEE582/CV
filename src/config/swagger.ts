/**
 * @fileoverview Swagger / OpenAPI Configuration
 * @description Generates the OpenAPI 3.0 specification for the ttwar API.
 *              Served at GET /api-docs via swagger-ui-express.
 *
 *              To view docs:
 *                1. Start the server: npm run dev
 *                2. Open: http://localhost:3000/api-docs
 *
 *              JSDoc-style @swagger annotations in the route files are
 *              automatically picked up from ./src/routes/ *.ts
 *
 * @module config/swagger
 */

import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",

    info: {
      title: "ttwar — تتطور API",
      version: "1.0.0",
      description: `
## توثيق API لمنصة ttwar (تتطور)

### نظرة عامة على تدفق المصادقة

\`\`\`
[Signup / Login]
      │
      ▼
[Email verification code sent]
      │
      ▼
[POST /api/auth/verify-code]  ──► JWT token issued
      │
      ▼
  hasCompletedQuestions?
   No ──► POST /api/user/questions
   Yes ──► GET /api/user/profile  (main app)
\`\`\`

### المصادقة
جميع المسارات المحمية تتطلب توكن JWT في الـ header:
\`Authorization: Bearer <token>\`

### OAuth
يدعم Google و GitHub و LinkedIn عبر مسارات \`/api/auth/{provider}\`
      `,
      contact: {
        name: "ttwar Dev Team",
      },
    },

    servers: [
      {
        url: "http://localhost:3000",
        description: "Development Server",
      },
    ],

    // ── Reusable components ───────────────────────────────────────────────────
    components: {
      // Security scheme referenced by `security: [{ bearerAuth: [] }]` on routes
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "أدخل التوكن المستلم من /api/auth/verify-code بالصيغة: `Bearer <token>`",
        },
      },

      // Shared response schemas — referenced as $ref: '#/components/schemas/...'
      schemas: {
        // Generic error response
        Error: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "حدث خطأ في السيرفر",
            },
          },
        },

        // Full user object returned in most authenticated responses
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "64f1a2b3c4d5e6f7a8b9c0d1",
            },
            email: {
              type: "string",
              format: "email",
              example: "user@example.com",
            },
            name: {
              type: "string",
              example: "محمد أحمد",
            },
            avatar: {
              type: "string",
              format: "uri",
              example: "https://lh3.googleusercontent.com/...",
            },
            role: {
              type: "string",
              enum: ["student", "admin"],
              example: "student",
            },
            provider: {
              type: "string",
              enum: ["local", "google", "github", "linkedin"],
              example: "local",
            },
            hasCompletedQuestions: {
              type: "boolean",
              example: false,
              description:
                "إذا كانت false، يجب توجيه المستخدم إلى /questions بعد تسجيل الدخول",
            },
            onboardingData: {
              type: "object",
              description: "بيانات الاستبيان — فارغة حتى يُكمل المستخدم /questions",
              properties: {
                fullName: { type: "string", example: "محمد أحمد" },
                age: { type: "number", example: 22 },
                city: { type: "string", example: "رام الله" },
                university: { type: "string", example: "جامعة بيرزيت" },
                major: { type: "string", example: "هندسة البرمجيات" },
                programmingLanguages: {
                  type: "array",
                  items: { type: "string" },
                  example: ["JavaScript", "Python"],
                },
                jobTitle: { type: "string", example: "طالب جامعي" },
                experienceYears: { type: "string", example: "1-2 سنة" },
                lookingForJob: { type: "boolean", example: true },
                jobInterest: {
                  type: "string",
                  example: "تطوير الويب الكامل (Full Stack)",
                },
              },
            },
          },
        },
      },
    },

    // ── Tag groups (appear as sections in Swagger UI) ─────────────────────────
    tags: [
      {
        name: "Auth",
        description: "تسجيل الدخول، إنشاء الحساب، والتحقق عبر البريد الإلكتروني",
      },
      {
        name: "OAuth",
        description: "المصادقة عبر Google وGitHub وLinkedIn",
      },
      {
        name: "User",
        description: "إدارة البروفايل وبيانات الـ onboarding (تتطلب JWT)",
      },
    ],
  },

  // Glob pattern — swagger-jsdoc scans these files for @swagger annotations
  apis: ["./src/routes/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;