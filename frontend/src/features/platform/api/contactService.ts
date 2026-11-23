import { API_BASE_URL } from '../../../shared/api';
import type { contactPayload } from '../utils/contactValidation';
export async function submitContact(payload: ReturnType<typeof contactPayload>, attemptId: string, signal?: AbortSignal): Promise<void> {
  let response: Response;
  try { response = await fetch(API_BASE_URL + '/messages', { method: 'POST', credentials: 'omit', cache: 'no-store', signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, client_request_id: attemptId }) }); }
  catch (failure) { if (signal?.aborted) throw failure; throw new Error('تعذر تأكيد حفظ الرسالة. احتفظ بالبيانات وأعد المحاولة.'); }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(response.status === 429 ? 'طلبات كثيرة. انتظر قليلًا ثم أعد المحاولة.' : response.status === 404 ? 'الشركة غير متاحة لاستقبال الرسائل حاليًا.' : response.status === 400 ? 'راجع بيانات النموذج وطول الحقول ثم حاول مجددًا.' : response.status === 409 ? 'تغيّرت بيانات محاولة الإرسال. عدّل النموذج وحاول مجددًا.' : 'تعذر تأكيد حفظ الرسالة. أعد المحاولة بنفس البيانات.');
  if (response.status !== 201 || data?.success !== true || typeof data.message_id !== 'string' || !data.message_id || data.company_id !== payload.company_id) throw new Error('تعذر تأكيد حفظ الرسالة. أعد المحاولة بنفس البيانات.');
}
