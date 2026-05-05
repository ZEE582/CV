const express = require('express');
const { query } = require('../config/db');
const { authenticate, requireRole, optionalAuth } = require('../middleware/auth');
const router = express.Router();

// GET /api/jobs
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { field, region, type, exp, search, sort = 'newest', page = 1, limit = 50 } = req.query;
    const off = (parseInt(page) - 1) * parseInt(limit);
    const where = ['j.is_active=1'];
    const params = [];

    if (field)  { where.push('j.field=?');            params.push(field); }
    if (region) { where.push('j.region=?');           params.push(region); }
    if (type)   { where.push('j.job_type=?');         params.push(type); }
    if (exp)    { where.push('j.experience_level=?'); params.push(exp); }
    if (search) {
      where.push('(j.title LIKE ? OR c.name_ar LIKE ? OR c.name_en LIKE ? OR j.field LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    const orderMap = { newest:'j.created_at DESC', featured:'j.is_featured DESC,j.created_at DESC', salary:'j.salary_max DESC' };
    const order = orderMap[sort] || 'j.created_at DESC';
    const ws = 'WHERE ' + where.join(' AND ');

    const [[{ total }]] = await query(
      `SELECT COUNT(*) AS total FROM jobs j JOIN companies c ON j.company_id=c.id ${ws}`, params
    );
    const jobs = await query(
      `SELECT j.*,c.name_ar AS company_name,c.name_en AS company_name_en,
              c.color,c.is_verified AS company_verified,c.logo_url
       FROM jobs j JOIN companies c ON j.company_id=c.id
       ${ws} ORDER BY ${order} LIMIT ${parseInt(limit)} OFFSET ${off}`,
      params
    );
    res.json({ success: true, total, jobs });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// GET /api/jobs/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const rows = await query(
      `SELECT j.*,c.name_ar AS company_name,c.name_en AS company_name_en,
              c.color,c.is_verified AS company_verified,c.website,c.email AS company_email,
              c.about_ar AS company_about,c.sector,c.size,c.location AS company_location
       FROM jobs j JOIN companies c ON j.company_id=c.id
       WHERE j.id=? AND j.is_active=1`, [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ success: false, message: 'الوظيفة غير موجودة' });
    await query('UPDATE jobs SET views_count=views_count+1 WHERE id=?', [req.params.id]);
    res.json({ success: true, job: rows[0] });
  } catch (e) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// POST /api/jobs
router.post('/', authenticate, requireRole('company','admin'), async (req, res) => {
  try {
    const { title, description, requirements, benefits, location, region, field,
            job_type, experience_level, salary_min, salary_max, salary_currency,
            salary_visible, deadline, is_featured, company_id } = req.body;
    if (!title || !description)
      return res.status(400).json({ success: false, message: 'العنوان والوصف مطلوبان' });

    let coId = company_id;
    if (req.user.role === 'company') {
      const cos = await query('SELECT id FROM companies WHERE user_id=?', [req.user.id]);
      if (!cos[0]) return res.status(403).json({ success: false, message: 'لا توجد شركة مرتبطة بحسابك' });
      coId = cos[0].id;
    }

    await query(
      `INSERT INTO jobs (id,company_id,title,description,requirements,benefits,location,region,field,
         job_type,experience_level,salary_min,salary_max,salary_currency,salary_visible,deadline,is_featured)
       VALUES (UUID(),?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [coId, title, description, JSON.stringify(requirements||[]), JSON.stringify(benefits||[]),
       location, region, field, job_type, experience_level,
       salary_min||null, salary_max||null, salary_currency||'₪',
       salary_visible!==false?1:0, deadline||null, is_featured?1:0]
    );
    res.status(201).json({ success: true, message: 'تم نشر الوظيفة بنجاح' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// PUT /api/jobs/:id
router.put('/:id', authenticate, requireRole('company','admin'), async (req, res) => {
  try {
    const [job] = await query('SELECT company_id FROM jobs WHERE id=?', [req.params.id]);
    if (!job) return res.status(404).json({ success: false, message: 'الوظيفة غير موجودة' });

    if (req.user.role === 'company') {
      const [co] = await query('SELECT id FROM companies WHERE user_id=?', [req.user.id]);
      if (!co || co.id !== job.company_id)
        return res.status(403).json({ success: false, message: 'ليس لديك صلاحية تعديل هذه الوظيفة' });
    }

    const { title, description, requirements, benefits, location, region, field,
            job_type, experience_level, salary_min, salary_max, salary_currency,
            salary_visible, deadline, is_featured, is_active } = req.body;

    await query(
      `UPDATE jobs SET title=?,description=?,requirements=?,benefits=?,location=?,region=?,field=?,
         job_type=?,experience_level=?,salary_min=?,salary_max=?,salary_currency=?,salary_visible=?,
         deadline=?,is_featured=?,is_active=? WHERE id=?`,
      [title, description, JSON.stringify(requirements||[]), JSON.stringify(benefits||[]),
       location, region, field, job_type, experience_level,
       salary_min||null, salary_max||null, salary_currency||'₪',
       salary_visible!==false?1:0, deadline||null, is_featured?1:0, is_active!==false?1:0, req.params.id]
    );
    res.json({ success: true, message: 'تم تعديل الوظيفة بنجاح' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// DELETE /api/jobs/:id
router.delete('/:id', authenticate, requireRole('company','admin'), async (req, res) => {
  try {
    const [job] = await query('SELECT company_id FROM jobs WHERE id=?', [req.params.id]);
    if (!job) return res.status(404).json({ success: false, message: 'الوظيفة غير موجودة' });

    if (req.user.role === 'company') {
      const [co] = await query('SELECT id FROM companies WHERE user_id=?', [req.user.id]);
      if (!co || co.id !== job.company_id)
        return res.status(403).json({ success: false, message: 'ليس لديك صلاحية حذف هذه الوظيفة' });
    }

    await query('DELETE FROM jobs WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'تم حذف الوظيفة' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

module.exports = router;
