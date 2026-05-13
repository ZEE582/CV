/**
 * @file swagger/config.js
 * @description إعداد Swagger/OpenAPI لتوثيق الـ API
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '🌿 فُرص فلسطين API',
      version: '2.0.0',
      description: `
## منصة فُرص فلسطين — توثيق الـ API

منصة التوظيف الفلسطينية الأولى. تتيح للشركات نشر وظائفها وللباحثين التقدم لها.

### الأدوار المتاحة:
- **admin** - إدارة كاملة للمنصة
- **company** - نشر وإدارة وظائف الشركة
- **seeker** - البحث والتقدم للوظائف

### المصادقة:
جميع المسارات المحمية تتطلب \`Authorization: Bearer <token>\`
احصل على الـ token من \`POST /api/auth/login\`
      `,
      contact: { name: 'فُرص فلسطين', email: 'admin@foras.ps' }
    },
    servers: [
      { url: 'http://localhost:5000', description: 'بيئة التطوير' },
      { url: 'https://api.foras.ps', description: 'بيئة الإنتاج' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'أدخل الـ JWT token من endpoint تسجيل الدخول'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'رسالة الخطأ' },
            code:    { type: 'string', example: 'ERROR_CODE' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'تمت العملية بنجاح' }
          }
        },
        User: {
          type: 'object',
          properties: {
            id:        { type: 'string', format: 'uuid' },
            email:     { type: 'string', format: 'email' },
            role:      { type: 'string', enum: ['admin','company','seeker'] },
            full_name: { type: 'string' },
            companyId: { type: 'string', format: 'uuid', nullable: true }
          }
        },
        Job: {
          type: 'object',
          properties: {
            id:                { type: 'string', format: 'uuid' },
            company_id:        { type: 'string', format: 'uuid' },
            title:             { type: 'string' },
            description:       { type: 'string' },
            requirements:      { type: 'array', items: { type: 'string' } },
            benefits:          { type: 'array', items: { type: 'string' } },
            location:          { type: 'string' },
            region:            { type: 'string', enum: ['ضفة','قدس','غزة','48','remote'] },
            field:             { type: 'string' },
            job_type:          { type: 'string' },
            experience_level:  { type: 'string' },
            salary_min:        { type: 'integer', nullable: true },
            salary_max:        { type: 'integer', nullable: true },
            salary_currency:   { type: 'string', example: '₪' },
            salary_visible:    { type: 'boolean' },
            deadline:          { type: 'string', format: 'date', nullable: true },
            is_featured:       { type: 'boolean' },
            is_active:         { type: 'boolean' },
            views_count:       { type: 'integer' },
            applications_count:{ type: 'integer' },
            created_at:        { type: 'string', format: 'date-time' },
            company_name:      { type: 'string' },
            company_verified:  { type: 'boolean' },
            color:             { type: 'string' }
          }
        },
        Company: {
          type: 'object',
          properties: {
            id:           { type: 'string', format: 'uuid' },
            name_ar:      { type: 'string' },
            name_en:      { type: 'string', nullable: true },
            sector:       { type: 'string' },
            size:         { type: 'string' },
            location:     { type: 'string' },
            region:       { type: 'string' },
            website:      { type: 'string', nullable: true },
            email:        { type: 'string', nullable: true },
            about_ar:     { type: 'string' },
            color:        { type: 'string' },
            is_verified:  { type: 'boolean' },
            jobs_count:   { type: 'integer' },
            views_count:  { type: 'integer' }
          }
        },
        Application: {
          type: 'object',
          properties: {
            id:           { type: 'string', format: 'uuid' },
            job_id:       { type: 'string', format: 'uuid' },
            user_id:      { type: 'string', format: 'uuid' },
            company_id:   { type: 'string', format: 'uuid' },
            cover_letter: { type: 'string', nullable: true },
            cv_url:       { type: 'string', nullable: true },
            status:       { type: 'string', enum: ['pending','viewed','shortlisted','rejected','hired'] },
            applied_at:   { type: 'string', format: 'date-time' }
          }
        },
        Message: {
          type: 'object',
          properties: {
            id:           { type: 'string', format: 'uuid' },
            company_id:   { type: 'string', format: 'uuid' },
            sender_name:  { type: 'string' },
            sender_email: { type: 'string' },
            sender_phone: { type: 'string', nullable: true },
            subject:      { type: 'string' },
            message:      { type: 'string' },
            is_read:      { type: 'boolean' },
            created_at:   { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;
