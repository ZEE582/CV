/**
 * @file controllers/companiesController.js
 * @description منطق الشركات الموحد — يخدم صفحة الشركات، صفحة الشركة، لوحة التحكم
 *
 * الصلاحيات:
 *  getAll / getOne → عام
 *  create          → admin فقط (بعد إنشاء حساب company)
 *  update          → company (مالكة) | admin
 *  remove          → admin فقط
 *  verify          → admin فقط (توثيق الشركة)
 */

const Company = require('../models/Company');
const Job     = require('../models/Job');
const User    = require('../models/User');

// ── قائمة الشركات ─────────────────────────────────────────────
exports.getAll = async (req, res, next) => {
  try {
    const { sector, region, search } = req.query;
    const filter = { is_active: true };

    if (sector) filter.sector = sector;
    if (region) filter.region = region;
    if (search) filter.$or = [
      { name_ar: { $regex: search, $options: 'i' } },
      { name_en: { $regex: search, $options: 'i' } },
      { sector:  { $regex: search, $options: 'i' } }
    ];

    const companies = await Company.find(filter)
      .sort({ is_verified: -1, name_ar: 1 })
      .lean();

    const withJobCount = await Promise.all(
      companies.map(async c => ({
        ...c,
        jobs_count: await Job.countDocuments({ company_id: c._id, is_active: true })
      }))
    );

    res.json({ success: true, total: withJobCount.length, companies: withJobCount });
  } catch (err) { next(err); }
};

// ── تفاصيل شركة واحدة + وظائفها ─────────────────────────────
exports.getOne = async (req, res, next) => {
  try {
    const company = await Company.findOne({ _id: req.params.id, is_active: true }).lean();
    if (!company)
      return res.status(404).json({ success: false, message: 'الشركة غير موجودة أو غير متاحة', code: 'COMPANY_NOT_FOUND' });

    const [jobs, jobs_count] = await Promise.all([
      Job.find({ company_id: req.params.id, is_active: true }).sort({ createdAt: -1 }).lean(),
      Job.countDocuments({ company_id: req.params.id, is_active: true })
    ]);

    Company.findByIdAndUpdate(req.params.id, { $inc: { views_count: 1 } }).catch(() => {});

    res.json({ success: true, company: { ...company, jobs_count }, jobs });
  } catch (err) { next(err); }
};

// ── شركتي (للمستخدم company) ─────────────────────────────────
exports.getMyCompany = async (req, res, next) => {
  try {
    const company = await Company.findOne({ user_id: req.user.id }).lean();
    if (!company)
      return res.status(404).json({ success: false, message: 'لا توجد شركة مرتبطة بحسابك', code: 'NO_COMPANY_LINKED' });

    const jobs_count = await Job.countDocuments({ company_id: company._id, is_active: true });
    res.json({ success: true, company: { ...company, jobs_count } });
  } catch (err) { next(err); }
};

// ── إنشاء شركة (admin فقط) ───────────────────────────────────
exports.create = async (req, res, next) => {
  try {
    const company = await Company.create(req.body);
    res.status(201).json({ success: true, message: 'تمت إضافة الشركة بنجاح', company_id: company._id });
  } catch (err) { next(err); }
};

// ── تعديل شركة ───────────────────────────────────────────────
exports.update = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company)
      return res.status(404).json({ success: false, message: 'الشركة غير موجودة', code: 'COMPANY_NOT_FOUND' });

    if (req.user.role === 'company' && String(company.user_id) !== String(req.user.id))
      return res.status(403).json({ success: false, message: 'ليس لديك صلاحية تعديل هذه الشركة', code: 'NOT_COMPANY_OWNER' });

    const updateData = { ...req.body };
    // الأدمن فقط يستطيع تغيير حالة التوثيق
    if (req.user.role !== 'admin') delete updateData.is_verified;

    await Company.findByIdAndUpdate(req.params.id, updateData);
    res.json({ success: true, message: 'تم تعديل بيانات الشركة بنجاح' });
  } catch (err) { next(err); }
};

// ── حذف شركة (admin فقط) ─────────────────────────────────────
exports.remove = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company)
      return res.status(404).json({ success: false, message: 'الشركة غير موجودة', code: 'COMPANY_NOT_FOUND' });

    await Promise.all([
      Company.findByIdAndDelete(req.params.id),
      Job.deleteMany({ company_id: req.params.id }),
      // إلغاء ارتباط المستخدم بالشركة
      User.updateMany({ role: 'company' }, {}) // يمكن إضافة منطق إضافي هنا
    ]);

    res.json({ success: true, message: 'تم حذف الشركة وجميع بياناتها بنجاح' });
  } catch (err) { next(err); }
};

// ── توثيق شركة (admin فقط) ───────────────────────────────────
exports.verify = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company)
      return res.status(404).json({ success: false, message: 'الشركة غير موجودة', code: 'COMPANY_NOT_FOUND' });

    company.is_verified = true;
    await company.save();

    res.json({ success: true, message: 'تم توثيق الشركة بنجاح', company_id: company._id });
  } catch (err) { next(err); }
};
