import { applicationStatuses, type ApplicationStatus } from './recruitment';
export interface ApplicationHistoryEvent {
  from_status: ApplicationStatus | null; to_status: ApplicationStatus; at: string; version: number; actor_role: 'seeker' | 'company' | 'admin';
}
export interface ApplicationHistory {
  application_id: string; status: ApplicationStatus; version: number; submitted_at: string; history_started_at: string | null;
  complete: boolean; total_events: number; truncated: boolean; events: ApplicationHistoryEvent[];
}
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const status = (value: unknown): value is ApplicationStatus => typeof value === 'string' && Object.hasOwn(applicationStatuses, value);
const date = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value));
export function readApplicationHistory(data: Record<string, unknown>, applicationId: string): ApplicationHistory {
  const invalid = () => new Error('تعذر التحقق من سجل حالة الطلب. أغلق النافذة وأعد تحميل الطلبات.');
  if (data.success !== true || data.application_id !== applicationId || !status(data.status) || !Number.isSafeInteger(data.version) || Number(data.version) < 0 || !date(data.submitted_at)
    || (data.history_started_at !== null && !date(data.history_started_at)) || typeof data.complete !== 'boolean' || typeof data.truncated !== 'boolean'
    || !Number.isSafeInteger(data.total_events) || Number(data.total_events) < 0 || !Array.isArray(data.events) || data.events.length !== Math.min(Number(data.total_events), 100)
    || data.truncated !== (Number(data.total_events) > data.events.length)) throw invalid();
  const events: ApplicationHistoryEvent[] = [];
  for (const item of data.events) {
    const previous = events.at(-1);
    if (!object(item) || !status(item.to_status) || (item.from_status !== null && !status(item.from_status)) || item.from_status === item.to_status || !date(item.at)
      || !Number.isSafeInteger(item.version) || Number(item.version) < 0 || Number(item.version) > Number(data.version) || typeof item.actor_role !== 'string' || !['seeker', 'company', 'admin'].includes(item.actor_role)
      || (item.from_status === null && (item.version !== 0 || item.to_status !== 'pending' || item.actor_role !== 'seeker'))
      || (item.from_status !== null && (item.version === 0 || item.actor_role === 'seeker'))
      || (previous && (Number(item.version) <= previous.version || item.from_status !== previous.to_status))) throw invalid();
    events.push({ from_status: item.from_status as ApplicationStatus | null, to_status: item.to_status, at: item.at, version: Number(item.version), actor_role: item.actor_role as ApplicationHistoryEvent['actor_role'] });
  }
  if ((events.length && events.at(-1)!.to_status !== data.status) || (data.complete && (data.truncated || events[0]?.from_status !== null))) throw invalid();
  return { application_id: applicationId, status: data.status, version: Number(data.version), submitted_at: data.submitted_at, history_started_at: data.history_started_at as string | null,
    complete: data.complete, total_events: Number(data.total_events), truncated: data.truncated, events };
}
export function historyDate(value: string): string {
  return date(value) ? new Intl.DateTimeFormat('ar', { timeZone: 'Asia/Hebron', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'غير محدد';
}
