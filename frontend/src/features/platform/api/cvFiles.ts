import { API_BASE_URL } from '../../../shared/api';
export const MAX_CV_BYTES = 5 * 1024 * 1024;
export interface CvFileMetadata { name: string; size: number }
export function isCvFileMetadata(value: unknown): value is CvFileMetadata {
  if (!value || typeof value !== 'object') return false;
  const file = value as Record<string, unknown>;
  return typeof file.name === 'string' && file.name.length <= 120 && /\.pdf$/i.test(file.name) && !/[\\/\u0000-\u001f\u007f]/.test(file.name) && Number.isSafeInteger(file.size) && Number(file.size) > 0 && Number(file.size) <= MAX_CV_BYTES;
}
function currentToken() { try { return localStorage.getItem('token'); } catch { return null; } }
export function createCvFileClient() {
  const token = currentToken();
  return async (applicationId: string, file: CvFileMetadata, signal?: AbortSignal): Promise<Blob> => {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const current = () => !!token && currentToken() === token;
    if (!current() || !applicationId || !isCvFileMetadata(file)) throw new Error('تغيّرت الجلسة أو بيانات المرفق. حدّث الصفحة.');
    let response: Response;
    try { response = await fetch(API_BASE_URL + '/applications/' + encodeURIComponent(applicationId) + '/cv', { headers: { Authorization: 'Bearer ' + token }, credentials: 'include', cache: 'no-store', signal }); }
    catch (failure) { if (signal?.aborted) throw failure; throw new Error('تعذر الاتصال لتنزيل السيرة. حاول مجددًا.'); }
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    if (!current()) throw new Error('تغيّرت الجلسة. لم يُنزّل المرفق.');
    if (!response.ok) throw new Error(response.status === 401 ? 'انتهت الجلسة. سجل الدخول مجددًا.' : response.status === 404 || response.status === 403 ? 'المرفق غير متاح لهذا الحساب أو حُذف الطلب.' : 'تعذر تحميل المرفق. حاول مجددًا.');
    if (response.headers.get('content-type')?.split(';')[0].trim() !== 'application/pdf' || Number(response.headers.get('content-length')) !== file.size) throw new Error('تعذر التحقق من ملف السيرة. حدّث الطلب.');
    const blob = await response.blob();
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    if (!current() || blob.size !== file.size || blob.size > MAX_CV_BYTES) throw new Error('تغيّرت الجلسة أو لم يكتمل الملف. حاول مجددًا.');
    return blob;
  };
}
