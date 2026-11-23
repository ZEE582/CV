export interface ApplicationJobDetails {
  job_id?: string;
  snapshot?: SavedApplicationJob | null;
  application_id: string;
  company_id: string;
  company: { _id: string; name_ar: string; is_active: boolean } | null;
  job: {
    _id: string; company_id: string; title: string; description: string;
    requirements: string[]; benefits: string[];
    location: string | null; region: string | null; field: string | null; job_type: string | null; experience_level: string | null;
    salary_min: number | null; salary_max: number | null; salary_currency: string; salary_visible: boolean;
    deadline: string | null; is_active: boolean;
  } | null;
}
export interface SavedApplicationJob {
  version: 1; captured_at: string; job_updated_at: string | null; job_version: number | null;
  company: NonNullable<ApplicationJobDetails['company']>;
  job: NonNullable<ApplicationJobDetails['job']>;
}
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
export function readApplicationJobDetails(data: Record<string, unknown>, applicationId: string, jobId: string | null, companyId: string | null): ApplicationJobDetails {
  const company = data.company; const job = data.job;
  const invalid = () => new Error('لا تتطابق تفاصيل الوظيفة مع طلبك. أغلق التفاصيل وأعد تحميل الطلبات.');
  if (data.application_id !== applicationId || typeof data.company_id !== 'string' || !data.company_id || (companyId && data.company_id !== companyId)) throw invalid();
  if (data.job_id !== undefined && (typeof data.job_id !== 'string' || !data.job_id || (jobId && data.job_id !== jobId))) throw invalid();
  const expectedJobId = jobId || (typeof data.job_id === 'string' ? data.job_id : null);
  if (company !== null && (!object(company) || company._id !== data.company_id || typeof company.name_ar !== 'string' || typeof company.is_active !== 'boolean')) throw invalid();
  if (job !== null) {
    if (!object(job) || typeof job._id !== 'string' || !job._id || (expectedJobId && job._id !== expectedJobId) || job.company_id !== data.company_id
      || typeof job.title !== 'string' || typeof job.description !== 'string' || typeof job.is_active !== 'boolean' || typeof job.salary_visible !== 'boolean' || typeof job.salary_currency !== 'string'
      || ['requirements', 'benefits'].some(key => !Array.isArray(job[key]) || (job[key] as unknown[]).some(value => typeof value !== 'string'))
      || ['location', 'region', 'field', 'job_type', 'experience_level'].some(key => job[key] !== null && typeof job[key] !== 'string')
      || (job.deadline !== null && (typeof job.deadline !== 'string' || !Number.isFinite(Date.parse(job.deadline))))
      || ['salary_min', 'salary_max'].some(key => job[key] !== null && (typeof job[key] !== 'number' || !Number.isFinite(job[key]) || Number(job[key]) < 0))) throw invalid();
    if (!job.salary_visible && (job.salary_min !== null || job.salary_max !== null)) throw invalid();
  }
  let saved: SavedApplicationJob | null = null;
  if (data.snapshot != null) {
    const snapshot = data.snapshot;
    if (!object(snapshot) || !expectedJobId || snapshot.version !== 1 || typeof snapshot.captured_at !== 'string' || !Number.isFinite(Date.parse(snapshot.captured_at))
      || (snapshot.job_updated_at !== null && (typeof snapshot.job_updated_at !== 'string' || !Number.isFinite(Date.parse(snapshot.job_updated_at))))
      || (snapshot.job_version !== null && (!Number.isSafeInteger(snapshot.job_version) || Number(snapshot.job_version) < 0)) || !object(snapshot.job) || !object(snapshot.company)) throw invalid();
    const checked = readApplicationJobDetails({ ...data, company: snapshot.company, job: snapshot.job, snapshot: null }, applicationId, expectedJobId, String(data.company_id));
    saved = { version: 1, captured_at: snapshot.captured_at, job_updated_at: snapshot.job_updated_at as string | null, job_version: snapshot.job_version as number | null, company: checked.company!, job: checked.job! };
  }
  return { ...data, snapshot: saved } as unknown as ApplicationJobDetails;
}
