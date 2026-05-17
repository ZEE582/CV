import type { Job } from '../types';

/** أول حرفين من الاسم */
export function ini(name = ''): string {
  const w = name.trim().split(/\s+/);
  return w.length >= 2 ? w[0][0] + w[1][0] : name.slice(0, 2) || '؟؟';
}

/** وقت نسبي بالعربي */
export function ago(dateStr?: string | null): string {
  if (!dateStr) return '';
  const h = Math.floor((Date.now() - new Date(dateStr).getTime()) / 3_600_000);
  if (h < 1)  return 'منذ لحظات';
  if (h < 24) return `منذ ${h} ساعة`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'أمس';
  if (d < 7)   return `منذ ${d} أيام`;
  return `منذ ${Math.floor(d / 7)} أسابيع`;
}

/** تنسيق الراتب */
export function fmtSal(job: Job): string {
  if (!job.salary_visible || (!job.salary_min && !job.salary_max)) return 'يُحدد لاحقاً';
  return `${(job.salary_min || 0).toLocaleString()}–${(job.salary_max || 0).toLocaleString()} ${job.salary_currency || '₪'}`;
}

/** parse مصفوفة من أي قيمة */
export function parseJson(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v as string[];
  try { return JSON.parse(v as string) as string[]; } catch { return []; }
}

/** الحصول على معرف الوظيفة (يدعم _id وid) */
export function jobId(job: Job): string {
  return job._id || job.id || '';
}

/** الحصول على معرف الشركة */
export function companyId(job: Job): string {
  return typeof job.company_id === 'object'
    ? (job.company_id as any)?._id || String(job.company_id)
    : job.company_id;
}

/** لون الوظيفة */
const PALETTE = ['#7b68ee','#6366f1','#8b5cf6','#3b82f6','#0ea5e9','#06b6d4','#10b981','#f59e0b'];
export function jobColor(job: Job): string {
  if (job.color && !['#1a7a4a','#0d5c30'].includes(job.color)) return job.color;
  const id = jobId(job);
  return PALETTE[id ? id.charCodeAt(0) % PALETTE.length : 0];
}

/** هل الوظيفة تقنية؟ */
const IT_KW = ['backend','frontend','full stack','ui','ux','qa','devops','cloud','mobile','data','software','برمجة','مطور','developer','engineer','مهندس','security','tech','react','node','python','java','php'];
export function isITJob(job: Job): boolean {
  const h = [job.title, job.field, job.description?.slice(0, 200)].join(' ').toLowerCase();
  return IT_KW.some(k => h.includes(k));
}
