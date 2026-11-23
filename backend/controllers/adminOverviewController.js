const User = require('../models/User');
const Company = require('../models/Company');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Message = require('../models/ContactMessage');
const linkedCompany = { $gt: [{ $size: '$company' }, 0] };

exports.getStats = async (_req, res, next) => {
  try {
    const now = new Date();
    const [users, companies, jobsResult, applications, messages] = await Promise.all([
      User.aggregate([{ $group: { _id: null, total: { $sum: 1 }, active: { $sum: { $cond: [{ $eq: ['$is_active', true] }, 1, 0] } } } }]),
      Company.find().select('_id name_ar name_en is_active is_verified').sort({ name_ar: 1, _id: 1 }).lean(),
      Job.aggregate([
        { $project: { title: 1, company_id: 1, is_active: 1, deadline: 1, createdAt: 1 } },
        { $lookup: { from: Company.collection.name, localField: 'company_id', foreignField: '_id', pipeline: [{ $project: { name_ar: 1, is_active: 1 } }], as: 'company' } },
        { $set: { state: { $switch: { branches: [
          { case: { $not: [linkedCompany] }, then: 'orphan' },
          { case: { $ne: ['$is_active', true] }, then: 'paused' },
          { case: { $ne: [{ $arrayElemAt: ['$company.is_active', 0] }, true] }, then: 'company_paused' },
          { case: { $and: [{ $ne: [{ $ifNull: ['$deadline', null] }, null] }, { $lt: ['$deadline', now] }] }, then: 'expired' },
        ], default: 'open' } } } },
        { $facet: {
          counts: [{ $group: { _id: '$state', total: { $sum: 1 }, active: { $sum: { $cond: [{ $eq: ['$is_active', true] }, 1, 0] } } } }],
          recent: [{ $match: { state: { $ne: 'orphan' } } }, { $sort: { createdAt: -1, _id: -1 } }, { $limit: 5 }, { $project: { _id: 1, title: 1, company_id: 1, company_name: { $arrayElemAt: ['$company.name_ar', 0] }, company_active: { $eq: [{ $arrayElemAt: ['$company.is_active', 0] }, true] }, is_active: { $eq: ['$is_active', true] }, deadline: { $ifNull: ['$deadline', null] }, createdAt: { $ifNull: ['$createdAt', null] } } }],
        } },
      ]),
      Application.aggregate([
        { $lookup: { from: Job.collection.name, localField: 'job_id', foreignField: '_id', pipeline: [{ $project: { company_id: 1 } }], as: 'job' } },
        { $lookup: { from: Company.collection.name, localField: 'company_id', foreignField: '_id', pipeline: [{ $project: { _id: 1 } }], as: 'company' } },
        { $group: { _id: { $and: [linkedCompany, { $gt: [{ $size: '$job' }, 0] }, { $eq: ['$company_id', { $arrayElemAt: ['$job.company_id', 0] }] }] }, total: { $sum: 1 }, pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } } } },
      ]),
      Message.aggregate([
        { $lookup: { from: Company.collection.name, localField: 'company_id', foreignField: '_id', pipeline: [{ $project: { _id: 1 } }], as: 'company' } },
        { $group: { _id: linkedCompany, total: { $sum: 1 }, unread: { $sum: { $cond: [{ $eq: ['$is_read', true] }, 0, 1] } } } },
      ]),
    ]);
    const jobs = jobsResult[0] || { counts: [], recent: [] }; const jobCounts = { open: 0, paused: 0, expired: 0, company_paused: 0, orphan: 0 }; let totalJobs = 0; let activeJobs = 0;
    for (const group of jobs.counts) { jobCounts[group._id] = group.total; totalJobs += group.total; activeJobs += group.active; }
    const sum = (groups, key) => groups.reduce((total, group) => total + group[key], 0);
    const reviewable = applications.find(group => group._id === true); const reachableMessages = messages.find(group => group._id === true);
    const stats = {
      totalUsers: users[0]?.total || 0, activeUsers: users[0]?.active || 0,
      totalCompanies: companies.length, activeCompanies: companies.filter(company => company.is_active === true).length, verifiedCompanies: companies.filter(company => company.is_verified === true).length,
      totalJobs, activeJobs, openJobs: jobCounts.open, pausedJobs: jobCounts.paused, expiredJobs: jobCounts.expired, companyPausedJobs: jobCounts.company_paused,
      totalApplications: sum(applications, 'total'), pendingApplications: sum(applications, 'pending'), reviewableApplications: reviewable?.total || 0, reviewablePendingApplications: reviewable?.pending || 0,
      totalMessages: sum(messages, 'total'), reviewableMessages: reachableMessages?.total || 0, unreadMessages: reachableMessages?.unread || 0,
    };
    res.json({ success: true, generated_at: now.toISOString(), stats, recordIssues: { jobs: jobCounts.orphan, applications: stats.totalApplications - stats.reviewableApplications, messages: stats.totalMessages - stats.reviewableMessages }, companies: companies.map(company => ({ _id: company._id, name_ar: company.name_ar, name_en: company.name_en || null, is_active: company.is_active === true })), recentJobs: jobs.recent });
  } catch (error) { next(error); }
};
