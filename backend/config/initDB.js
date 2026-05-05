/**
 * initDB.js
 * ينشئ قاعدة البيانات waseem_foras وجميع الجداول
 * الاستخدام: node config/initDB.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

const CFG = {
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT || '3306'),
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || 'waseemxd12',
  charset:            'utf8mb4',
  multipleStatements: true
};
const DB_NAME = process.env.DB_NAME || 'waseem_foras';

async function indexExists(conn, table, name) {
  const [r] = await conn.query(
    `SELECT COUNT(1) AS c FROM information_schema.statistics
     WHERE table_schema=DATABASE() AND table_name=? AND index_name=?`,
    [table, name]
  );
  return r[0].c > 0;
}

async function addIndex(conn, table, name, ddl) {
  if (!(await indexExists(conn, table, name))) await conn.query(ddl);
}

async function main() {
  let conn;
  try {
    console.log('🔌 Connecting …');
    conn = await mysql.createConnection(CFG);

    // ── create / select DB
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
       CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await conn.query(`USE \`${DB_NAME}\``);
    console.log(`📦 Database: ${DB_NAME}`);

    // ── USERS ────────────────────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            CHAR(36)      PRIMARY KEY DEFAULT (UUID()),
        email         VARCHAR(255)  UNIQUE NOT NULL,
        password_hash VARCHAR(255)  NOT NULL,
        role          ENUM('seeker','company','admin') DEFAULT 'seeker',
        full_name     VARCHAR(200),
        phone         VARCHAR(30),
        avatar_url    TEXT,
        is_verified   TINYINT(1)    DEFAULT 0,
        is_active     TINYINT(1)    DEFAULT 1,
        created_at    DATETIME      DEFAULT CURRENT_TIMESTAMP,
        updated_at    DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✅ users');

    // ── COMPANIES ────────────────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id            CHAR(36)      PRIMARY KEY DEFAULT (UUID()),
        user_id       CHAR(36),
        name_ar       VARCHAR(200)  NOT NULL,
        name_en       VARCHAR(200),
        logo_url      TEXT,
        cover_url     TEXT,
        sector        VARCHAR(100),
        size          VARCHAR(60),
        founded_year  INT,
        location      VARCHAR(100),
        region        ENUM('ضفة','قدس','غزة','48','remote'),
        website       VARCHAR(255),
        email         VARCHAR(255),
        linkedin_url  VARCHAR(255),
        about_ar      TEXT,
        about_en      TEXT,
        color         VARCHAR(20)   DEFAULT '#1a7a4a',
        is_verified   TINYINT(1)    DEFAULT 0,
        is_active     TINYINT(1)    DEFAULT 1,
        views_count   INT           DEFAULT 0,
        created_at    DATETIME      DEFAULT CURRENT_TIMESTAMP,
        updated_at    DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✅ companies');

    // ── JOBS ─────────────────────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id                 CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
        company_id         CHAR(36)     NOT NULL,
        title              VARCHAR(300) NOT NULL,
        description        TEXT         NOT NULL,
        requirements       JSON,
        benefits           JSON,
        location           VARCHAR(100),
        region             ENUM('ضفة','قدس','غزة','48','remote'),
        field              VARCHAR(100),
        job_type           ENUM('دوام كامل','دوام جزئي','عقد مؤقت','عمل عن بُعد','تدريب مدفوع','فريلانس'),
        experience_level   ENUM('حديث التخرج','1-3 سنوات','3-5 سنوات','+5 سنوات','قيادي'),
        salary_min         INT,
        salary_max         INT,
        salary_currency    VARCHAR(10)  DEFAULT '₪',
        salary_visible     TINYINT(1)   DEFAULT 1,
        deadline           DATE,
        is_featured        TINYINT(1)   DEFAULT 0,
        is_active          TINYINT(1)   DEFAULT 1,
        views_count        INT          DEFAULT 0,
        applications_count INT          DEFAULT 0,
        created_at         DATETIME     DEFAULT CURRENT_TIMESTAMP,
        updated_at         DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✅ jobs');

    // ── APPLICATIONS ─────────────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id           CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
        job_id       CHAR(36)     NOT NULL,
        user_id      CHAR(36)     NOT NULL,
        company_id   CHAR(36)     NOT NULL,
        cover_letter TEXT,
        cv_url       TEXT,
        status       ENUM('pending','viewed','shortlisted','rejected','hired') DEFAULT 'pending',
        applied_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
        updated_at   DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_app (job_id, user_id),
        FOREIGN KEY (job_id)     REFERENCES jobs(id)      ON DELETE CASCADE,
        FOREIGN KEY (user_id)    REFERENCES users(id)     ON DELETE CASCADE,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✅ applications');

    // ── SEEKER PROFILES ──────────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS seeker_profiles (
        id            CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
        user_id       CHAR(36)     UNIQUE NOT NULL,
        headline      VARCHAR(300),
        bio           TEXT,
        skills        JSON,
        cv_url        TEXT,
        linkedin_url  VARCHAR(255),
        github_url    VARCHAR(255),
        portfolio_url VARCHAR(255),
        is_available  TINYINT(1)   DEFAULT 1,
        created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
        updated_at    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✅ seeker_profiles');

    // ── SAVED JOBS ───────────────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS saved_jobs (
        id       CHAR(36)  PRIMARY KEY DEFAULT (UUID()),
        user_id  CHAR(36)  NOT NULL,
        job_id   CHAR(36)  NOT NULL,
        saved_at DATETIME  DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_saved (user_id, job_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (job_id)  REFERENCES jobs(id)  ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✅ saved_jobs');

    // ── CONTACT MESSAGES ─────────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id           CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
        company_id   CHAR(36)     NOT NULL,
        sender_name  VARCHAR(200) NOT NULL,
        sender_email VARCHAR(255) NOT NULL,
        sender_phone VARCHAR(30),
        subject      VARCHAR(200),
        message      TEXT         NOT NULL,
        is_read      TINYINT(1)   DEFAULT 0,
        created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✅ contact_messages');

    // ── INDEXES ──────────────────────────────────────────────────────
    await addIndex(conn, 'jobs', 'idx_jobs_company',  'CREATE INDEX idx_jobs_company  ON jobs(company_id)');
    await addIndex(conn, 'jobs', 'idx_jobs_active',   'CREATE INDEX idx_jobs_active   ON jobs(is_active)');
    await addIndex(conn, 'jobs', 'idx_jobs_field',    'CREATE INDEX idx_jobs_field    ON jobs(field)');
    await addIndex(conn, 'jobs', 'idx_jobs_region',   'CREATE INDEX idx_jobs_region   ON jobs(region)');
    await addIndex(conn, 'jobs', 'idx_jobs_created',  'CREATE INDEX idx_jobs_created  ON jobs(created_at)');
    await addIndex(conn, 'applications', 'idx_apps_job',  'CREATE INDEX idx_apps_job  ON applications(job_id)');
    await addIndex(conn, 'applications', 'idx_apps_user', 'CREATE INDEX idx_apps_user ON applications(user_id)');
    await addIndex(conn, 'companies', 'idx_cos_active',   'CREATE INDEX idx_cos_active ON companies(is_active)');
    await addIndex(conn, 'contact_messages', 'idx_msgs_co', 'CREATE INDEX idx_msgs_co ON contact_messages(company_id)');
    console.log('  ✅ indexes');

    console.log('');
    console.log('═══════════════════════════════════════════════');
    console.log(`✅  Database "${DB_NAME}" initialized!`);
    console.log('👉  Run next: node config/seed.js');
    console.log('═══════════════════════════════════════════════');
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

main();
