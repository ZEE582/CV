import { API_BASE_URL } from '../../../shared/api';
import { aiHistory, aiQuestionError, type AiSource, type AiTurn } from '../utils/ai';
export interface AiAvailability { success: true; available: boolean; provider: 'Groq'; max_message_chars: 4000; max_history_messages: 6 }
export interface AiReply { success: true; request_id: string; provider: 'Groq'; reply: string; include_jobs: boolean; sources: AiSource[] }
export class AiError extends Error { constructor(message: string, public code = 'AI_ERROR', public retryAfter = 0) { super(message); } }
function tokenNow() { try { return localStorage.getItem('token'); } catch { return null; } }
export function createAiClient() {
  const token = tokenNow();
  async function request(path: string, options: RequestInit = {}) {
    if (tokenNow() !== token) throw new AiError('تغيّر الحساب. أعد فتح المساعد قبل الإرسال.', 'AI_SESSION_CHANGED');
    let response: Response; try { response = await fetch(API_BASE_URL + '/ai/' + path, { ...options, credentials: 'omit', cache: 'no-store', headers: options.body ? { 'Content-Type': 'application/json' } : {} }); }
    catch (failure) { if (options.signal?.aborted) throw failure; throw new AiError('تعذر الاتصال بالمساعد. سؤالك محفوظ في هذه الصفحة؛ حاول لاحقًا.', 'AI_NETWORK'); }
    const data: unknown = await response.json().catch(() => null); if (tokenNow() !== token) throw new AiError('تغيّر الحساب أثناء الطلب. أعد فتح المساعد.', 'AI_SESSION_CHANGED');
    if (!response.ok) {
      const code = data && typeof data === 'object' && 'code' in data && typeof data.code === 'string' ? data.code : '';
      const seconds = Number(response.headers.get('Retry-After')); const retry = Number.isFinite(seconds) && seconds > 0 ? Math.min(900, Math.ceil(seconds)) : response.status === 429 ? 60 : 0;
      throw new AiError(code === 'AI_UNAVAILABLE' ? 'المساعد غير متاح حاليًا. يمكنك متابعة الوظائف أو العمل على سيرتك الذاتية.' : code === 'AI_TIMEOUT' || response.status === 504 ? 'تأخر الرد. احتفظ بسؤالك وحاول لاحقًا.' : response.status === 429 || code === 'AI_BUSY' ? 'المساعد مشغول أو وصلت للحد المؤقت. انتظر قليلًا ثم أرسل مجددًا.' : response.status === 400 ? 'راجع السؤال وموافقة المعالجة الخارجية، أو ابدأ محادثة جديدة إذا تعذر قراءة السياق.' : 'تعذر الحصول على إجابة صالحة. سؤالك ما زال هنا للمراجعة.', ['AI_UNAVAILABLE', 'AI_TIMEOUT', 'AI_BUSY', 'AI_INVALID_INPUT', 'AI_BAD_RESPONSE', 'AI_PROVIDER_ERROR'].includes(code) ? code : response.status === 429 ? 'AI_RATE_LIMIT' : 'AI_ERROR', retry);
    }
    if (!data || typeof data !== 'object' || !('success' in data) || data.success !== true) throw new AiError('لم يصل تأكيد صالح من المساعد. لم تُضف إجابة إلى المحادثة.', 'AI_BAD_RESPONSE'); return data;
  }
  return {
    async status(signal?: AbortSignal): Promise<AiAvailability> { const data = await request('status', { signal }) as unknown as AiAvailability; if (typeof data.available !== 'boolean' || data.provider !== 'Groq' || data.max_message_chars !== 4000 || data.max_history_messages !== 6) throw new AiError('تعذر قراءة حالة المساعد. أعد التحقق.', 'AI_STATUS_ERROR'); return data; },
    async send(question: string, turns: AiTurn[], allow: boolean, includeJobs: boolean, requestId: string, signal?: AbortSignal): Promise<AiReply> {
      const error = aiQuestionError(question); if (error) throw new AiError(error, 'AI_INVALID_INPUT'); if (allow !== true || typeof includeJobs !== 'boolean') throw new AiError('وافق على معالجة السؤال خارجيًا قبل الإرسال.', 'AI_CONSENT_REQUIRED'); if (!/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(requestId)) throw new AiError('تعذر تجهيز السؤال. حاول من جديد.', 'AI_INVALID_INPUT');
      const data = await request('chat', { method: 'POST', signal, body: JSON.stringify({ message: question.trim(), history: aiHistory(turns), request_id: requestId, allow_external_processing: true, include_jobs: includeJobs }) }) as unknown as AiReply;
      if (data.request_id !== requestId || data.provider !== 'Groq' || typeof data.reply !== 'string' || !data.reply.trim() || data.reply.length > 8000 || data.include_jobs !== includeJobs || !Array.isArray(data.sources) || data.sources.length > 10 || (!includeJobs && data.sources.length) || data.sources.some(source => !source || !/^[a-f\d]{24}$/i.test(source.id) || !/^[a-f\d]{24}$/i.test(source.company_id) || ['title', 'company_name', 'location', 'job_type', 'experience_level'].some(key => typeof (source as unknown as Record<string, unknown>)[key] !== 'string' || String((source as unknown as Record<string, unknown>)[key]).length > 200)) || new Set(data.sources.map(source => source.id)).size !== data.sources.length) throw new AiError('لا تطابق الإجابة السؤال أو ملخص الوظائف المطلوب. لم تُضف إلى المحادثة.', 'AI_BAD_RESPONSE');
      return { ...data, reply: data.reply.trim() };
    },
  };
}
export type AiClient = ReturnType<typeof createAiClient>;
