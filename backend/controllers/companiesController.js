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
const { publicJob } = require('../services/publicJobs');
const { companyVersion, companyConflict } = require('../services/companyRevision');
const history = require('../services/managementHistory');


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

    res.json({ success: true, company: { ...company, jobs_count }, jobs: jobs.map(publicJob) });
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
    const data = { ...req.body, is_active: req.body.is_active ?? true, is_verified: req.body.is_verified ?? false };
    const company = await Company.create({ ...data, change_history_total: 1, change_history: [history.entry(req, 'company.create', 0, Object.keys(req.body), undefined, history.companyState(data))] });
    res.status(201).json({ success: true, message: 'تمت إضافة الشركة بنجاح', company_id: company._id, version: company.__v || 0, is_active: company.is_active, is_verified: company.is_verified });
  } catch (err) { next(err); }
};

// ── تعديل شركة ───────────────────────────────────────────────
exports.update = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, code: 'COMPANY_NOT_FOUND', message: 'الشركة غير موجودة.' });
    if (req.user.role !== 'admin' && String(company.user_id) !== req.user.id) return res.status(403).json({ success: false, message: 'ليس لديك صلاحية تعديل هذه الشركة.' });
    const { expected_version, ...fields } = req.body;
    if (req.user.role !== 'admin' && ('is_verified' in fields || 'is_active' in fields)) return res.status(403).json({ success: false, message: 'تغيير حالة الشركة والتوثيق متاح للمدير فقط.' });
    const version = expected_version ?? company.__v ?? 0;
    if (version !== (company.__v || 0)) return companyConflict(res);
    const changed = Object.keys(fields).filter(key => JSON.stringify(company.get(key)) !== JSON.stringify(fields[key]));
    const audit = history.entry(req, 'company.update', version + 1, changed, history.companyState(company), history.companyState({ ...company.toObject(), ...fields }));
    const updated = await Company.findOneAndUpdate({ _id: company._id, ...(req.user.role === 'admin' ? {} : { user_id: req.user.id }), ...companyVersion(version) }, history.append({ $set: fields, $inc: { __v: 1 } }, audit), { new: true, runValidators: true });
    if (!updated) return companyConflict(res);
    res.json({ success: true, company_id: String(updated._id), version: updated.__v, is_active: updated.is_active, is_verified: updated.is_verified, message: 'تم حفظ بيانات الشركة.' });
  } catch (error) { next(error); }
};

// Legacy DELETE archives the company; its jobs, applications, messages and owner remain intact.
exports.remove = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'الشركة غير موجودة.' });
    const version = req.body.expected_version ?? company.__v ?? 0;
    if (version !== (company.__v || 0)) return companyConflict(res);
    const updated = await Company.findOneAndUpdate({ _id: company._id, ...companyVersion(version) }, history.append({ $set: { is_active: false }, $inc: { __v: 1 } }, history.entry(req, 'company.archive', version + 1, company.is_active ? ['is_active'] : [], history.companyState(company), { ...history.companyState(company), is_active: false })), { new: true, runValidators: true });
    if (!updated) return companyConflict(res);
    res.json({ success: true, company_id: String(updated._id), version: updated.__v, archived: true, message: 'تم إيقاف الشركة مع الاحتفاظ ببياناتها ووظائفها وطلباتها ورسائلها.' });
  } catch (error) { next(error); }
};

exports.verify = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'الشركة غير موجودة.' });
    const version = req.body.expected_version ?? company.__v ?? 0; const desired = req.body.is_verified ?? true;
    if (version !== (company.__v || 0)) return companyConflict(res);
    const updated = await Company.findOneAndUpdate({ _id: company._id, ...companyVersion(version) }, history.append({ $set: { is_verified: desired }, $inc: { __v: 1 } }, history.entry(req, 'company.verify', version + 1, desired !== company.is_verified ? ['is_verified'] : [], history.companyState(company), { ...history.companyState(company), is_verified: desired })), { new: true, runValidators: true });
    if (!updated) return companyConflict(res);
    res.json({ success: true, company_id: String(updated._id), version: updated.__v, is_verified: updated.is_verified });
  } catch (error) { next(error); }
};
