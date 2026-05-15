# 🌿 فُرص فلسطين — v2.0

منصة التوظيف الفلسطينية الأولى، مبنية بـ **React + TypeScript + Tailwind** للـ Frontend و **Node.js + Express + MySQL** للـ Backend.

---

## 📁 هيكل المشروع

```
foras_final/
├── backend/               ← Node.js + Express + MySQL
│   ├── config/
│   │   ├── db.js          ← اتصال MySQL Pool
│   │   ├── initDB.js      ← إنشاء الجداول
│   │   └── seed.js        ← بيانات أولية
│   ├── middleware/
│   │   ├── auth.js        ← JWT authentication
│   │   ├── validate.js    ← Joi validation
│   │   └── errorHandler.js← مركزي للأخطاء
│   ├── routes/
│   │   ├── auth.js        ← تسجيل دخول / إنشاء حساب
│   │   ├── jobs.js        ← CRUD الوظائف
│   │   ├── companies.js   ← CRUD الشركات
│   │   ├── applications.js← طلبات التوظيف
│   │   └── messages.js    ← رسائل التواصل
│   ├── swagger/
│   │   └── config.js      ← Swagger/OpenAPI docs
│   ├── tests/
│   │   └── e2e.test.js    ← اختبارات E2E شاملة
│   ├── server.js          ← نقطة الدخول
│   ├── .env               ← متغيرات البيئة
│   └── package.json
│
└── frontend/              ← React + TypeScript + Tailwind
    ├── src/
    │   ├── api/
    │   │   └── client.ts  ← HTTP client + AI integration
    │   ├── components/
    │   │   ├── layout/    ← Header
    │   │   ├── common/    ← Toaster
    │   │   ├── jobs/      ← JobCard, JobModal, FilterSidebar
    │   │   ├── companies/ ← CompanyCard, CompanyModal
    │   │   └── ai/        ← AiChat
    │   ├── context/
    │   │   └── AppContext.tsx  ← Global state
    │   ├── pages/
    │   │   ├── JobsPage.tsx
    │   │   ├── CompaniesPage.tsx
    │   │   ├── LoginPage.tsx
    │   │   └── DashboardPage.tsx
    │   ├── types/index.ts ← TypeScript interfaces
    │   ├── utils/helpers.ts
    │   ├── App.tsx
    │   └── main.tsx
    ├── index.html
    ├── vite.config.ts
    ├── tailwind.config.js
    └── package.json
```

---

## 🚀 تشغيل المشروع

### المتطلبات
- Node.js 18+
- MySQL 8+
- npm 9+

### 1. إعداد قاعدة البيانات

```bash
cd backend
cp .env.example .env     # عدّل بيانات MySQL
npm install
npm run init-db          # إنشاء الجداول
npm run seed             # بيانات تجريبية (اختياري)
```

### 2. تشغيل الـ Backend

```bash
cd backend
npm run dev              # يعمل على http://localhost:5000
```

### 3. تشغيل الـ Frontend

```bash
cd frontend
npm install
npm run dev              # يعمل على http://localhost:3000
```

---

## 📚 توثيق الـ API (Swagger)

بعد تشغيل الـ Backend افتح:
```
http://localhost:5000/api/docs
```

---

## 🔐 نظام الصلاحيات

| الدور      | الصلاحيات |
|-----------|----------|
| **admin** | كل شيء: إدارة الشركات، الوظائف، المستخدمين |
| **company** | نشر وتعديل وظائف شركتها فقط، رؤية طلباتها ورسائلها |
| **seeker** | التقدم للوظائف، عرض طلباته |
| **زائر** | عرض الوظائف والشركات، إرسال رسائل للشركات |

### حسابات تجريبية (بعد seed)
```
admin@foras.ps    / password123   ← أدمن
hr@jawwal.ps      / password123   ← شركة
```

---

## 🧪 تشغيل الاختبارات E2E

```bash
cd backend
npm install --save-dev jest supertest
npx jest tests/e2e.test.js --verbose
```

تغطي الاختبارات:
- ✅ تسجيل الدخول والمصادقة (JWT)
- ✅ نشر وظيفة وتعديلها وحذفها
- ✅ فلترة الوظائف
- ✅ تعديل بيانات الشركة
- ✅ التحقق من الصلاحيات (403/401)
- ✅ التقدم لوظيفة ومنع التكرار
- ✅ دورة حياة الطلب كاملة (pending→hired)
- ✅ إرسال رسائل وحذفها

---

## 🛡️ الأمان

- **JWT** لكل المسارات المحمية (7 أيام صلاحية)
- **Bcrypt** لتشفير كلمات السر (saltRounds=10)
- **Helmet** لـ security headers
- **CORS** محدود للـ origins المسموحة
- **Rate Limiting**: 200 req/15min عام، 10 req/15min للمصادقة
- **Joi Validation** للـ request body
- **SQL Injection** محمي بـ parameterized queries
- **Role-based Access Control** على كل endpoint

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | الوصف |
|--------|----------|-------|
| POST | `/api/auth/login` | تسجيل الدخول |
| POST | `/api/auth/register` | إنشاء حساب |
| GET | `/api/auth/me` | بيانات المستخدم الحالي 🔒 |

### Jobs
| Method | Endpoint | الوصف |
|--------|----------|-------|
| GET | `/api/jobs` | قائمة الوظائف (فلاتر) |
| GET | `/api/jobs/:id` | تفاصيل وظيفة |
| POST | `/api/jobs` | نشر وظيفة 🔒 company/admin |
| PUT | `/api/jobs/:id` | تعديل وظيفة 🔒 |
| DELETE | `/api/jobs/:id` | حذف وظيفة 🔒 |

### Companies
| Method | Endpoint | الوصف |
|--------|----------|-------|
| GET | `/api/companies` | قائمة الشركات |
| GET | `/api/companies/:id` | تفاصيل شركة + وظائفها |
| POST | `/api/companies` | إضافة شركة 🔒 admin |
| PUT | `/api/companies/:id` | تعديل شركة 🔒 |
| DELETE | `/api/companies/:id` | حذف شركة 🔒 admin |

### Applications
| Method | Endpoint | الوصف |
|--------|----------|-------|
| POST | `/api/applications` | التقدم لوظيفة 🔒 seeker |
| GET | `/api/applications/my` | طلباتي 🔒 seeker |
| GET | `/api/applications/company` | طلبات الشركة 🔒 company/admin |
| PUT | `/api/applications/:id/status` | تحديث حالة الطلب 🔒 company/admin |

### Messages
| Method | Endpoint | الوصف |
|--------|----------|-------|
| POST | `/api/messages` | إرسال رسالة (عام) |
| GET | `/api/messages/company` | رسائل الشركة 🔒 |
| PUT | `/api/messages/:id/read` | تحديد كمقروءة 🔒 |
| DELETE | `/api/messages/:id` | حذف رسالة 🔒 |

---

## 🛠️ التقنيات المستخدمة

### Backend
- **Express.js** — الإطار الرئيسي
- **MySQL2** — قاعدة البيانات مع Connection Pool
- **JWT** — المصادقة
- **Bcryptjs** — تشفير كلمات السر
- **Joi** — التحقق من المدخلات
- **Helmet** — أمان HTTP
- **Morgan** — تسجيل الطلبات
- **Swagger** — توثيق الـ API
- **Jest + Supertest** — اختبارات E2E

### Frontend
- **React 18** — الإطار
- **TypeScript** — typing قوي
- **Tailwind CSS** — التنسيق
- **Vite** — أداة البناء
- **Claude AI API** — المساعد الذكي
