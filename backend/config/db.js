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
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT) || 3306,
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'waseem_foras',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  charset:            'utf8mb4',
  timezone:           '+00:00'
});

/**
 * دالة استعلام قاعدة البيانات
 * @param {string} sql - نص الاستعلام SQL مع placeholders (?)
 * @param {Array} params - مصفوفة القيم المراد تمرير للاستعلام
 * @returns {Promise<Array>} - النتائج من قاعدة البيانات
 * @throws {Error} - إذا فشل الاستعلام
 * @example
 *   const users = await query('SELECT * FROM users WHERE id = ?', [userId]);
 */
async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

/**
 * الحصول على اتصال مباشر من الـ Pool
 * مفيد للمعاملات (Transactions) التي تحتاج اتصالاً واحداً
 * @returns {Promise<mysql.PoolConnection>} - اتصال قاعدة البيانات
 * @example
 *   const conn = await getConnection();
 *   try {
 *     await conn.beginTransaction();
 *     // ... queries
 *     await conn.commit();
 *   } finally {
 *     conn.release();
 *   }
 */
async function getConnection() {
  return await pool.getConnection();
}

// التحقق من الاتصال عند تشغيل الخادم
(async () => {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log('✅ MySQL connected → ' + (process.env.DB_NAME || 'waseem_foras'));
  } catch (e) {
    console.error('❌ MySQL connection failed:', e.message);
    // لا نوقف العملية هنا - نترك الخادم يعمل ويعيد المحاولة عند الطلب
  }
})();

module.exports = { query, pool, getConnection };
