const express = require('express');
const { query } = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');
const router = express.Router();

// POST /api/applications
router.post('/', authenticate, requireRole('seeker'), async (req, res) => {
  try {
    const { job_id, cover_letter, cv_url } = req.body;
    if (!job_id) return res.status(400).json({ success: false, message: 'job_id مطلوب' });

    const [job] = await query('SELECT company_id FROM jobs WHERE id=? AND is_active=1', [job_id]);
    if (!job) return res.status(404).json({ success: false, message: 'الوظيفة غير موجودة' });

    const exists = await query('SELECT id FROM applications WHERE job_id=? AND user_id=?', [job_id, req.user.id]);
    if (exists.length) return res.status(409).json({ success: false, message: 'لقد تقدمت لهذه الوظيفة مسبقاً' });

    await query(
      'INSERT INTO applications (id,job_id,user_id,company_id,cover_letter,cv_url) VALUES (UUID(),?,?,?,?,?)',
      [job_id, req.user.id, job.company_id, cover_letter||null, cv_url||null]
    );
    await query('UPDATE jobs SET applications_count=applications_count+1 WHERE id=?', [job_id]);
    res.status(201).json({ success: true, message: 'تم إرسال طلبك بنجاح' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// GET /api/applications/my
router.get('/my', authenticate, requireRole('seeker'), async (req, res) => {
  try {
    const apps = await query(
      `SELECT a.*,j.title,j.salary_min,j.salary_max,j.salary_currency,
              c.name_ar AS company_name,c.color
       FROM applications a
       JOIN jobs j ON a.job_id=j.id JOIN companies c ON a.company_id=c.id
       WHERE a.user_id=? ORDER BY a.applied_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, applications: apps });
  } catch (e) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// GET /api/applications/company
router.get('/company', authenticate, requireRole('company','admin'), async (req, res) => {
  try {
    let coId;
    if (req.user.role === 'company') {
      const [co] = await query('SELECT id FROM companies WHERE user_id=?', [req.user.id]);
      if (!co) return res.status(403).json({ success: false, message: 'لا توجد شركة' });
      coId = co.id;
    }
    const extra = coId ? 'AND a.company_id=?' : '';
    const params = coId ? [coId] : [];
    const apps = await query(
      `SELECT a.*,j.title AS job_title,u.full_name,u.email AS seeker_email
       FROM applications a JOIN jobs j ON a.job_id=j.id JOIN users u ON a.user_id=u.id
       WHERE 1=1 ${extra} ORDER BY a.applied_at DESC`,
      params
    );
    res.json({ success: true, applications: apps });
  } catch (e) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// PUT /api/applications/:id/status
router.put('/:id/status', authenticate, requireRole('company','admin'), async (req, res) => {
  try {
    const allowed = ['pending','viewed','shortlisted','rejected','hired'];
    if (!allowed.includes(req.body.status))
      return res.status(400).json({ success: false, message: 'حالة غير صالحة' });
    await query('UPDATE applications SET status=? WHERE id=?', [req.body.status, req.params.id]);
    res.json({ success: true, message: 'تم تحديث الحالة' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

module.exports = router;
