import { apiRequest } from '../../../shared/api';
import { API_BASE_URL } from '../constants/api';
import { validQuestionsProfile } from '../validation/questionsValidation';
import type { ProfileUpdate, UserProfile } from '../types/user';
function currentToken(): string | null { try { return localStorage.getItem('token'); } catch { return null; } }
export function createProfileClient(accountId: string) {
  const token = currentToken();
  async function request(options: RequestInit): Promise<UserProfile> {
    if (!token || currentToken() !== token) throw new Error('تغيّرت جلسة الدخول. حدّث الصفحة قبل تعديل الملف.');
    let response: Response;
    try { response = await fetch(API_BASE_URL + '/user/profile', { ...options, credentials: 'include', cache: 'no-store', headers: { Authorization: 'Bearer ' + token, ...(options.body ? { 'Content-Type': 'application/json' } : {}) } }); } catch (failure) {
      if (options.signal?.aborted) throw failure;
      throw new Error('تعذر الاتصال بخدمة الملف الشخصي. تحقق من الاتصال وأعد المحاولة.');
    }
    const data: unknown = await response.json().catch(() => null);
    if (currentToken() !== token) throw new Error('تغيّرت جلسة الدخول أثناء الطلب. حدّث الصفحة للتحقق من بياناتك.');
    if (!response.ok) throw new Error(response.status === 401 ? 'انتهت الجلسة. سجل الدخول مجددًا.' : response.status === 429 ? 'طلبات كثيرة. انتظر قليلًا وأعد المحاولة.' : response.status === 400 ? 'راجع بيانات الملف وحاول مجددًا.' : 'خدمة الملف الشخصي غير متاحة الآن. أعد المحاولة بعد قليل.');
    const user = data && typeof data === 'object' && 'user' in data ? data.user : undefined;
    if (!validQuestionsProfile(user, accountId)) throw new Error('لم نتمكن من تأكيد بيانات الحساب. حدّث الصفحة وحاول مجددًا.');
    return user;
  }
  return { load: (signal?: AbortSignal) => request({ signal }), save: (profile: ProfileUpdate, signal?: AbortSignal) => request({ method: 'PUT', body: JSON.stringify(profile), signal }) };
}
export const changePassword = (current: string, password: string) => apiRequest<{ message: string; token: string; user: UserProfile }>('/auth/change-password', { method: 'PUT', body: JSON.stringify({ current_password: current, new_password: password }) });
