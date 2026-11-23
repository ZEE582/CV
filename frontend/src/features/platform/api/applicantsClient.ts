import { isCvFileMetadata } from './cvFiles';
import { API_BASE_URL } from '../../../shared/api';
import { applicationStatuses, type ApplicationRecord, type ApplicationStatus } from './recruitment';
export interface ApplicantsResponse { success: true; job_id: string; company_id: string; applications: ApplicationRecord[]; total: number; page: number; pages: number; limit: number; counts: Record<ApplicationStatus, number> }
function currentToken() { try { return localStorage.getItem('token'); } catch { return null; } }
export class ApplicantsError extends Error { constructor(message: string, public status = 0) { super(message); } }
export function createApplicantsClient(accountId: string, role: string) {
  const token = currentToken();
  async function request(path: string, options: RequestInit = {}) {
    if (!accountId || !['company', 'admin'].includes(role) || !token || currentToken() !== token) throw new ApplicantsError('تغيّرت جلسة الدخول. حدّث الصفحة قبل مراجعة المتقدمين.', 401);
    let response: Response;
    try { response = await fetch(API_BASE_URL + path, { ...options, credentials: 'include', cache: 'no-store', headers: { Authorization: 'Bearer ' + token, ...(options.body ? { 'Content-Type': 'application/json' } : {}) } }); }
    catch (failure) { if (options.signal?.aborted) throw failure; throw new ApplicantsError(options.method === 'PATCH' ? 'تعذر تأكيد تغيير الحالة. أعد تحميل القائمة قبل تكرار الحفظ.' : 'تعذر الاتصال بخدمة المتقدمين. أعد المحاولة.'); }
    const data: unknown = await response.json().catch(() => null);
    if (currentToken() !== token) throw new ApplicantsError('تغيّرت جلسة الدخول أثناء الطلب. حدّث الصفحة للتحقق من البيانات.', 401);
    if (!response.ok) throw new ApplicantsError(response.status === 409 ? 'تغيّر الطلب أو سُحب منذ فتحه. حدّث القائمة وراجع أحدث حالته قبل الحفظ.' : response.status === 401 ? 'انتهت الجلسة. سجل الدخول مجددًا.' : response.status === 403 ? 'ليس لديك صلاحية مراجعة متقدمي هذه الوظيفة.' : response.status === 404 ? 'الوظيفة أو الطلب لم يعد متاحًا. حدّث القائمة.' : response.status === 400 ? 'معايير المراجعة غير صالحة. راجع الاختيار والفلاتر.' : response.status === 429 ? 'طلبات كثيرة. انتظر قليلًا وأعد المحاولة.' : 'تعذر تأكيد العملية. أعد تحميل القائمة قبل تكرار الحفظ.', response.status);
    if (!data || typeof data !== 'object' || !('success' in data) || data.success !== true) throw new ApplicantsError('تعذر قراءة بيانات المراجعة. حدّث القائمة.');
    return data;
  }
  return {
    async list(companyId: string, jobId: string, query: URLSearchParams, signal?: AbortSignal): Promise<ApplicantsResponse> {
      const data = await request('/applications/job/' + encodeURIComponent(jobId) + '?' + query.toString(), { signal });
      if (!('job_id' in data) || data.job_id !== jobId || !('company_id' in data) || data.company_id !== companyId || !('applications' in data) || !Array.isArray(data.applications)
        || !('total' in data) || !Number.isSafeInteger(data.total) || Number(data.total) < 0 || !('page' in data) || !Number.isSafeInteger(data.page) || Number(data.page) < 1
        || !('pages' in data) || !Number.isSafeInteger(data.pages) || Number(data.pages) < 1 || !('limit' in data) || !Number.isSafeInteger(data.limit) || Number(data.limit) < 1 || Number(data.limit) > 100
        || !('counts' in data) || !data.counts || typeof data.counts !== 'object' || Object.keys(applicationStatuses).some(status => { const value = (data.counts as Record<string, unknown>)[status]; return !Number.isSafeInteger(value) || Number(value) < 0; })
        || data.applications.some(item => !item || typeof item._id !== 'string' || !item._id || item.job_id !== jobId || item.company_id !== companyId || typeof item.status !== 'string' || !Object.hasOwn(applicationStatuses, item.status)
          || (item.__v !== undefined && (!Number.isSafeInteger(item.__v) || item.__v < 0)) || typeof item.createdAt !== 'string' || !Number.isFinite(new Date(item.createdAt).getTime())
          || (item.cv_file != null && !isCvFileMetadata(item.cv_file))
          || (item.cover_letter != null && typeof item.cover_letter !== 'string') || (item.cv_url != null && typeof item.cv_url !== 'string')
          || (item.user_id !== null && (!item.user_id || typeof item.user_id !== 'object' || typeof item.user_id._id !== 'string' || ['name', 'email', 'phone'].some(key => item.user_id[key] != null && typeof item.user_id[key] !== 'string'))))) throw new ApplicantsError('لا تتطابق بيانات المتقدمين مع الشركة والوظيفة المحددتين. حدّث القائمة.');
      return data as ApplicantsResponse;
    },
    async saveStatus(application: ApplicationRecord, companyId: string, jobId: string, status: ApplicationStatus, signal?: AbortSignal): Promise<void> {
      if (application.company_id !== companyId || application.job_id !== jobId || !Object.hasOwn(applicationStatuses, status)) throw new ApplicantsError('لا يتطابق الطلب مع اختيارك الحالي. أعد فتح القائمة.');
      const expected = application.__v || 0;
      const data = await request('/applications/' + encodeURIComponent(application._id) + '/status', { method: 'PATCH', signal, body: JSON.stringify({ status, expected_version: expected, job_id: jobId, company_id: companyId }) });
      if (!('application_id' in data) || data.application_id !== application._id || !('job_id' in data) || data.job_id !== jobId || !('company_id' in data) || data.company_id !== companyId || !('status' in data) || data.status !== status || !('version' in data) || data.version !== expected + 1) throw new ApplicantsError('تعذر تأكيد حفظ الحالة. أعد تحميل القائمة قبل تكرار العملية.');
    },
  };
}
