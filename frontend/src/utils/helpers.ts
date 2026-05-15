import type { Job } from '../types';

export function ini(name = ''): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return words[0][0] + words[1][0];
  return name.slice(0, 2) || '؟؟';
}

export function ago(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const hours = Math.floor((Date.now() - new Date(dateStr).getTime()) / 3600000);
  if (hours < 1)  return 'منذ لحظات';
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'أمس';
  if (days < 7)   return `منذ ${days} أيام`;
  return `منذ ${Math.floor(days / 7)} أسابيع`;
}

export function fmtSal(job: Job): string {
  if (!job.salary_visible) return 'يُحدد لاحقاً';
  if (!job.salary_min && !job.salary_max) return 'يُحدد لاحقاً';
  const mn = (job.salary_min || 0).toLocaleString();
  const mx = (job.salary_max || 0).toLocaleString();
  return `${mn}–${mx} ${job.salary_currency || '₪'}`;
}

export function parseJson(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v as string[];
  try { return JSON.parse(v as string) as string[]; } catch { return []; }
}

// مجالات IT/Tech المقبولة فقط
export const IT_KEYWORDS = [
  'backend','back-end','back end','front-end','frontend','front end',
  'full stack','fullstack','full-stack',
  'ui','ux','ui/ux','ux/ui','مصمم',
  'qa','quality assurance','تست','اختبار',
  'devops','sre','cloud','سحابة',
  'mobile','android','ios','flutter','react native',
  'data','بيانات','machine learning','ai','ذكاء اصطناعي',
  'software','برمجة','مطور','developer','engineer','مهندس',
  'security','أمن','cybersecurity',
  'database','قاعدة بيانات',
  'network','شبكات','it support','دعم تقني',
  'تكنولوجيا','technology','tech',
  'scrum','agile','product','منتج',
  'wordpress','cms','php','python','java','javascript','typescript','react',
  'node','vue','angular','swift','kotlin','c#','.net',
];

/** هل الوظيفة ذات صلة بمجال IT/Tech؟ */
export function isITJob(job: Job): boolean {
  const haystack = [
    job.title, job.field, job.description?.slice(0, 200)
  ].join(' ').toLowerCase();
  return IT_KEYWORDS.some(kw => haystack.includes(kw));
}

/** لون ثابت لكل job حسب id (يبقى ثابتاً) */
const PALETTE = ['#7b68ee','#6366f1','#8b5cf6','#3b82f6','#0ea5e9','#06b6d4','#10b981','#f59e0b'];
export function jobColor(job: Job): string {
  if (job.color && job.color !== '#1a7a4a' && job.color !== '#0d5c30') return job.color;
  const idx = job.id ? job.id.charCodeAt(0) % PALETTE.length : 0;
  return PALETTE[idx];
}
