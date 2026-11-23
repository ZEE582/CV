import { API_BASE_URL } from '../../../shared/api';
import { applicationStatuses, type ApplicationStatus } from './recruitment';
import { applicationPayload, validateApplication, type ApplicationDraft } from '../utils/applicationValidation';
import { isCvFileMetadata } from './cvFiles';
function currentToken() { try { return localStorage.getItem('token'); } catch { return null; } }
export function createApplicationClient(accountId: string, jobId: string) {
  const token = currentToken();
  async function request(path: string, options: RequestInit) {
    if (!token || currentToken() !== token) throw new Error('تغيّرت جلسة الدخول. حدّث الصفحة قبل التقديم.');
    const multipart = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const response = await fetch(API_BASE_URL + path, { ...options, credentials: 'include', cache: 'no-store', headers: { Authorization: 'Bearer ' + token, ...(options.body && !multipart ? { 'Content-Type': 'application/json' } : {}) } });
    const data: unknown = await response.json().catch(() => null);
    if (currentToken() !== token) throw new Error('تغيّرت جلسة الدخول أثناء الطلب. حدّث الصفحة للتحقق من طلباتك.');
    if (!response.ok) throw new Error(response.status === 413 ? 'حجم ملف السيرة يتجاوز 5 ميغابايت.' : response.status === 400 && data && typeof data === 'object' && 'code' in data && ['CV_UPLOAD_INVALID', 'CV_SOURCE_CONFLICT'].includes(String(data.code)) ? 'لم يُقبل المرفق. اختر ملف PDF واحدًا صالحًا، أو استخدم رابطًا فقط.' : response.status === 409 ? 'قدّمت لهذه الوظيفة مسبقًا. تحقق من حالة الطلب.' : response.status === 401 ? 'انتهت الجلسة. سجل الدخول مجددًا.' : response.status === 400 || response.status === 404 ? 'الوظيفة غير متاحة للتقديم أو لم تُقبل البيانات. تحقق من الحالة وأعد المحاولة.' : response.status === 429 ? 'طلبات كثيرة. انتظر قليلًا ثم تحقق من حالة طلبك.' : 'تعذر تأكيد إرسال الطلب. تحقق من الحالة قبل إعادة المحاولة.');
    if (!data || typeof data !== 'object' || !('success' in data) || data.success !== true) throw new Error('لم نتمكن من قراءة حالة الطلب. أعد التحقق قبل المحاولة.');
    return data;
  }
  return {
    async status(signal?: AbortSignal): Promise<ApplicationStatus | null> {
      const data = await request('/applications/my', { signal });
      if (!('applications' in data) || !Array.isArray(data.applications)) throw new Error('تعذر قراءة طلباتك السابقة. أعد التحقق.');
      const found = data.applications.find(item => item && (typeof item.job_id === 'string' ? item.job_id : item.job_id?._id) === jobId);
      if (!found) return null;
      const owner = typeof found.user_id === 'string' ? found.user_id : found.user_id?._id;
      if (owner !== accountId || typeof found.status !== 'string' || !Object.hasOwn(applicationStatuses, found.status)) throw new Error('تعذر تأكيد بيانات الطلب. حدّث الصفحة وحاول مجددًا.');
      return found.status as ApplicationStatus;
    },
    async submit(draft: ApplicationDraft, signal?: AbortSignal): Promise<void> {
      const errors = validateApplication(draft); if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
      let body: BodyInit = JSON.stringify(applicationPayload(jobId, draft));
      if (draft.cvFile) {
        const form = new FormData(); form.append('job_id', jobId); form.append('cover_letter', draft.cover.trim());
        form.append('cv_file', draft.cvFile.type ? draft.cvFile : new Blob([draft.cvFile], { type: 'application/pdf' }), draft.cvFile.name); body = form;
      }
      const data = await request('/applications', { method: 'POST', body, signal });
      if (!('application_id' in data) || typeof data.application_id !== 'string' || !data.application_id) throw new Error('تعذر تأكيد إرسال الطلب. تحقق من الحالة قبل إعادة المحاولة.');
      if (draft.cvFile && (!('cv_file' in data) || !isCvFileMetadata(data.cv_file) || data.cv_file.size !== draft.cvFile.size)) throw new Error('تعذر تأكيد حفظ ملف السيرة مع الطلب. تحقق من حالة الطلب قبل المحاولة.');
    },
  };
}
