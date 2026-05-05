const express = require('express');
const { query } = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');
const router = express.Router();

// GET /api/companies
router.get('/', async (req, res) => {
  try {
    const { sector, region, search } = req.query;
    const where = ['c.is_active=1'];
    const params = [];

    if (sector) { where.push('c.sector=?'); params.push(sector); }
    if (region) { where.push('c.region=?'); params.push(region); }
    if (search) {
      where.push('(c.name_ar LIKE ? OR c.name_en LIKE ? OR c.sector LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    const companies = await query(
      `SELECT c.*,
         (SELECT COUNT(*) FROM jobs j WHERE j.company_id=c.id AND j.is_active=1) AS jobs_count
       FROM companies c
       WHERE ${where.join(' AND ')}
       ORDER BY c.is_verified DESC, c.name_ar ASC`,
      params
    );
    res.json({ success: true, companies });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// GET /api/companies/:id
router.get('/:id', async (req, res) => {
  try {
    const rows = await query(
      `SELECT c.*,
         (SELECT COUNT(*) FROM jobs j WHERE j.company_id=c.id AND j.is_active=1) AS jobs_count
       FROM companies c WHERE c.id=? AND c.is_active=1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ success: false, message: 'الشركة غير موجودة' });

    const jobs = await query(
      'SELECT * FROM jobs WHERE company_id=? AND is_active=1 ORDER BY created_at DESC',
      [req.params.id]
    );
    await query('UPDATE companies SET views_count=views_count+1 WHERE id=?', [req.params.id]);
    res.json({ success: true, company: rows[0], jobs });
  } catch (e) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// POST /api/companies — admin only
router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { name_ar, name_en, sector, size, founded_year, location, region,
            website, email, about_ar, color, is_verified, user_id } = req.body;
    if (!name_ar || !about_ar)
      return res.status(400).json({ success: false, message: 'الاسم والنبذة مطلوبان' });

    await query(
      `INSERT INTO companies (id,user_id,name_ar,name_en,sector,size,founded_year,
         location,region,website,email,about_ar,color,is_verified)
       VALUES (UUID(),?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [user_id||null, name_ar, name_en, sector, size, founded_year||null,
       location, region, website, email, about_ar, color||'#1a7a4a', is_verified?1:0]
    );
    res.status(201).json({ success: true, message: 'تمت إضافة الشركة' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// PUT /api/companies/:id — company owner or admin
router.put('/:id', authenticate, requireRole('company','admin'), async (req, res) => {
  try {
    const rows = await query('SELECT user_id FROM companies WHERE id=?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, message: 'الشركة غير موجودة' });
    if (req.user.role === 'company' && rows[0].user_id !== req.user.id)
      return res.status(403).json({ success: false, message: 'ليس لديك صلاحية' });

    const { name_ar, name_en, sector, size, location, region, website,
            email, about_ar, color, is_verified } = req.body;
    await query(
      `UPDATE companies SET name_ar=?,name_en=?,sector=?,size=?,location=?,region=?,
         website=?,email=?,about_ar=?,color=?,is_verified=? WHERE id=?`,
      [name_ar, name_en, sector, size, location, region, website,
       email, about_ar, color, is_verified?1:0, req.params.id]
    );
    res.json({ success: true, message: 'تم تعديل بيانات الشركة' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// DELETE /api/companies/:id — admin only
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    await query('DELETE FROM companies WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'تم حذف الشركة' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

module.exports = router;
