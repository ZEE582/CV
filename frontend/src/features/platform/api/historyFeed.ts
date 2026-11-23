import { API_BASE_URL } from '../../../shared/api';
import { parseManagementHistory, type HistoryEvent, type HistoryKind } from './managementHistory';
import { historyActions } from '../utils/historyFeed';
export interface HistoryFeedItem { kind: HistoryKind; target_id: string; target_name: string; event: HistoryEvent }
export interface HistoryFeedResult { total: number; page: number; pages: number; limit: number; out_of_range: boolean; items: HistoryFeedItem[] }
function expectedFilters(query: URLSearchParams) { return Object.fromEntries(['kind', 'action', 'search', 'actor_id', 'target_id', 'from', 'to'].map(key => [key, query.get(key) || (key === 'kind' || key === 'action' ? 'all' : '')])); }
export function parseHistoryFeed(data: any, query: URLSearchParams): HistoryFeedResult {
  const invalid = () => new Error('تعذر التحقق من سجل الإدارة. حدّث النتائج وحاول مجددًا.'); const integer = (value: unknown) => Number.isSafeInteger(value) && Number(value) >= 0;
  const expected = expectedFilters(query);
  if (!data || data.success !== true || !data.filters || Object.entries(expected).some(([key, value]) => data.filters[key] !== value) || !integer(data.total) || data.page !== Number(query.get('page') || 1) || data.limit !== Number(query.get('limit') || 20) || data.limit < 1 || data.limit > 50 || !integer(data.pages) || data.pages !== Math.max(1, Math.ceil(data.total / data.limit)) || data.out_of_range !== (data.page > data.pages) || data.retained_limit_per_target !== 100 || data.older_history_available !== false || !Array.isArray(data.items) || data.items.length !== (data.out_of_range ? 0 : Math.min(data.limit, Math.max(0, data.total - (data.page - 1) * data.limit)))) throw invalid();
  const keys = new Set<string>(); let prior: { at: number; key: string; revision: number } | null = null;
  const items = data.items.map((item: any) => {
    if (!item || !['account', 'company'].includes(item.kind) || typeof item.target_id !== 'string' || !/^[a-f\d]{24}$/.test(item.target_id) || typeof item.target_name !== 'string' || item.target_name.length > 400 || expected.kind !== 'all' && item.kind !== expected.kind || expected.target_id && item.target_id !== expected.target_id) throw invalid();
    const event = parseManagementHistory({ success: true, kind: item.kind, target_id: item.target_id, recorded_total: 1, retained_limit: 100, older_history_available: false, events: [item.event] }, item.kind, item.target_id).events[0];
    const at = Date.parse(event.at); const orderKey = item.kind + ':' + item.target_id; const key = orderKey + ':' + event.revision;
    if (keys.has(key) || prior && (at > prior.at || at === prior.at && (orderKey < prior.key || orderKey === prior.key && event.revision >= prior.revision)) || expected.action !== 'all' && event.action !== expected.action || expected.actor_id && event.actor_id !== expected.actor_id || expected.from && at < Date.parse(expected.from + 'T00:00:00Z') || expected.to && at >= Date.parse(expected.to + 'T00:00:00Z') + 86400000 || !Object.hasOwn(historyActions, event.action)) throw invalid();
    keys.add(key); prior = { at, key: orderKey, revision: event.revision }; return { kind: item.kind, target_id: item.target_id, target_name: item.target_name, event };
  });
  return { total: data.total, page: data.page, pages: data.pages, limit: data.limit, out_of_range: data.out_of_range, items };
}
export function createHistoryFeedClient(accountId: string, role: string) {
  const tokenNow = () => { try { return localStorage.getItem('token'); } catch { return null; } }; const token = tokenNow(); const isCurrent = () => !!accountId && role === 'admin' && !!token && tokenNow() === token;
  return { isCurrent, async list(query: URLSearchParams, signal?: AbortSignal): Promise<HistoryFeedResult> {
    if (!isCurrent()) throw new Error('تغيّرت الجلسة أو لا تملك صلاحية الإدارة. سجل الدخول مجددًا.'); signal?.throwIfAborted(); let response: Response;
    try { response = await fetch(API_BASE_URL + '/admin/history?' + query, { signal, credentials: 'omit', cache: 'no-store', headers: { Authorization: 'Bearer ' + token } }); }
    catch { signal?.throwIfAborted(); throw new Error('تعذر الاتصال بسجل الإدارة. أعد المحاولة.'); }
    const data = await response.json().catch(() => null); signal?.throwIfAborted(); if (!isCurrent()) throw new Error('تغيّرت الجلسة أثناء القراءة. سجل الدخول مجددًا.');
    if (!response.ok) throw new Error(response.status === 401 ? 'انتهت الجلسة. سجل الدخول مجددًا.' : response.status === 403 ? 'سجل الإدارة متاح للمدير فقط.' : response.status === 400 ? 'راجع الفلاتر والتواريخ ومعرّفات السجلات.' : response.status === 429 ? 'طلبات كثيرة. انتظر قليلًا وأعد المحاولة.' : response.status === 503 ? 'استغرق البحث وقتًا طويلًا أو الخدمة غير متاحة. ضيّق الفلاتر وحاول مجددًا.' : 'تعذر تحميل سجل الإدارة. أعد المحاولة.');
    return parseHistoryFeed(data, query);
  } };
}
export type HistoryFeedClient = ReturnType<typeof createHistoryFeedClient>;
