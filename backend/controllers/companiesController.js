/**
 * @file controllers/companiesController.js
 */
const Company = require('../models/Company');
const Job     = require('../models/Job');

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
    const companies = await Company.find(filter).sort({ is_verified: -1, name_ar: 1 }).lean();
    const withJobCount = await Promise.all(companies.map(async c => ({
      ...c, jobs_count: await Job.countDocuments({ company_id: c._id, is_active: true })
    })));
    res.json({ success: true, companies: withJobCount });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const company = await Company.findOne({ _id: req.params.id, is_active: true }).lean();
    if (!company) return res.status(404).json({ success: false, message: 'الشركة غير موجودة', code: 'COMPANY_NOT_FOUND' });
    const [jobs, jobs_count] = await Promise.all([
      Job.find({ company_id: req.params.id, is_active: true }).sort({ createdAt: -1 }).lean(),
      Job.countDocuments({ company_id: req.params.id, is_active: true })
    ]);
    Company.findByIdAndUpdate(req.params.id, { $inc: { views_count: 1 } }).catch(() => {});
    res.json({ success: true, company: { ...company, jobs_count }, jobs });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    await Company.create(req.body);
    res.status(201).json({ success: true, message: 'تمت إضافة الشركة بنجاح' });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'الشركة غير موجودة', code: 'COMPANY_NOT_FOUND' });
    if (req.user.role === 'company' && String(company.user_id) !== String(req.user.id))
      return res.status(403).json({ success: false, message: 'ليس لديك صلاحية تعديل هذه الشركة', code: 'NOT_COMPANY_OWNER' });
    const updateData = { ...req.body };
    if (req.user.role !== 'admin') delete updateData.is_verified;
    await Company.findByIdAndUpdate(req.params.id, updateData);
    res.json({ success: true, message: 'تم تعديل بيانات الشركة بنجاح' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'الشركة غير موجودة', code: 'COMPANY_NOT_FOUND' });
    await Promise.all([Company.findByIdAndDelete(req.params.id), Job.deleteMany({ company_id: req.params.id })]);
    res.json({ success: true, message: 'تم حذف الشركة وجميع بياناتها بنجاح' });
  } catch (err) { next(err); }
};
