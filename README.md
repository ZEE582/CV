# 🤖 منصة تطور — المشروع الموحد

## هيكل المشروع

```
ttwar/
├── backend/                    ← سيرفر Node.js موحد (Port: 5000)
│   ├── server.js               ← نقطة الدخول الوحيدة لجميع الصفحات
│   ├── .env                    ← متغيرات البيئة
│   ├── config/
│   │   ├── db.js               ← اتصال MongoDB
│   │   ├── jwtConfig.js        ← إعداد JWT الموحد
│   │   ├── seed.js             ← بيانات أولية (أدمن + شركات)
│   │   └── companies.json      ← بيانات الشركات الأولية
│   ├── models/                 ← نماذج MongoDB الموحدة
│   │   ├── User.js             ← المستخدمون (seeker/company/admin)
│   │   ├── Company.js          ← الشركات
│   │   ├── Job.js              ← الوظائف
│   │   ├── Application.js      ← التقديمات على الوظائف
│   │   ├── SavedJob.js         ← الوظائف المحفوظة
│   │   ├── ContactMessage.js   ← رسائل التواصل
│   │   └── CV.js               ← السير الذاتية
│   ├── controllers/            ← منطق الأعمال
│   │   ├── authController.js   ← تسجيل | دخول | إنشاء حساب شركة
│   │   ├── jobsController.js   ← إدارة الوظائف
│   │   ├── companiesController.js ← إدارة الشركات
│   │   ├── cvController.js     ← CV Builder
│   │   ├── savedJobsController.js ← الوظائف المحفوظة
│   │   ├── applicationsController.js ← التقديمات
│   │   └── adminController.js  ← لوحة التحكم
│   ├── middleware/
│   │   ├── auth.js             ← authenticate | optionalAuth | requireRole
│   │   ├── validate.js         ← Joi validation schemas
│   │   └── errorHandler.js     ← معالج الأخطاء
│   ├── routes/                 ← جميع مسارات API
│   │   ├── auth.js             → /api/auth
│   │   ├── jobs.js             → /api/jobs
│   │   ├── companies.js        → /api/companies
│   │   ├── messages.js         → /api/messages
│   │   ├── ai.js               → /api/ai
│   │   ├── cv.js               → /api/cv
│   │   ├── applications.js     → /api/applications
│   │   ├── savedJobs.js        → /api/saved-jobs
│   │   └── admin.js            → /api/admin
│   └── swagger/
│       └── config.js           ← Swagger موحد لكامل API
│
└── frontend/                   ← React + Vite + TypeScript (Port: 5173)
    ├── src/
    │   ├── App.tsx             ← التطبيق الرئيسي
    │   ├── main.tsx
    │   ├── api/client.ts       ← دوال API الموحدة
    │   ├── context/AppContext.tsx ← Global State
    │   ├── pages/
    │   │   ├── JobsPage.tsx    ← صفحة الوظائف
    │   │   ├── CompanyPage.tsx ← صفحة الشركة
    │   │   └── CVBuilderPage.tsx ← CV Builder
    │   ├── components/
    │   │   ├── layout/         ← Header | NavLinks | SearchBar | Logo
    │   │   ├── jobs/           ← JobCard | FilterSidebar | SortBar
    │   │   ├── company/        ← CompanyHero | JobsGrid | JobDetail | ContactForm
    │   │   ├── cv/             ← CVTemplates | CVStepForms | CVPreviewStep
    │   │   ├── ai/             ← AiChat
    │   │   └── common/         ← Spinner | EmptyState | Toaster | Tag
    │   └── types/index.ts      ← TypeScript types
    └── vite.config.ts          ← Proxy → localhost:5000
```

---

## 🚀 التشغيل

### Backend

```bash
cd backend
npm install
# أول مرة — إنشاء الأدمن وبيانات الشركات:
npm run seed
# تطوير:
npm run dev
# إنتاج:
npm start
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🔐 الصلاحيات

| الدور | الحصول عليه | الصلاحيات |
|-------|-------------|-----------|
| **seeker** | تسجيل ذاتي `/api/auth/register` | تصفح الوظائف، التقديم، CV، حفظ وظائف |
| **company** | الأدمن ينشئه بإيميل وكلمة مرور محددَيْن `/api/auth/company-account` | نشر/تعديل وظائف، قراءة التقديمات، تعديل بيانات شركتهم |
| **admin** | seed أو يدوياً في DB | كل شيء + لوحة التحكم الكاملة |

---

## 📡 API Endpoints الموحدة

| Endpoint | الوصف |
|----------|-------|
| `GET /api/docs` | Swagger UI — توثيق كامل لجميع المسارات |
| `POST /api/auth/register` | تسجيل مستخدم جديد |
| `POST /api/auth/login` | تسجيل الدخول |
| `POST /api/auth/company-account` | إنشاء حساب شركة (admin) |
| `GET /api/jobs` | قائمة الوظائف مع فلترة |
| `GET /api/companies` | قائمة الشركات |
| `GET /api/companies/:id` | تفاصيل شركة + وظائفها |
| `POST /api/messages` | إرسال رسالة لشركة |
| `POST /api/ai/chat` | المساعد الذكي |
| `POST /api/cv` | حفظ السيرة الذاتية |
| `POST /api/applications` | التقديم على وظيفة |
| `GET /api/admin/stats` | إحصائيات لوحة التحكم |

---

## 🗄️ قاعدة البيانات (MongoDB)

**اسم القاعدة:** `ttwar`

| Collection | الوصف |
|------------|-------|
| `users` | جميع المستخدمين (seeker/company/admin) |
| `companies` | الشركات |
| `jobs` | الوظائف |
| `applications` | التقديمات على الوظائف |
| `savedjobs` | الوظائف المحفوظة |
| `contactmessages` | رسائل التواصل |
| `cvs` | السير الذاتية |
