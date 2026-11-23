import { parseHistoryFeed, type HistoryFeedResult } from '../api/historyFeed';
import { historyActions, validHistoryDay } from './historyFeed';
import { historyFieldLabels, historyStateText } from './managementHistoryLabels';

export interface HistoryExportOptions { names: boolean; identifiers: boolean }
export interface HistoryExportSnapshot { capturedAt: string; query: string; data: HistoryFeedResult }
export const defaultHistoryExportOptions: Readonly<HistoryExportOptions> = Object.freeze({ names: false, identifiers: false });
const filterKeys = ['kind', 'action', 'search', 'actor_id', 'target_id', 'from', 'to'] as const;
function validQuery(query: URLSearchParams) {
  const keys = [...query.keys()]; const kind = query.get('kind') || 'all', action = query.get('action') || 'all';
  const page = Number(query.get('page') || 1), limit = Number(query.get('limit') || 20);
  const search = query.get('search') || '', from = query.get('from') || '', to = query.get('to') || '';
  if (new Set(keys).size !== keys.length || keys.some(key => ![...filterKeys, 'page', 'limit'].includes(key)) || !['all', 'account', 'company'].includes(kind) || (action !== 'all' && (!Object.hasOwn(historyActions, action) || kind !== 'all' && !action.startsWith(kind + '.'))) || !Number.isSafeInteger(page) || page < 1 || page > 1000000 || !Number.isSafeInteger(limit) || limit < 1 || limit > 50 || search.length > 120 || search.trim() !== search || [from, to].some(value => !!value && !validHistoryDay(value)) || from && to && from > to || ['actor_id', 'target_id'].some(key => !!query.get(key) && !/^[a-f\d]{24}$/.test(query.get(key)!))) throw new Error('معايير نسخة السجل غير صالحة. حدّث الصفحة قبل التصدير.');
  return Object.fromEntries(filterKeys.map(key => [key, query.get(key) || (key === 'kind' || key === 'action' ? 'all' : '')]));
}
function freeze<T>(value: T): T { if (value && typeof value === 'object') { for (const child of Object.values(value)) freeze(child); Object.freeze(value); } return value; }
export function createHistoryExportSnapshot(data: HistoryFeedResult, queryInput: URLSearchParams, now = new Date()): HistoryExportSnapshot {
  const query = new URLSearchParams(queryInput); const filters = validQuery(query);
  if (!Number.isFinite(now.getTime())) throw new Error('تعذر تحديد وقت تجهيز النسخة.');
  const verified = parseHistoryFeed({ ...data, success: true, filters, retained_limit_per_target: 100, older_history_available: false }, query);
  if (verified.out_of_range || !verified.items.length) throw new Error('لا توجد عمليات محمّلة صالحة للتصدير.');
  return freeze({ capturedAt: now.toISOString(), query: query.toString(), data: verified });
}
function checked(snapshot: HistoryExportSnapshot, options: HistoryExportOptions) {
  if (!snapshot || typeof snapshot.capturedAt !== 'string' || !Number.isFinite(Date.parse(snapshot.capturedAt)) || new Date(snapshot.capturedAt).toISOString() !== snapshot.capturedAt || typeof snapshot.query !== 'string' || !options || typeof options.names !== 'boolean' || typeof options.identifiers !== 'boolean' || Object.keys(options).some(key => !['names', 'identifiers'].includes(key))) throw new Error('خيارات التصدير أو بيانات النسخة غير صالحة.');
  return createHistoryExportSnapshot(snapshot.data, new URLSearchParams(snapshot.query), new Date(snapshot.capturedAt));
}
export function historyExportDocument(snapshot: HistoryExportSnapshot, options: HistoryExportOptions = defaultHistoryExportOptions) {
  const safe = checked(snapshot, options); const query = new URLSearchParams(safe.query); const filters = validQuery(query);
  const targets = new Map<string, string>(), actors = new Map<string, string>(); let accounts = 0, companies = 0;
  const events = safe.data.items.map(item => {
    const targetKey = item.kind + ':' + item.target_id;
    if (!targets.has(targetKey)) targets.set(targetKey, item.kind === 'account' ? 'حساب ' + (++accounts) : 'شركة ' + (++companies));
    if (!actors.has(item.event.actor_id)) actors.set(item.event.actor_id, 'منفّذ ' + (actors.size + 1));
    return { target_ref: targets.get(targetKey)!, target_kind: item.kind, actor_ref: actors.get(item.event.actor_id)!, actor_role: item.event.actor_role, at: item.event.at, action: item.event.action, fields: [...item.event.fields], ...(item.event.before ? { before: { ...item.event.before } } : {}), after: { ...item.event.after }, ...(options.names ? { target_name: item.target_name, actor_name: item.event.actor_name } : {}), ...(options.identifiers ? { references: { target_id: item.target_id, actor_id: item.event.actor_id, request_id: item.event.request_id, revision: item.event.revision } } : {}) };
  });
  return { format: 'ttwar.management-history-page', version: 1, captured_at: safe.capturedAt, scope: { page: safe.data.page, page_size: safe.data.limit, exported_count: events.length, matching_retained_count: safe.data.total, retained_limit_per_target: 100, complete_history: false, all_matching_results_included: events.length === safe.data.total, note: 'نسخة من الصفحة المحمّلة فقط؛ لا تشمل بقية الصفحات أو التاريخ الأقدم. الأسماء إن أُضيفت فهي الحالية وقت التحميل.', filters: { kind: filters.kind, action: filters.action, from: filters.from, to: filters.to, name_search_applied: !!filters.search, actor_filter_applied: !!filters.actor_id, target_filter_applied: !!filters.target_id, ...(options.names ? { search: filters.search } : {}), ...(options.identifiers ? { actor_id: filters.actor_id, target_id: filters.target_id } : {}) } }, included: { names: options.names, identifiers: options.identifiers }, events };
}
export function historyExportTable(snapshot: HistoryExportSnapshot, options: HistoryExportOptions = defaultHistoryExportOptions) {
  const doc = historyExportDocument(snapshot, options); const filters = doc.scope.filters;
  const filterText = ['النوع: ' + ({ all: 'الحسابات والشركات', account: 'الحسابات', company: 'الشركات' } as Record<string, string>)[filters.kind], 'العملية: ' + (filters.action === 'all' ? 'كل العمليات' : historyActions[filters.action]), filters.from && 'من: ' + filters.from, filters.to && 'إلى: ' + filters.to, filters.name_search_applied && (options.names ? 'بحث الاسم: ' + filters.search : 'بحث بالاسم دون تضمين نصه'), filters.actor_filter_applied && (options.identifiers ? 'المنفّذ: ' + filters.actor_id : 'تصفية بمعرّف المنفّذ دون تضمينه'), filters.target_filter_applied && (options.identifiers ? 'الهدف: ' + filters.target_id : 'تصفية بمعرّف الهدف دون تضمينه')].filter(Boolean).join('؛ ');
  const headers = ['مرجع الهدف داخل النسخة', 'نوع السجل', 'مرجع المنفّذ داخل النسخة', 'دور المنفّذ', 'العملية', 'وقت العملية UTC', 'الحقول المتأثرة', 'قبل الحفظ', 'بعد الحفظ', 'الصفحة المحمّلة', 'عدد العمليات في النسخة', 'عدد النتائج المحفوظة المطابقة', 'وقت تجهيز النسخة UTC', 'الفلاتر', 'نطاق النسخة', ...(options.names ? ['اسم الهدف الحالي', 'اسم المنفّذ الحالي'] : []), ...(options.identifiers ? ['معرّف الهدف', 'معرّف المنفّذ', 'مرجع الطلب', 'نسخة السجل'] : [])];
  const rows = doc.events.map(event => [event.target_ref, event.target_kind === 'account' ? 'حساب' : 'شركة', event.actor_ref, event.actor_role === 'admin' ? 'مدير' : 'مسؤول الشركة', historyActions[event.action], event.at, event.fields.map(field => historyFieldLabels[field]).join('، ') || 'حفظ دون تغيير في قيم الحقول', event.before ? historyStateText(event.before) : 'غير متوفر قبل الإنشاء', historyStateText(event.after), String(doc.scope.page), String(doc.scope.exported_count), String(doc.scope.matching_retained_count), doc.captured_at, filterText, 'الصفحة المحمّلة فقط؛ ضمن آخر100عملية محفوظة لكل هدف؛ ليس تاريخًا كاملًا', ...(options.names ? [event.target_name || 'اسم غير متاح', event.actor_name || 'اسم غير متاح'] : []), ...(options.identifiers ? [event.references!.target_id, event.references!.actor_id, event.references!.request_id, String(event.references!.revision)] : [])]);
  return { headers, rows };
}
function csvCell(value: string) { const guarded = /^[\s\p{Cc}\p{Cf}]*[=+@-]/u.test(value) ? "'" + value : value; return '"' + guarded.replace(/"/g, '""') + '"'; }
export function historyExportArtifact(snapshot: HistoryExportSnapshot, options: HistoryExportOptions, format: 'csv' | 'json') {
  if (!['csv', 'json'].includes(format)) throw new Error('صيغة التصدير غير مدعومة.');
  const safe = checked(snapshot, options);
  let text: string;
  if (format === 'json') text = JSON.stringify(historyExportDocument(safe, options), null, 2) + '\n';
  else { const table = historyExportTable(safe, options); text = '\ufeff' + [table.headers, ...table.rows].map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n'; }
  if (new TextEncoder().encode(text).byteLength > 1024 * 1024) throw new Error('تجاوزت النسخة الحد المسموح. ضيّق الصفحة وحاول مجددًا.');
  return { text, mime: format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json;charset=utf-8', filename: 'TTWar_Management_History_Page_' + safe.data.page + '_' + safe.capturedAt.slice(0, 10) + '.' + format };
}
export function requestHistoryExportDownload(snapshot: HistoryExportSnapshot, options: HistoryExportOptions, format: 'csv' | 'json', isCurrent: () => boolean) {
  if (!isCurrent()) throw new Error('تغيّرت الجلسة أو نتائج الصفحة. أغلق المعاينة وأعد تحميل النتائج.');
  const artifact = historyExportArtifact(snapshot, options, format);
  if (!isCurrent()) throw new Error('تغيّرت الجلسة أو نتائج الصفحة. أغلق المعاينة وأعد تحميل النتائج.');
  let url: string | undefined; let link: HTMLAnchorElement | undefined;
  try { url = URL.createObjectURL(new Blob([artifact.text], { type: artifact.mime })); link = document.createElement('a'); link.href = url; link.download = artifact.filename; document.body.appendChild(link); if (!isCurrent()) throw new Error('Session changed'); link.click(); }
  catch { throw new Error('تعذر طلب تنزيل النسخة. تحقق من الجلسة والنتائج وحاول مجددًا.'); }
  finally { try { link?.remove(); } catch { /* Still release the owned URL if DOM cleanup fails. */ } if (url) { const ownedUrl = url; try { window.setTimeout(() => URL.revokeObjectURL(ownedUrl), 30000); } catch { URL.revokeObjectURL(ownedUrl); } } }
  return artifact.filename;
}
