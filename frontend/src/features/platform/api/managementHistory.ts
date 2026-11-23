import { API_BASE_URL } from '../../../shared/api';
export type HistoryKind = 'account' | 'company';
export interface HistoryState { role?: 'seeker' | 'company' | 'admin'; is_active?: boolean; is_verified?: boolean; account_linked?: boolean }
export interface HistoryEvent { actor_id: string; actor_name: string | null; actor_role: 'admin' | 'company'; at: string; request_id: string; action: string; revision: number; fields: string[]; before?: HistoryState; after?: HistoryState }
export interface HistoryResult { kind: HistoryKind; target_id: string; recorded_total: number; retained_limit: 100; older_history_available: false; events: HistoryEvent[] }
const actions = ['account.access', 'company.create', 'company.update', 'company.archive', 'company.verify', 'company.link_account'];
const fields = ['role', 'is_active', 'is_verified', 'user_id', 'name_ar', 'name_en', 'logo_url', 'cover_url', 'sector', 'size', 'founded_year', 'location', 'region', 'website', 'email', 'linkedin_url', 'about_ar', 'about_en', 'color', 'stacks'];
const objectId = (value: unknown): value is string => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
function state(value: unknown): value is HistoryState { return !!value && typeof value === 'object' && !Array.isArray(value) && Object.entries(value).every(([key, item]) => key === 'role' ? ['seeker', 'company', 'admin'].includes(item) : ['is_active', 'is_verified', 'account_linked'].includes(key) && typeof item === 'boolean'); }
function completeState(value: unknown, kind: HistoryKind) { if (!state(value)) return false; return kind === 'account' ? Object.keys(value).length === 2 && !!value.role && typeof value.is_active === 'boolean' : Object.keys(value).length === 3 && ['is_active', 'is_verified', 'account_linked'].every(key => typeof value[key as keyof HistoryState] === 'boolean'); }
export function parseManagementHistory(data: any, kind: HistoryKind, target: string): HistoryResult {
  const invalid = () => new Error('تعذر التحقق من سجل التغييرات. حدّث السجل وحاول مجددًا.');
  if (!data || data.success !== true || data.kind !== kind || data.target_id !== target || !Number.isSafeInteger(data.recorded_total) || data.recorded_total < 0 || data.retained_limit !== 100 || data.older_history_available !== false || !Array.isArray(data.events) || data.events.length !== Math.min(data.recorded_total, 100)) throw invalid();
  const events: HistoryEvent[] = data.events.map((event: any, index: number) => {
    if (!event || !objectId(event.actor_id) || !(event.actor_name === null || typeof event.actor_name === 'string' && event.actor_name.length <= 200) || !['admin', 'company'].includes(event.actor_role) || typeof event.at !== 'string' || !Number.isFinite(Date.parse(event.at)) || typeof event.request_id !== 'string' || !/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(event.request_id) || !actions.includes(event.action) || !event.action.startsWith(kind + '.') || (kind === 'account' && event.actor_role !== 'admin') || !Number.isSafeInteger(event.revision) || event.revision < 0 || index > 0 && event.revision >= data.events[index - 1].revision || !Array.isArray(event.fields) || event.fields.length > fields.length || event.fields.some((key: unknown) => typeof key !== 'string' || !fields.includes(key)) || new Set(event.fields).size !== event.fields.length || (event.before !== undefined && !state(event.before)) || !state(event.after)) throw invalid();
    const creation = event.action === 'company.create';
    if (!completeState(event.after, kind) || (creation ? event.before !== undefined || event.revision !== 0 : !completeState(event.before, kind) || event.revision < 1) || kind === 'account' && event.fields.some((key: string) => !['role', 'is_active'].includes(key)) || kind === 'company' && (event.fields.includes('role') || event.action !== 'company.update' && event.actor_role !== 'admin')) throw invalid();
    return { actor_id: event.actor_id, actor_name: event.actor_name, actor_role: event.actor_role, at: event.at, request_id: event.request_id, action: event.action, revision: event.revision, fields: [...event.fields], ...(event.before ? { before: { ...event.before } } : {}), after: { ...event.after } };
  });
  return { kind, target_id: target, recorded_total: data.recorded_total, retained_limit: 100, older_history_available: false, events };
}
export function createManagementHistoryClient(accountId: string, role: string) {
  const tokenNow = () => { try { return localStorage.getItem('token'); } catch { return null; } }; const token = tokenNow();
  const isCurrent = () => !!accountId && role === 'admin' && !!token && tokenNow() === token;
  return { isCurrent, async read(kind: HistoryKind, target: string, signal?: AbortSignal): Promise<HistoryResult> {
    if (!isCurrent()) throw new Error('تغيّرت الجلسة أو لا تملك صلاحية الإدارة. سجل الدخول مجددًا.');
    if (!['account', 'company'].includes(kind) || !objectId(target)) throw new Error('معرّف السجل غير صالح.');
    signal?.throwIfAborted(); let response: Response;
    try { response = await fetch(API_BASE_URL + '/admin/' + (kind === 'account' ? 'users' : 'companies') + '/' + encodeURIComponent(target) + '/history', { signal, credentials: 'omit', cache: 'no-store', headers: { Authorization: 'Bearer ' + token } }); }
    catch { signal?.throwIfAborted(); throw new Error('تعذر الاتصال بسجل التغييرات. أعد المحاولة.'); }
    const data = await response.json().catch(() => null); signal?.throwIfAborted();
    if (!isCurrent()) throw new Error('تغيّرت الجلسة أثناء القراءة. سجل الدخول مجددًا.');
    if (!response.ok) throw new Error(response.status === 401 ? 'انتهت الجلسة. سجل الدخول مجددًا.' : response.status === 403 ? 'سجل التغييرات متاح للمدير فقط.' : response.status === 404 ? 'الحساب أو الشركة لم يعد متاحًا.' : response.status === 429 ? 'طلبات كثيرة. انتظر قليلًا وأعد المحاولة.' : 'تعذر تحميل سجل التغييرات. أعد المحاولة.');
    return parseManagementHistory(data, kind, target);
  } };
}
export type ManagementHistoryClient = ReturnType<typeof createManagementHistoryClient>;
