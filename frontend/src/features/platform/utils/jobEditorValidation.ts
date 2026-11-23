import type { Job } from '../types';
import { parseJson } from './helpers';
import { JOB_TYPES, EXPERIENCE_LEVELS, REGIONS, FIELDS, CURRENCIES, isJobOpen } from './jobsSearch';
export const DEADLINE_TIME_ZONE = 'Asia/Hebron';
const partsFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: DEADLINE_TIME_ZONE, numberingSystem: 'latn', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
function parts(instant: number) { return Object.fromEntries(partsFormatter.formatToParts(new Date(instant)).filter(part => part.type !== 'literal').map(part => [part.type, Number(part.value)])); }
export function deadlineDay(iso?: string | null): string {
  const instant = iso ? new Date(iso).getTime() : NaN; if (!Number.isFinite(instant)) return '';
  const p = parts(instant); return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}
export function endOfDeadlineDay(day: string): string {
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(day)) throw new Error('Invalid day');
  const [year, month, date] = day.split('-').map(Number); const check = new Date(Date.UTC(year, month - 1, date));
  if (year < 1900 || year > 2200 || check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== date) throw new Error('Invalid day');
  const target = Date.UTC(year, month - 1, date, 23, 59, 59, 999); let instant = target;
  for (let index = 0; index < 4; index++) { const p = parts(instant); const offset = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(instant / 1000) * 1000; const next = target - offset; if (next === instant) break; instant = next; }
  const result = new Date(instant).toISOString(); const p = parts(instant);
  if (deadlineDay(result) !== day || p.hour !== 23 || p.minute !== 59 || p.second !== 59) throw new Error('Invalid local time');
  return result;
}
export interface JobDraft {
  title: string; description: string; location: string; field: string; job_type: string; experience_level: string; region: string;
  salary_min: string; salary_max: string; salary_currency: string; salary_visible: boolean; deadline: string; requirements: string; benefits: string; is_active: boolean; is_featured: boolean;
}
export type JobEditorErrors = Partial<Record<keyof JobDraft, string>>;
export function jobDraft(job?: Job): JobDraft {
  return { title: job?.title || '', description: job?.description || '', location: job?.location || '', field: job ? job.field || '' : 'تكنولوجيا', job_type: job ? job.job_type || '' : 'دوام كامل', experience_level: job ? job.experience_level || '' : 'حديث التخرج', region: job ? job.region || '' : 'ضفة',
    salary_min: job?.salary_min == null ? '' : String(job.salary_min), salary_max: job?.salary_max == null ? '' : String(job.salary_max), salary_currency: job?.salary_currency || '₪', salary_visible: job?.salary_visible ?? true, deadline: deadlineDay(job?.deadline), requirements: parseJson(job?.requirements).join('\n'), benefits: parseJson(job?.benefits).join('\n'), is_active: job?.is_active ?? true, is_featured: job?.is_featured ?? false };
}
function money(value: string): number | null {
  const text = value.trim().replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 0x660)).replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - 0x6f0)).replace(/٫/g, '.');
  if (!text) return null;
  if (!/^[0-9]+(?:\.[0-9]+)?$/.test(text) || text.length > 30 || !Number.isFinite(Number(text)) || Number(text) > 1000000000) return NaN;
  return Number(text);
}
const lines = (value: string) => value.split(/\r?\n/).map(item => item.trim()).filter(Boolean);
export function jobDeadline(form: JobDraft, original?: Job): string | null {
  if (!form.deadline) return null;
  if (original?.deadline && form.deadline === deadlineDay(original.deadline)) return original.deadline;
  return endOfDeadlineDay(form.deadline);
}
export function jobEditorErrors(form: JobDraft, original?: Job, now = Date.now()): JobEditorErrors {
  const errors: JobEditorErrors = {};
  if (form.title.trim().length < 3 || form.title.trim().length > 300) errors.title = 'استخدم عنوانًا من ٣ إلى ٣٠٠ حرف.';
  if (form.description.trim().length < 20 || form.description.trim().length > 30000) errors.description = 'اكتب وصفًا من ٢٠ إلى ٣٠٠٠٠ حرف.';
  if (form.location.trim().length > 200) errors.location = 'استخدم ٢٠٠ حرف أو أقل للموقع.';
  for (const [key, options] of [['field', FIELDS], ['job_type', JOB_TYPES], ['experience_level', EXPERIENCE_LEVELS], ['region', REGIONS], ['salary_currency', CURRENCIES]] as const) if ((form[key] || key === 'salary_currency') && !options.includes(form[key])) errors[key] = 'اختر قيمة من القائمة.';
  const minimum = money(form.salary_min); const maximum = money(form.salary_max);
  if (Number.isNaN(minimum)) errors.salary_min = 'أدخل مبلغًا بين صفر ومليار، دون فواصل الآلاف.';
  if (Number.isNaN(maximum)) errors.salary_max = 'أدخل مبلغًا بين صفر ومليار، دون فواصل الآلاف.';
  if (minimum !== null && maximum !== null && maximum < minimum) errors.salary_max = 'الحد الأعلى يجب ألا يقل عن الحد الأدنى.';
  for (const key of ['requirements', 'benefits'] as const) { const items = lines(form[key]); if (items.length > 100 || items.some(value => value.length > 500)) errors[key] = 'استخدم ١٠٠ سطر كحد أقصى، و٥٠٠ حرف لكل سطر.'; }
  try { const deadline = jobDeadline(form, original); if (form.is_active && deadline && new Date(deadline).getTime() < now && deadline !== original?.deadline) errors.deadline = 'اختر يومًا لم ينتهِ أو احفظ الوظيفة موقوفة.'; } catch { errors.deadline = 'اختر تاريخًا صحيحًا.'; }
  return errors;
}
export function jobEditorPayload(form: JobDraft, companyId: string, original?: Job) {
  return { company_id: companyId, title: form.title.trim(), description: form.description.trim(), location: form.location.trim(), field: form.field || null, job_type: form.job_type || null, experience_level: form.experience_level || null, region: form.region || null,
    salary_min: money(form.salary_min), salary_max: money(form.salary_max), salary_currency: form.salary_currency, salary_visible: form.salary_visible, deadline: jobDeadline(form, original), requirements: lines(form.requirements), benefits: lines(form.benefits), is_active: form.is_active, is_featured: form.is_featured, ...(original ? { expected_version: original.__v || 0 } : {}) };
}
export function publicationState(job: Pick<Job, 'is_active' | 'deadline'>, companyActive = true): { label: string; tone: 'success' | 'warning' | 'default' } {
  if (!job.is_active) return { label: 'موقوفة', tone: 'default' };
  if (!companyActive) return { label: 'الشركة موقوفة', tone: 'warning' };
  if (!isJobOpen(job)) return { label: 'انتهى التقديم', tone: 'warning' };
  return { label: 'التقديم مفتوح', tone: 'success' };
}
