import { API_BASE_URL } from '../constants/api';
export class RecoveryRequestError extends Error {
  constructor(message: string, public retryAfter = 0, public status = 0) { super(message); }
}
function retryAfter(response: Response): number {
  const seconds = Number(response.headers.get('Retry-After'));
  return Number.isFinite(seconds) && seconds > 0 ? Math.min(900, Math.ceil(seconds)) : response.status === 429 ? 60 : 0;
}
async function recoveryRequest(path: 'forgot-password' | 'reset-password', body: object, signal?: AbortSignal): Promise<Record<string, unknown>> {
  const response = await fetch(`${API_BASE_URL}/auth/${path}`, { method: 'POST', credentials: 'include', signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const result: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    let message = 'تعذر إكمال الطلب الآن. حاول مرة أخرى بعد قليل.';
    if (response.status === 503) message = 'خدمة إرسال البريد غير متاحة حاليًا. حاول لاحقًا أو تواصل مع الدعم.';
    else if (response.status === 429) message = 'طلبات كثيرة خلال وقت قصير. انتظر قبل المحاولة مجددًا.';
    else if (response.status === 400) message = path === 'forgot-password' ? 'راجع البريد الإلكتروني وحاول مجددًا.' : 'رمز الاستعادة غير صالح أو انتهى. راجع أحدث رسالة، أو اطلب رمزًا جديدًا من المتصفح نفسه.';
    else if (response.status === 401 || response.status === 403) message = 'تعذر متابعة الطلب. ابدأ طلب استعادة جديدًا.';
    throw new RecoveryRequestError(message, retryAfter(response), response.status);
  }
  if (response.status !== (path === 'forgot-password' ? 202 : 200) || !result || typeof result !== 'object' || !('message' in result) || typeof result.message !== 'string' || !result.message.trim()) {
    throw new RecoveryRequestError('لم يكتمل الطلب. حاول مرة أخرى.', 0, response.status);
  }
  return result as Record<string, unknown>;
}
export async function requestPasswordReset(email: string, signal?: AbortSignal): Promise<{ message: string; retry_after: number }> {
  const result = await recoveryRequest('forgot-password', { email: email.trim().toLowerCase() }, signal);
  const seconds = result.retry_after;
  return { message: result.message as string, retry_after: typeof seconds === 'number' && Number.isFinite(seconds) ? Math.max(0, Math.min(900, Math.ceil(seconds))) : 60 };
}
export async function resetPassword(email: string, code: string, password: string, signal?: AbortSignal): Promise<{ message: string }> {
  const result = await recoveryRequest('reset-password', { email: email.trim().toLowerCase(), code, new_password: password }, signal);
  return { message: result.message as string };
}
