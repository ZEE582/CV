import { API_BASE_URL } from '../../../shared/api';
export interface InboxMessage { _id: string; company_id: string; sender_name: string; sender_email: string; sender_phone?: string | null; subject?: string | null; message: string; is_read: boolean; createdAt: string; __v?: number }
export interface InboxResponse { success: true; company_id: string; total: number; page: number; pages: number; limit: number; counts: { read: number; unread: number }; messages: InboxMessage[] }
function currentToken() { try { return localStorage.getItem('token'); } catch { return null; } }
export function createInboxClient(accountId: string, role: string) {
  const token = currentToken();
  async function request(path: string, options: RequestInit = {}) {
    if (!accountId || !['company', 'admin'].includes(role) || !token || currentToken() !== token) throw new Error('تغيّرت جلسة الدخول. حدّث الصفحة قبل مراجعة الرسائل.');
    let response: Response;
    try { response = await fetch(API_BASE_URL + path, { ...options, credentials: 'include', cache: 'no-store', headers: { Authorization: 'Bearer ' + token, ...(options.body ? { 'Content-Type': 'application/json' } : {}) } }); }
    catch (failure) { if (options.signal?.aborted) throw failure; throw new Error(options.method === 'PATCH' ? 'تعذر تأكيد تغيير حالة القراءة. حدّث القائمة قبل تكرار العملية.' : 'تعذر الاتصال بخدمة الرسائل. أعد المحاولة.'); }
    const data: unknown = await response.json().catch(() => null);
    if (currentToken() !== token) throw new Error('تغيّرت جلسة الدخول أثناء الطلب. حدّث الصفحة.');
    if (!response.ok) throw new Error(response.status === 409 ? 'تغيّرت الرسالة منذ تحميلها. حدّث القائمة وراجع حالتها.' : response.status === 401 ? 'انتهت الجلسة. سجل الدخول مجددًا.' : response.status === 403 ? 'ليس لديك صلاحية مراجعة رسائل هذه الشركة.' : response.status === 404 ? 'الرسالة أو الشركة لم تعد متاحة.' : response.status === 400 ? 'معايير الرسائل غير صالحة. راجع الاختيار والفلاتر.' : response.status === 429 ? 'طلبات كثيرة. انتظر قليلًا ثم أعد المحاولة.' : 'تعذر تأكيد العملية. حدّث القائمة.');
    if (!data || typeof data !== 'object' || !('success' in data) || data.success !== true) throw new Error('تعذر قراءة استجابة خدمة الرسائل. حدّث القائمة.');
    return data;
  }
  return {
    async list(companyId: string, query: URLSearchParams, signal?: AbortSignal): Promise<InboxResponse> {
      const data = await request('/messages/company/' + encodeURIComponent(companyId) + '?' + query.toString(), { signal });
      const validCount = (value: unknown, min = 0) => Number.isSafeInteger(value) && Number(value) >= min;
      if (!('company_id' in data) || data.company_id !== companyId || !('messages' in data) || !Array.isArray(data.messages)
        || !('total' in data) || !validCount(data.total) || !('page' in data) || !validCount(data.page, 1) || !('pages' in data) || !validCount(data.pages, 1) || Number(data.page) > Number(data.pages)
        || !('limit' in data) || !validCount(data.limit, 1) || Number(data.limit) > 100 || !('counts' in data) || !data.counts || typeof data.counts !== 'object' || !('read' in data.counts) || !validCount(data.counts.read) || !('unread' in data.counts) || !validCount(data.counts.unread)
        || data.messages.some(item => !item || typeof item._id !== 'string' || !item._id || item.company_id !== companyId || typeof item.sender_name !== 'string' || typeof item.sender_email !== 'string' || typeof item.message !== 'string' || typeof item.is_read !== 'boolean' || typeof item.createdAt !== 'string' || !Number.isFinite(new Date(item.createdAt).getTime()) || (item.__v !== undefined && !validCount(item.__v)) || ['subject', 'sender_phone'].some(key => item[key] != null && typeof item[key] !== 'string'))) throw new Error('لا تتطابق بيانات الرسائل مع الشركة المحددة. حدّث القائمة.');
      return data as InboxResponse;
    },
    async setRead(message: InboxMessage, companyId: string, desired: boolean, signal?: AbortSignal): Promise<void> {
      if (message.company_id !== companyId) throw new Error('لا تتطابق الرسالة مع الشركة المحددة. حدّث القائمة.');
      const expected = message.__v || 0;
      const data = await request('/messages/' + encodeURIComponent(message._id) + '/read', { method: 'PATCH', signal, body: JSON.stringify({ company_id: companyId, is_read: desired, expected_version: expected }) });
      if (!('message_id' in data) || data.message_id !== message._id || !('company_id' in data) || data.company_id !== companyId || !('is_read' in data) || data.is_read !== desired || !('version' in data) || data.version !== expected + 1) throw new Error('تعذر تأكيد حفظ حالة القراءة. حدّث القائمة قبل تكرار العملية.');
    },
  };
}
