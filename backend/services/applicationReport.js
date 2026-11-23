const { savedJobSnapshot } = require('./applicationJobSnapshot');
const { historyResponse } = require('./applicationHistory');
function applicationReport(application, names, generatedAt = new Date()) {
  const history = historyResponse(application);
  if (!history) return null;
  const snapshot = savedJobSnapshot(application);
  return { success: true, generated_at: generatedAt, application_id: String(application._id),
    job_id: application.job_id ? String(application.job_id) : null, company_id: application.company_id ? String(application.company_id) : null,
    title: snapshot?.job.title || names.job_title || 'وظيفة غير متاحة', company_name: snapshot?.company.name_ar || names.company_name || 'شركة غير متاحة',
    names_source: snapshot ? 'saved' : names.job_title || names.company_name ? 'current' : 'unavailable',
    application: { _id: String(application._id), status: application.status, version: application.__v ?? 0, submitted_at: application.createdAt,
      cover_letter: application.cover_letter ?? null, cv_url: application.cv_url ?? null, ...(application.cv_file ? { cv_file: { name: application.cv_file.name, size: application.cv_file.size } } : {}) }, snapshot, history };
}
module.exports = { applicationReport };
