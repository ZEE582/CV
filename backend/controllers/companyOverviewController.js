const Company = require('../models/Company');
const Job = require('../models/Job');
const Application = require('../models/Application');
const ContactMessage = require('../models/ContactMessage');

exports.managedCompanies = async (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  try {
    const companies = await Company.find().select('_id name_ar name_en user_id is_active').sort({ name_ar: 1, _id: 1 }).lean();
    res.json({ success: true, companies: companies.map(company => ({ ...company, is_active: company.is_active === true })) });
  } catch (error) { next(error); }
};

exports.overview = async (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  try {
    const company = await Company.findOne({ _id: req.params.id, ...(req.user.role === 'admin' ? {} : { user_id: req.user.id }) }).select('is_active').lean();
    if (!company) return res.status(404).json({ success: false, code: 'COMPANY_NOT_FOUND', message: 'الشركة غير متاحة.' });
    const now = new Date(); const scope = { company_id: company._id };
    const [jobGroups, applicationGroups, messageGroups] = await Promise.all([
      Job.aggregate([
        { $match: scope },
        { $project: { state: { $switch: { branches: [
          { case: { $ne: ['$is_active', true] }, then: 'paused' },
          { case: { $literal: company.is_active !== true }, then: 'company_paused' },
          { case: { $and: [{ $ne: [{ $ifNull: ['$deadline', null] }, null] }, { $lt: ['$deadline', now] }] }, then: 'expired' },
        ], default: 'open' } } } },
        { $group: { _id: '$state', count: { $sum: 1 } } },
      ]),
      Application.aggregate([
        { $match: scope },
        { $lookup: { from: Job.collection.name, localField: 'job_id', foreignField: '_id', pipeline: [{ $match: scope }, { $project: { _id: 1 } }], as: 'valid_job' } },
        { $match: { 'valid_job.0': { $exists: true } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      ContactMessage.aggregate([{ $match: scope }, { $group: { _id: { $eq: ['$is_read', true] }, count: { $sum: 1 } } }]),
    ]);
    const jobs = { total: 0, open: 0, paused: 0, expired: 0, company_paused: 0 };
    for (const group of jobGroups) { jobs[group._id] = group.count; jobs.total += group.count; }
    const byStatus = { pending: 0, viewed: 0, shortlisted: 0, rejected: 0, hired: 0, other: 0 }; let applicationTotal = 0;
    for (const group of applicationGroups) { byStatus[Object.hasOwn(byStatus, group._id) ? group._id : 'other'] += group.count; applicationTotal += group.count; }
    const messages = { total: 0, read: 0, unread: 0 };
    for (const group of messageGroups) { messages[group._id === true ? 'read' : 'unread'] += group.count; messages.total += group.count; }
    res.json({ success: true, company_id: String(company._id), generated_at: now.toISOString(), jobs, applications: { total: applicationTotal, by_status: byStatus }, messages });
  } catch (error) { next(error); }
};
