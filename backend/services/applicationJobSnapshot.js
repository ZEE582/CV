const { publicJob } = require('./publicJobs');
const date = value => value && Number.isFinite(new Date(value).getTime()) ? new Date(value) : null;
function jobDetails(job) {
  const safe = publicJob(typeof job.toObject === 'function' ? job.toObject() : job);
  return { _id: String(safe._id), company_id: String(safe.company_id), title: safe.title, description: safe.description,
    requirements: safe.requirements || [], benefits: safe.benefits || [], location: safe.location || null, region: safe.region || null, field: safe.field || null,
    job_type: safe.job_type || null, experience_level: safe.experience_level || null, salary_min: safe.salary_min ?? null, salary_max: safe.salary_max ?? null,
    salary_currency: safe.salary_currency || '₪', salary_visible: safe.salary_visible !== false, deadline: date(safe.deadline), is_active: safe.is_active === true };
}
function captureJobSnapshot(job, company, capturedAt = new Date()) {
  const details = jobDetails(job);
  const { _id: _id, company_id: _companyId, is_active: _active, ...values } = details;
  return { format_version: 1, captured_at: capturedAt, job_id: job._id, company_id: company._id, job_updated_at: date(job.updatedAt),
    job_version: Number.isSafeInteger(job.__v) && job.__v >= 0 ? job.__v : null, company_name: company.name_ar, ...values };
}
function savedJobSnapshot(application) {
  const snapshot = application.job_snapshot;
  if (!snapshot || snapshot.format_version !== 1 || String(snapshot.job_id) !== String(application.job_id) || String(snapshot.company_id) !== String(application.company_id)
    || !date(snapshot.captured_at) || ['title', 'description', 'company_name'].some(key => typeof snapshot[key] !== 'string')
    || ['requirements', 'benefits'].some(key => !Array.isArray(snapshot[key]) || snapshot[key].some(value => typeof value !== 'string'))) return null;
  return { version: 1, captured_at: date(snapshot.captured_at), job_updated_at: date(snapshot.job_updated_at),
    job_version: Number.isSafeInteger(snapshot.job_version) && snapshot.job_version >= 0 ? snapshot.job_version : null,
    company: { _id: String(snapshot.company_id), name_ar: snapshot.company_name, is_active: true },
    job: jobDetails({ ...snapshot, _id: snapshot.job_id, is_active: true }) };
}
module.exports = { captureJobSnapshot, savedJobSnapshot, jobDetails };
