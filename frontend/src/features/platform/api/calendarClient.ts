import { API_BASE_URL } from '../../../shared/api';
import { isCivilDate, validMonth, eventErrors, eventPayload, type EventDraft, type CalendarState } from '../utils/calendar';
export interface CalendarEvent { id: string; title: string; date: string; color: string; is_archived: boolean; version: number; updatedAt: string | null }
export interface CalendarResult { success: true; month: string; date: string; state: CalendarState; total: number; page: number; pages: number; limit: number; matching: number; counts: { all: number; active: number; archived: number }; days: { date: string; count: number }[]; events: CalendarEvent[] }
export class CalendarError extends Error { constructor(message: string, public status = 0, public uncertain = false) { super(message); } }
const tokenNow = () => { try { return localStorage.getItem('token'); } catch { return null; } };
const count = (value: unknown) => Number.isSafeInteger(value) && Number(value) >= 0;
function readEvent(value: unknown): CalendarEvent { const event = value as CalendarEvent; if (!event || typeof event.id !== 'string' || !event.id || typeof event.title !== 'string' || !event.title.trim() || event.title.length > 200 || !isCivilDate(event.date) || typeof event.color !== 'string' || !/^#[a-f\d]{6}$/i.test(event.color) || typeof event.is_archived !== 'boolean' || !count(event.version) || (event.updatedAt !== null && (typeof event.updatedAt !== 'string' || !Number.isFinite(Date.parse(event.updatedAt))))) throw new CalendarError('تعذر التحقق من بيانات النشاط ونسخته. أعد التحميل.'); return { id: event.id, title: event.title, date: event.date, color: event.color, is_archived: event.is_archived, version: event.version, updatedAt: event.updatedAt }; }
export function createCalendarClient(accountId: string, role: string) {
  const token = tokenNow();
  async function request(path: string, options: RequestInit = {}) {
    const write = !!options.method && options.method !== 'GET';
    if (!accountId || role !== 'admin' || !token || tokenNow() !== token) throw new CalendarError('تغيّرت الجلسة أو لا تملك صلاحية الإدارة. حدّث الصفحة.', 401);
    let response: Response; try { response = await fetch(API_BASE_URL + '/management/events' + path, { ...options, credentials: 'include', cache: 'no-store', headers: { Authorization: 'Bearer ' + token, ...(options.body ? { 'Content-Type': 'application/json' } : {}) } }); }
    catch (failure) { if (options.signal?.aborted) throw failure; throw new CalendarError(write ? 'تعذر تأكيد الحفظ. راجع التقويم قبل تكرار العملية.' : 'تعذر الاتصال بخدمة التقويم. أعد المحاولة.', 0, write); }
    const data: unknown = await response.json().catch(() => null);
    if (tokenNow() !== token) throw new CalendarError('تغيّرت الجلسة أثناء الطلب. حدّث الصفحة لمراجعة البيانات.', 401, write);
    if (!response.ok) throw new CalendarError(response.status === 409 ? 'تغيّر النشاط أو اختلف طلب إضافته. أعد تحميل أحدث البيانات.' : response.status === 400 ? 'راجع الحقول والتاريخ والنسخة المطلوبة.' : response.status === 401 ? 'انتهت الجلسة. سجّل الدخول مجددًا.' : response.status === 403 ? 'التقويم متاح للمدير فقط.' : response.status === 404 ? 'النشاط لم يعد متاحًا.' : 'تعذر تأكيد العملية. حدّث التقويم وأعد المحاولة.', response.status, write && response.status >= 500);
    if (!data || typeof data !== 'object' || !('success' in data) || data.success !== true) throw new CalendarError('تعذر قراءة رد التقويم. أعد التحميل قبل المتابعة.', 0, write);
    return data;
  }
  return {
    async list(query: URLSearchParams, signal?: AbortSignal): Promise<CalendarResult> {
      const data = await request('/list?' + query, { signal }) as unknown as CalendarResult;
      if (!validMonth(data.month) || !isCivilDate(data.date) || data.month !== query.get('month') || data.date !== query.get('date') || data.state !== query.get('state') || !count(data.total) || !count(data.page) || data.page < 1 || !count(data.pages) || data.pages < data.page || !count(data.limit) || data.limit < 1 || data.limit > 100 || data.pages !== Math.max(1, Math.ceil(data.total / data.limit)) || !count(data.matching) || !data.counts || ['all', 'active', 'archived'].some(key => !count((data.counts as unknown as Record<string, unknown>)[key])) || data.counts.active + data.counts.archived !== data.counts.all || data.matching > data.counts.all || !Array.isArray(data.days) || data.days.length > 31 || data.days.some(day => !day || !isCivilDate(day.date) || !day.date.startsWith(data.month) || !count(day.count) || day.count < 1) || new Set(data.days.map(day => day.date)).size !== data.days.length || data.days.reduce((sum, day) => sum + day.count, 0) !== data.matching || (data.days.find(day => day.date === data.date)?.count || 0) !== data.total || !Array.isArray(data.events) || data.events.length > Math.min(data.total, data.limit)) throw new CalendarError('لا تتطابق تواريخ التقويم أو أعداده مع العرض المطلوب. أعد التحميل.');
      const events = data.events.map(readEvent); if (new Set(events.map(event => event.id)).size !== events.length || events.some(event => event.date !== data.date || (data.state === 'active' && event.is_archived) || (data.state === 'archived' && !event.is_archived))) throw new CalendarError('لا تتطابق الأنشطة مع اليوم أو الحالة المختارة. أعد التحميل.'); return { ...data, events };
    },
    async detail(id: string, signal?: AbortSignal) { const data = await request('/' + encodeURIComponent(id), { signal }); const event = readEvent('event' in data ? data.event : null); if (event.id !== id) throw new CalendarError('لا يتطابق النشاط مع اختيارك. أعد فتحه.'); return event; },
    async save(draft: EventDraft, original: CalendarEvent | null, requestId: string, signal?: AbortSignal) {
      if (Object.keys(eventErrors(draft)).length || original?.is_archived) throw new CalendarError('راجع الحقول واسترجع النشاط المؤرشف قبل تعديله.');
      const payload = eventPayload(draft); if (original && Object.entries(payload).every(([key, value]) => original[key as keyof CalendarEvent] === value)) throw new CalendarError('لم تتغير بيانات النشاط.');
      if (!original && !/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(requestId)) throw new CalendarError('تعذر تجهيز طلب الإضافة. أعد فتح النموذج.');
      const data = await request(original ? '/' + encodeURIComponent(original.id) : '', { method: original ? 'PUT' : 'POST', signal, body: JSON.stringify({ ...payload, ...(original ? { expected_version: original.version } : { request_id: requestId }) }) });
      let event: CalendarEvent; try { event = readEvent(original ? 'event' in data ? data.event : null : data); } catch { throw new CalendarError('تعذر تأكيد النشاط المحفوظ. راجع التقويم قبل تكرار الحفظ.', 0, true); }
      if (original ? event.id !== original.id || event.version !== original.version + 1 || event.is_archived || Object.entries(payload).some(([key, value]) => event[key as keyof CalendarEvent] !== value) : !('request_id' in data) || data.request_id !== requestId || !('replayed' in data) || typeof data.replayed !== 'boolean' || (!data.replayed && (event.version !== 0 || event.is_archived || Object.entries(payload).some(([key, value]) => event[key as keyof CalendarEvent] !== value)))) throw new CalendarError('لا يطابق تأكيد الحفظ النشاط المطلوب. راجع التقويم قبل التكرار.', 0, true);
      return { event, replayed: 'replayed' in data && data.replayed === true };
    },
    async state(original: CalendarEvent, archived: boolean, signal?: AbortSignal) {
      if (archived === original.is_archived) throw new CalendarError('لم تتغير حالة النشاط.'); const data = await request('/' + encodeURIComponent(original.id) + '/state', { method: 'PATCH', signal, body: JSON.stringify({ is_archived: archived, expected_version: original.version }) });
      let event: CalendarEvent; try { event = readEvent('event' in data ? data.event : null); } catch { throw new CalendarError('تعذر تأكيد حالة النشاط. أعد التحميل.', 0, true); }
      if (event.id !== original.id || event.version !== original.version + 1 || event.is_archived !== archived || ['title', 'date', 'color'].some(key => event[key as keyof CalendarEvent] !== original[key as keyof CalendarEvent])) throw new CalendarError('لا يطابق رد الحالة النشاط المطلوب. أعد التحميل.', 0, true); return event;
    },
  };
}
export type CalendarClient = ReturnType<typeof createCalendarClient>;
