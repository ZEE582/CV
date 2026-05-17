# 🤖 تطوّر (ttwar) v2.0 — منصة فُرص التقنية الفلسطينية

## 🚀 تشغيل سريع

```bash
# 1. Backend
cd backend
npm install
node config/seed.js   # يضيف 43 شركة + وظائف
npm run dev           # http://localhost:5000

# 2. Frontend
cd frontend
npm install
npm run dev           # http://localhost:5173

# 3. Tests
cd backend
npm test
```

**Admin:** `admin@ttwar.ps` / `admin123`  
**Swagger:** `http://localhost:5000/api/docs`

---

## 📁 هيكل المشروع

```
ttwar-v2/
├── backend/
│   ├── config/
│   │   ├── db.js          # اتصال MongoDB
│   │   ├── seed.js        # 43 شركة + وظائف (72 سطر)
│   │   └── companies.json # بيانات الشركات الفلسطينية
│   ├── controllers/       # منطق مستخلص للـ E2E
│   │   ├── authController.js
│   │   ├── jobsController.js
│   │   └── companiesController.js
│   ├── middleware/
│   │   ├── auth.js        # JWT + roles
│   │   ├── validate.js    # Joi schemas
│   │   └── errorHandler.js
│   ├── models/            # Mongoose schemas
│   │   ├── User.js · Company.js · Job.js
│   │   ├── Application.js · SavedJob.js
│   │   └── ContactMessage.js
│   ├── routes/
│   │   ├── auth.js · jobs.js · companies.js
│   │   ├── messages.js · ai.js
│   ├── tests/             # Jest E2E
│   │   ├── helpers/testSetup.js
│   │   ├── auth.test.js · jobs.test.js
│   │   ├── companies.test.js · messages.test.js
│   │   └── health.test.js
│   └── server.js
│
└── frontend/src/
    ├── api/client.ts
    ├── context/AppContext.tsx
    ├── types/index.ts
    ├── utils/helpers.ts
    ├── components/
    │   ├── layout/
    │   │   ├── Header.tsx   SearchBar.tsx
    │   │   ├── Logo.tsx     NavLinks.tsx
    │   ├── jobs/
    │   │   ├── JobCard.tsx  FilterSidebar.tsx  SortBar.tsx
    │   ├── company/
    │   │   ├── CompanyHero.tsx  JobsGrid.tsx
    │   │   ├── JobDetail.tsx    ContactForm.tsx
    │   ├── common/
    │   │   ├── Toaster.tsx  Spinner.tsx
    │   │   ├── EmptyState.tsx   Tag.tsx
    │   └── ai/AiChat.tsx
    └── pages/
        ├── JobsPage.tsx · CompanyPage.tsx
        └── CVBuilderPage.tsx  ← تنزيل مُصلح
```

## ✅ التغييرات الرئيسية

| | قبل | بعد |
|--|--|--|
| قاعدة البيانات | MySQL | **MongoDB + Mongoose** |
| Seed | 3067 سطر | **72 سطر** + companies.json |
| الشركات | تجريبية | **43 شركة فلسطينية حقيقية** |
| تنزيل CV | popup قد يُحجب | **iframe مخفي — يعمل دائماً** |
| الكومبوننت | ملفات كبيرة | **مجزأة: Tag, Spinner, EmptyState, SortBar, CompanyHero, JobDetail, ContactForm, JobsGrid, Logo, NavLinks, SearchBar** |
| Tests | — | **5 ملفات Jest E2E** |
| Controllers | — | **3 controllers للـ E2E** |
