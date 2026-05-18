/**
 * @file swagger/config.js
 * @description Swagger الموحد لكامل منصة تطور — ملف واحد لجميع الصفحات
 *
 * يشمل جميع المسارات:
 *  Auth | Jobs | Companies | Messages | AI | CV | Applications | SavedJobs | Admin
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '🤖 منصة تطور — API الموحد',
      version: '2.0.0',
      description: `
## منصة تطور — توثيق API الموحد لجميع الصفحات

منصة التوظيف التقنية الفلسطينية. سيرفر واحد يخدم جميع صفحات الموقع.

---

### 🔐 الأدوار والصلاحيات

| الدور | الوصف | كيفية الحصول عليه |
|-------|-------|-------------------|
| **seeker** | باحث عن عمل (الافتراضي) | \`POST /api/auth/register\` |
| **company** | مدير شركة | الأدمن ينشئه عبر \`POST /api/auth/company-account\` بإيميل وكلمة مرور محددَيْن |
| **admin** | مدير المنصة | يُضاف يدوياً في قاعدة البيانات أو بـ seed |

---

### 📄 خريطة الصفحات والمسارات

| الصفحة | المسارات | الصلاحيات |
|--------|---------|------------|
| تسجيل / دخول | \`/api/auth/*\` | عام |
| صفحة الوظائف | \`/api/jobs\` | قراءة: عام \| نشر/تعديل: company/admin |
| صفحة الشركة | \`/api/companies/:id\`, \`/api/jobs\` | عام |
| قائمة الشركات | \`/api/companies\` | عام |
| المساعد الذكي | \`/api/ai/chat\` | عام |
| التواصل مع شركة | \`/api/messages\` | إرسال: عام \| قراءة: company/admin |
| CV Builder | \`/api/cv\` | يتطلب تسجيل الدخول |
| التقديم على وظائف | \`/api/applications\` | seeker: تقديم \| company/admin: إدارة |
| الوظائف المحفوظة | \`/api/saved-jobs\` | يتطلب تسجيل الدخول |
| لوحة التحكم | \`/api/admin\` | admin فقط |

---

### 🔑 كيفية المصادقة
1. سجّل دخولك: \`POST /api/auth/login\`
2. انسخ الـ \`token\` من الرد
3. اضغط **Authorize** أعلاه والصق: \`Bearer <token>\`
      `,
      contact: { name: 'منصة تطور', email: 'admin@ttwar.ps' },
    },
    servers: [
      { url: 'http://localhost:5000', description: 'بيئة التطوير المحلية' },
      { url: 'https://api.ttwar.ps',  description: 'بيئة الإنتاج' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type:          'http',
          scheme:        'bearer',
          bearerFormat:  'JWT',
          description:   'JWT من /api/auth/login — ضعه هنا بدون كلمة Bearer',
        },
      },
      schemas: {

        // ── Shared ──────────────────────────────────────────
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string',  example: 'رسالة الخطأ' },
            code:    { type: 'string',  example: 'ERROR_CODE' },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string',  example: 'تمت العملية بنجاح' },
          },
        },

        // ── User ────────────────────────────────────────────
        User: {
          type: 'object',
          properties: {
            id:         { type: 'string', example: '64f1...' },
            email:      { type: 'string', format: 'email' },
            role:       { type: 'string', enum: ['seeker', 'company', 'admin'] },
            full_name:  { type: 'string' },
            phone:      { type: 'string', nullable: true },
            avatar_url: { type: 'string', nullable: true },
            is_active:  { type: 'boolean' },
            company_id: { type: 'string', nullable: true, description: 'موجود فقط لدور company' },
            createdAt:  { type: 'string', format: 'date-time' },
          },
        },

        // ── Job ─────────────────────────────────────────────
        Job: {
          type: 'object',
          properties: {
            _id:                { type: 'string' },
            company_id:         { type: 'string' },
            title:              { type: 'string' },
            description:        { type: 'string' },
            requirements:       { type: 'array', items: { type: 'string' } },
            benefits:           { type: 'array', items: { type: 'string' } },
            location:           { type: 'string' },
            region:             { type: 'string', enum: ['ضفة', 'قدس', 'غزة', '48', 'remote'] },
            field:              { type: 'string' },
            job_type:           { type: 'string', enum: ['دوام كامل', 'دوام جزئي', 'عقد مؤقت', 'عمل عن بُعد', 'فريلانس', 'تدريب مدفوع'] },
            experience_level:   { type: 'string', enum: ['حديث التخرج', '1-3 سنوات', '3-5 سنوات', '+5 سنوات', 'قيادي'] },
            salary_min:         { type: 'integer', nullable: true },
            salary_max:         { type: 'integer', nullable: true },
            salary_currency:    { type: 'string', example: '₪' },
            salary_visible:     { type: 'boolean' },
            deadline:           { type: 'string', format: 'date', nullable: true },
            is_featured:        { type: 'boolean' },
            is_active:          { type: 'boolean' },
            views_count:        { type: 'integer' },
            applications_count: { type: 'integer' },
            company_name:       { type: 'string' },
            company_verified:   { type: 'boolean' },
            color:              { type: 'string' },
            logo_url:           { type: 'string', nullable: true },
            createdAt:          { type: 'string', format: 'date-time' },
          },
        },
        JobInput: {
          type: 'object',
          required: ['title', 'description'],
          properties: {
            title:            { type: 'string', minLength: 3, maxLength: 300 },
            description:      { type: 'string', minLength: 20 },
            requirements:     { type: 'array',  items: { type: 'string' } },
            benefits:         { type: 'array',  items: { type: 'string' } },
            location:         { type: 'string' },
            region:           { type: 'string', enum: ['ضفة', 'قدس', 'غزة', '48', 'remote'] },
            field:            { type: 'string', enum: ['تكنولوجيا', 'مالية وبنوك', 'اتصالات', 'منظمات دولية', 'تعليم', 'صحة', 'هندسة', 'تسويق وإعلام'] },
            job_type:         { type: 'string', enum: ['دوام كامل', 'دوام جزئي', 'عقد مؤقت', 'عمل عن بُعد', 'فريلانس', 'تدريب مدفوع'] },
            experience_level: { type: 'string', enum: ['حديث التخرج', '1-3 سنوات', '3-5 سنوات', '+5 سنوات', 'قيادي'] },
            salary_min:       { type: 'integer', minimum: 0 },
            salary_max:       { type: 'integer', minimum: 0 },
            salary_currency:  { type: 'string',  enum: ['₪', '$', '€', 'JD'], default: '₪' },
            salary_visible:   { type: 'boolean', default: true },
            deadline:         { type: 'string',  format: 'date' },
            is_featured:      { type: 'boolean', default: false },
            company_id:       { type: 'string',  description: 'مطلوب فقط إن كان الأدمن ينشر الوظيفة' },
          },
        },

        // ── Company ─────────────────────────────────────────
        Company: {
          type: 'object',
          properties: {
            _id:          { type: 'string' },
            user_id:      { type: 'string', nullable: true },
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
            is_active:    { type: 'boolean' },
            jobs_count:   { type: 'integer' },
            views_count:  { type: 'integer' },
            logo_url:     { type: 'string', nullable: true },
            cover_url:    { type: 'string', nullable: true },
            createdAt:    { type: 'string', format: 'date-time' },
          },
        },
        CompanyInput: {
          type: 'object',
          required: ['name_ar', 'about_ar'],
          properties: {
            name_ar:      { type: 'string', minLength: 2, maxLength: 200 },
            name_en:      { type: 'string' },
            sector:       { type: 'string' },
            size:         { type: 'string' },
            founded_year: { type: 'integer', minimum: 1900 },
            location:     { type: 'string' },
            region:       { type: 'string', enum: ['ضفة', 'قدس', 'غزة', '48', 'remote'] },
            website:      { type: 'string', format: 'uri' },
            email:        { type: 'string', format: 'email' },
            about_ar:     { type: 'string', minLength: 10 },
            about_en:     { type: 'string' },
            color:        { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
            logo_url:     { type: 'string' },
            cover_url:    { type: 'string' },
            linkedin_url: { type: 'string', format: 'uri' },
            user_id:      { type: 'string', description: 'ربط بحساب مستخدم company' },
          },
        },

        // ── Application ─────────────────────────────────────
        Application: {
          type: 'object',
          properties: {
            _id:          { type: 'string' },
            job_id:       { type: 'string' },
            user_id:      { type: 'string' },
            company_id:   { type: 'string' },
            cover_letter: { type: 'string', nullable: true },
            cv_url:       { type: 'string', nullable: true },
            status:       { type: 'string', enum: ['pending', 'viewed', 'shortlisted', 'rejected', 'hired'] },
            createdAt:    { type: 'string', format: 'date-time' },
          },
        },

        // ── CV ───────────────────────────────────────────────
        CVInput: {
          type: 'object',
          properties: {
            template: { type: 'string', description: 'اسم القالب: classic | modern | minimal' },
            summary:  { type: 'string' },
            personal_info: {
              type: 'object',
              properties: {
                full_name:  { type: 'string' },
                email:      { type: 'string', format: 'email' },
                phone:      { type: 'string' },
                location:   { type: 'string' },
                linkedin:   { type: 'string', format: 'uri' },
                github:     { type: 'string', format: 'uri' },
                website:    { type: 'string', format: 'uri' },
                avatar_url: { type: 'string' },
              },
            },
            education: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  degree:      { type: 'string' },
                  institution: { type: 'string' },
                  field:       { type: 'string' },
                  start_year:  { type: 'integer' },
                  end_year:    { type: 'integer' },
                  description: { type: 'string' },
                },
              },
            },
            experience: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title:       { type: 'string' },
                  company:     { type: 'string' },
                  location:    { type: 'string' },
                  start_date:  { type: 'string' },
                  end_date:    { type: 'string' },
                  is_current:  { type: 'boolean' },
                  description: { type: 'string' },
                },
              },
            },
            skills: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name:  { type: 'string' },
                  level: { type: 'string', enum: ['مبتدئ', 'متوسط', 'متقدم', 'خبير'] },
                },
              },
            },
            languages: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name:  { type: 'string' },
                  level: { type: 'string', enum: ['أساسي', 'متوسط', 'جيد', 'ممتاز', 'اللغة الأم'] },
                },
              },
            },
          },
        },

        // ── Message ─────────────────────────────────────────
        Message: {
          type: 'object',
          properties: {
            _id:          { type: 'string' },
            company_id:   { type: 'string' },
            sender_name:  { type: 'string' },
            sender_email: { type: 'string' },
            sender_phone: { type: 'string', nullable: true },
            subject:      { type: 'string' },
            message:      { type: 'string' },
            is_read:      { type: 'boolean' },
            createdAt:    { type: 'string', format: 'date-time' },
          },
        },

        // ── Admin Stats ─────────────────────────────────────
        AdminStats: {
          type: 'object',
          properties: {
            totalUsers:          { type: 'integer' },
            totalCompanies:      { type: 'integer' },
            totalJobs:           { type: 'integer' },
            totalApplications:   { type: 'integer' },
            totalMessages:       { type: 'integer' },
            activeJobs:          { type: 'integer' },
            verifiedCompanies:   { type: 'integer' },
            pendingApplications: { type: 'integer' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;
