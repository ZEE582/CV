import { API_BASE_URL } from '../../../shared/api';
import { readCompanyOverview, type CompanyOverviewData } from './companyOverview';
import type { Company, Job } from '../types';
import type { jobEditorPayload } from '../utils/jobEditorValidation';
type JobPayload = ReturnType<typeof jobEditorPayload>;
function currentToken() { try { return localStorage.getItem('token'); } catch { return null; } }
export class JobManagementError extends Error { constructor(message: string, public status = 0) { super(message); } }
export function createJobManagementClient(accountId: string, role: string) {
  const token = currentToken();
  async function request(path: string, options: RequestInit = {}) {
    if (!accountId || !['company', 'admin'].includes(role) || !token || currentToken() !== token) throw new JobManagementError('تغيّرت جلسة الدخول. حدّث الصفحة قبل إدارة الوظائف.', 401);
    let response: Response;
    try { response = await fetch(API_BASE_URL + path, { ...options, credentials: 'include', cache: 'no-store', headers: { Authorization: 'Bearer ' + token, ...(options.body ? { 'Content-Type': 'application/json' } : {}) } }); }
    catch (failure) { if (options.signal?.aborted) throw failure; throw new JobManagementError(options.method && options.method !== 'GET' ? 'تعذر تأكيد الحفظ. احتفظ بمسودتك وتحقق من القائمة قبل تكرار العملية.' : 'تعذر الاتصال. أعد تحميل القائمة وحاول مجددًا.'); }
    const data: unknown = await response.json().catch(() => null);
    if (currentToken() !== token) throw new JobManagementError('تغيّرت جلسة الدخول أثناء الطلب. حدّث الصفحة للتحقق من البيانات المحفوظة.', 401);
    if (!response.ok) throw new JobManagementError(response.status === 409 ? 'تغيّرت الوظيفة منذ فتحها. مسودتك لم تُحفظ. ألغِ التعديل وأعد فتح الوظيفة لمراجعة أحدث بياناتها.' : response.status === 401 ? 'انتهت الجلسة. سجل الدخول مجددًا.' : response.status === 403 ? 'ليس لديك صلاحية إدارة هذه الشركة أو الوظيفة.' : response.status === 404 ? 'الشركة أو الوظيفة غير متاحة. أعد تحميل القائمة.' : response.status === 400 ? 'لم تُقبل بيانات الوظيفة. راجع الحقول والموعد وحاول مجددًا.' : response.status === 429 ? 'طلبات كثيرة. انتظر قليلًا وأعد المحاولة.' : 'تعذر تأكيد الحفظ. أعد تحميل القائمة للتحقق قبل تكرار العملية.', response.status);
    if (!data || typeof data !== 'object' || !('success' in data) || data.success !== true) throw new JobManagementError('تعذر قراءة رد الخدمة. تحقق من القائمة قبل تكرار الحفظ.');
    return data;
  }
  return {
    async companies(signal?: AbortSignal): Promise<Company[]> {
      const data = await request(role === 'admin' ? '/companies/manage' : '/companies/my', { signal });
      const values = role === 'admin' && 'companies' in data ? data.companies : 'company' in data ? [data.company] : undefined;
      if (!Array.isArray(values) || values.some(value => !value || typeof value._id !== 'string' || typeof value.name_ar !== 'string')) throw new JobManagementError('تعذر قراءة قائمة الشركات. أعد التحميل.');
      if (role === 'company' && values.some(value => (typeof value.user_id === 'string' ? value.user_id : value.user_id?._id) !== accountId)) throw new JobManagementError('تعذر تأكيد الشركة المرتبطة بحسابك. حدّث الصفحة.');
      return values;
    },
    async overview(companyId: string, signal?: AbortSignal): Promise<CompanyOverviewData> {
      return readCompanyOverview(await request('/companies/' + encodeURIComponent(companyId) + '/overview', { signal }), companyId);
    },
    async jobs(companyId: string, signal?: AbortSignal): Promise<Job[]> {
      const data = await request('/jobs/manage?company_id=' + encodeURIComponent(companyId), { signal });
      if (!('jobs' in data) || !Array.isArray(data.jobs) || data.jobs.some(job => !job || typeof job._id !== 'string' || typeof job.title !== 'string' || job.company_id !== companyId || ['location', 'field', 'deadline', 'createdAt'].some(key => job[key] != null && typeof job[key] !== 'string') || (job.__v !== undefined && (!Number.isSafeInteger(job.__v) || job.__v < 0)))) throw new JobManagementError('تعذر تأكيد وظائف الشركة المحددة. أعد التحميل.');
      return data.jobs;
    },
    async save(companyId: string, original: Job | undefined, payload: JobPayload, signal?: AbortSignal): Promise<void> {
      if (original && original.company_id !== companyId) throw new JobManagementError('تغيّرت الشركة المحددة. أعد فتح الوظيفة.');
      const data = await request('/jobs' + (original ? '/' + encodeURIComponent(original._id) : ''), { method: original ? 'PUT' : 'POST', body: JSON.stringify({ ...payload, company_id: companyId }), signal });
      if (!('job_id' in data) || typeof data.job_id !== 'string' || (original && data.job_id !== original._id) || !('version' in data) || !Number.isSafeInteger(data.version)) throw new JobManagementError('تعذر تأكيد حفظ الوظيفة. أعد تحميل القائمة قبل تكرار الحفظ.');
    },
    async setState(job: Job, desired: boolean, signal?: AbortSignal): Promise<void> {
      const data = await request('/jobs/' + encodeURIComponent(job._id) + '/toggle', { method: 'PATCH', body: JSON.stringify({ is_active: desired, expected_version: job.__v || 0 }), signal });
      if (!('job_id' in data) || data.job_id !== job._id || !('is_active' in data) || data.is_active !== desired || !('version' in data) || !Number.isSafeInteger(data.version)) throw new JobManagementError('تعذر تأكيد حالة الوظيفة. أعد تحميل القائمة قبل تكرار العملية.');
    },
  };
}
export type JobManagementClient = ReturnType<typeof createJobManagementClient>;
