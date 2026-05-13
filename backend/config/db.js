/**
 * @file db.js
 * @description إعداد اتصال قاعدة البيانات MySQL باستخدام Connection Pool
 * يوفر دالة query() للاستعلام عن قاعدة البيانات بشكل آمن
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

/**
 * إعداد Pool الاتصالات - يتيح التعامل مع طلبات متعددة بكفاءة
 * connectionLimit: الحد الأقصى للاتصالات المتزامنة
 * charset: دعم اللغة العربية الكاملة
 */
const pool = mysql.createPool({
  host:               process.env.DB_HOST || 'localhost',
  port:               parseInt(process.env.DB_PORT, 10) || 3306,
  user:               process.env.DB_USER || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME || 'waseem_foras',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  charset:            'utf8mb4',
  timezone:           '+00:00'
});

/**
 * دالة استعلام قاعدة البيانات
 * ترجع الصفوف مباشرة فقط (rows)
 *
 * @param {string} sql - نص الاستعلام SQL مع placeholders (?)
 * @param {Array} params - مصفوفة القيم المراد تمريرها
 * @returns {Promise<Array>} - الصفوف الناتجة من قاعدة البيانات
 *
 * @example
 * const users = await query('SELECT * FROM users WHERE id = ?', [userId]);
 * // users => [{ id: 1, name: 'Waseem' }]
 */
async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

/**
 * الحصول على اتصال مباشر من الـ Pool
 * مفيد للمعاملات (Transactions)
 *
 * @returns {Promise<mysql.PoolConnection>}
 *
 * @example
 * const conn = await getConnection();
 * try {
 *   await conn.beginTransaction();
 *   // ... queries
 *   await conn.commit();
 * } catch (err) {
 *   await conn.rollback();
 *   throw err;
 * } finally {
 *   conn.release();
 * }
 */
async function getConnection() {
  return await pool.getConnection();
}

/**
 * تنفيذ استعلام وإرجاع أول صف فقط
 *
 * @param {string} sql
 * @param {Array} params
 * @returns {Promise<Object|null>}
 *
 * @example
 * const user = await queryOne('SELECT * FROM users WHERE id = ?', [1]);
 */
async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

/**
 * تنفيذ استعلام COUNT وإرجاع القيمة العددية مباشرة
 *
 * @param {string} sql
 * @param {Array} params
 * @returns {Promise<number>}
 *
 * @example
 * const total = await queryScalar(
 *   'SELECT COUNT(*) AS total FROM jobs'
 * );
 */
async function queryScalar(sql, params = []) {
  const row = await queryOne(sql, params);
  if (!row) return 0;

  // يعيد أول قيمة موجودة في الكائن (مثل total)
  const firstKey = Object.keys(row)[0];
  return Number(row[firstKey] || 0);
}

/**
 * اختبار الاتصال عند تشغيل الخادم
 */
(async () => {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();

    console.log(
      '✅ MySQL connected → ' +
      (process.env.DB_NAME || 'waseem_foras')
    );
  } catch (e) {
    console.error('❌ MySQL connection failed:', e.message);
    // لا نوقف الخادم، فقط نطبع الخطأ
  }
})();

/**
 * التصدير
 */
module.exports = {
  query,
  queryOne,
  queryScalar,
  pool,
  getConnection
};