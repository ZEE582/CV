import { isCvFileMetadata } from './cvFiles';
import { API_BASE_URL } from '../../../shared/api';
import { applicationStatuses, type ApplicationRecord } from './recruitment';
import { readApplicationJobDetails, type ApplicationJobDetails } from './applicationJobDetails';
import { readApplicationHistory, type ApplicationHistory } from './applicationHistory';
import { readApplicationReport, type ApplicationReport } from './applicationReport';

function currentToken() { try { return localStorage.getItem('token'); } catch { return null; } }
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
export interface MyApplicationsClient {
  isCurrent: () => boolean;
  list: (signal?: AbortSignal) => Promise<ApplicationRecord[]>;
  withdraw: (application: ApplicationRecord, signal?: AbortSignal) => Promise<void>;
  jobDetails: (application: ApplicationRecord, signal?: AbortSignal) => Promise<ApplicationJobDetails>;
  history: (application: ApplicationRecord, signal?: AbortSignal) => Promise<ApplicationHistory>;
  report: (application: ApplicationRecord, signal?: AbortSignal) => Promise<ApplicationReport>;
}
export function createMyApplicationsClient(accountId: string, role: string): MyApplicationsClient {
  const token = currentToken();
  const isCurrent = () => !!accountId && role === 'seeker' && !!token && currentToken() === token;
  async function request(path: string, options: RequestInit = {}) {
    if (!isCurrent()) throw new Error('تغيّرت جلسة الدخول. سجل الدخول مجددًا لعرض طلباتك.');
    let response: Response;
    try { response = await fetch(API_BASE_URL + path, { ...options, credentials: 'include', cache: 'no-store', headers: { Authorization: 'Bearer ' + token, ...(options.body ? { 'Content-Type': 'application/json' } : {}) } }); }
    catch (failure) {
      if (options.signal?.aborted) throw failure;
      throw new Error(options.method === 'DELETE' ? 'تعذر تأكيد سحب الطلب. أعد تحميل الطلبات قبل تكرار العملية.' : 'تعذر الاتصال بخدمة الطلبات. أعد المحاولة.');
    }
    const data: unknown = await response.json().catch(() => null);
    if (options.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    if (!isCurrent()) throw new Error('تغيّرت جلسة الدخول أثناء الطلب. سجل الدخول مجددًا.');
    if (!response.ok) throw new Error(response.status === 401 ? 'انتهت الجلسة. سجل الدخول مجددًا.' : response.status === 403 ? 'هذه الصفحة مخصصة لحساب الباحث عن عمل.' : [400, 404, 409].includes(response.status) ? 'تغيّر الطلب أو تمت مراجعته. أعد تحميل الطلبات للتحقق من أحدث حالة.' : response.status === 429 ? 'طلبات كثيرة. انتظر قليلًا ثم أعد تحميل الطلبات.' : 'تعذر تأكيد العملية. أعد تحميل الطلبات وحاول مجددًا.');
    if (!object(data) || data.success !== true) throw new Error('تعذر قراءة تأكيد العملية. أعد تحميل الطلبات.');
    return data;
  }
  return {
    isCurrent,
    async report(application, signal) {
      if (application.user_id?._id !== accountId || !application._id) throw new Error('لا يتطابق الطلب مع حسابك. أعد تحميل الطلبات.');
      const report = readApplicationReport(await request('/applications/' + encodeURIComponent(application._id) + '/report', { signal }), application._id);
      const reference = (value: { _id: string } | string | null) => typeof value === 'string' ? value : value?._id;
      if ((reference(application.job_id) && report.job_id !== reference(application.job_id)) || (reference(application.company_id) && report.company_id !== reference(application.company_id))) throw new Error('لا تتطابق نسخة الطلب مع الوظيفة أو الشركة. أعد تحميل الطلبات.');
      return report;
    },
    async history(application, signal) {
      if (application.user_id?._id !== accountId || !application._id) throw new Error('لا يتطابق الطلب مع حسابك. أعد تحميل الطلبات.');
      return readApplicationHistory(await request('/applications/' + encodeURIComponent(application._id) + '/history', { signal }), application._id);
    },
    async jobDetails(application, signal) {
      if (application.user_id?._id !== accountId || !application._id) throw new Error('لا يتطابق الطلب مع حسابك. أعد تحميل الطلبات.');
      const data = await request('/applications/' + encodeURIComponent(application._id) + '/job', { signal });
      const id = (value: { _id: string } | string | null) => typeof value === 'string' ? value : value?._id || null;
      return readApplicationJobDetails(data, application._id, id(application.job_id), id(application.company_id));
    },
    async list(signal) {
      const data = await request('/applications/my', { signal });
      if (!Array.isArray(data.applications) || data.total !== data.applications.length) throw new Error('تعذر قراءة قائمة طلباتك. أعد التحميل.');
      const ids = new Set<string>();
      return data.applications.map((item: unknown): ApplicationRecord => {
        if (!object(item) || typeof item._id !== 'string' || !item._id || ids.has(item._id)
          || (typeof item.user_id === 'string' ? item.user_id : object(item.user_id) ? item.user_id._id : null) !== accountId
          || typeof item.status !== 'string' || !Object.hasOwn(applicationStatuses, item.status)
          || typeof item.createdAt !== 'string' || !Number.isFinite(Date.parse(item.createdAt))
          || (item.updatedAt != null && (typeof item.updatedAt !== 'string' || !Number.isFinite(Date.parse(item.updatedAt))))
          || (item.cv_file != null && !isCvFileMetadata(item.cv_file))
          || (item.cover_letter != null && typeof item.cover_letter !== 'string') || (item.cv_url != null && typeof item.cv_url !== 'string')
          || (item.has_job_snapshot !== undefined && typeof item.has_job_snapshot !== 'boolean') || ['snapshot_title', 'snapshot_company_name'].some(key => item[key] != null && typeof item[key] !== 'string')
          || (item.__v !== undefined && (!Number.isSafeInteger(item.__v) || Number(item.__v) < 0))) throw new Error('تعذر التحقق من بيانات طلباتك. أعد التحميل.');
        for (const [field, label] of [['job_id', 'title'], ['company_id', 'name_ar']] as const) {
          const value = item[field];
          if (value !== null && !(typeof value === 'string' && value) && !(object(value) && typeof value._id === 'string' && !!value._id && (value[label] == null || typeof value[label] === 'string') && (field !== 'job_id' || value.is_active == null || typeof value.is_active === 'boolean'))) throw new Error('تعذر قراءة بيانات الوظيفة أو الشركة. أعد التحميل.');
        }
        ids.add(item._id);
        return { ...item, user_id: { _id: accountId } } as unknown as ApplicationRecord;
      });
    },
    async withdraw(application, signal) {
      if (application.user_id?._id !== accountId || application.status !== 'pending' || !application._id) throw new Error('لا يمكن سحب هذا الطلب. أعد تحميل القائمة.');
      const data = await request('/applications/' + encodeURIComponent(application._id) + '/withdraw', { method: 'DELETE', body: JSON.stringify({ expected_version: application.__v ?? 0 }), signal });
      if (data.application_id !== application._id) throw new Error('تعذر تأكيد سحب الطلب المحدد. أعد تحميل الطلبات قبل تكرار العملية.');
    },
  };
}
