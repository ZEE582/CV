import { API_BASE_URL } from '../constants/api';
import { questionsPayload } from '../validation/questionsValidation';
import type { QuestionsForm } from '../types/questions';
export class QuestionsRequestError extends Error {
  constructor(message: string, public status = 0) { super(message); }
}
function currentToken(): string | null { try { return localStorage.getItem('token'); } catch { return null; } }
export function createQuestionsClient() {
  const token = currentToken();
  async function request(path: string, options: RequestInit) {
    if (!token || currentToken() !== token) throw new QuestionsRequestError('تغيّرت جلسة الدخول. حدّث الصفحة قبل حفظ البيانات.', 401);
    const response = await fetch(API_BASE_URL + path, { ...options, credentials: 'include', headers: { Authorization: 'Bearer ' + token, ...(options.body ? { 'Content-Type': 'application/json' } : {}) } });
    const data: unknown = await response.json().catch(() => ({}));
    if (currentToken() !== token) throw new QuestionsRequestError('تغيّرت جلسة الدخول أثناء الطلب. حدّث الصفحة للتحقق من البيانات المحفوظة.', 401);
    if (!response.ok) {
      const message = response.status === 401 ? 'انتهت الجلسة. سجل الدخول مجددًا ثم أعد المحاولة.' : response.status === 429 ? 'طلبات كثيرة. انتظر قليلًا وحاول مجددًا.' : response.status === 400 ? 'تعذر قبول البيانات. راجع الحقول وحاول مجددًا.' : 'تعذر الاتصال بخدمة الملف الشخصي الآن. حاول بعد قليل.';
      throw new QuestionsRequestError(message, response.status);
    }
    return data;
  }
  return {
    load: (signal?: AbortSignal) => request('/user/profile', { signal, cache: 'no-store' }),
    save: (form: QuestionsForm, signal?: AbortSignal) => request('/user/questions', { method: 'POST', body: JSON.stringify(questionsPayload(form)), signal }),
  };
}
