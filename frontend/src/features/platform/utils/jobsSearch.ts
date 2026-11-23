export const JOB_TYPES = ['دوام كامل', 'دوام جزئي', 'عقد مؤقت', 'عمل عن بُعد', 'فريلانس', 'تدريب مدفوع'];
export const EXPERIENCE_LEVELS = ['حديث التخرج', '1-3 سنوات', '3-5 سنوات', '+5 سنوات', 'قيادي'];
export const REGIONS = ['ضفة', 'قدس', 'غزة', '48', 'remote'];
export const FIELDS = ['تكنولوجيا', 'مالية وبنوك', 'اتصالات', 'منظمات دولية', 'تعليم', 'صحة', 'هندسة', 'تسويق وإعلام'];
export const CURRENCIES = ['₪', '$', '€', 'JD'];
export type JobSort = 'newest' | 'featured' | 'salary';
export interface JobsSearchState { q: string; field: string; type: string; exp: string; reg: string; availability: 'open' | 'all'; sort: JobSort; currency: string; page: number }
export const JOBS_PAGE_SIZE = 12;
export function readJobsSearch(params: URLSearchParams): JobsSearchState {
  const option = (key: string, choices: string[], fallback = '') => choices.includes(params.get(key) || '') ? params.get(key)! : fallback;
  const rawPage = params.get('page') || '1'; const page = /^[1-9][0-9]{0,6}$/.test(rawPage) && Number(rawPage) <= 1000000 ? Number(rawPage) : 1;
  return { q: (params.get('q') || '').slice(0, 120), field: (params.get('field') || '').slice(0, 100), type: option('type', JOB_TYPES), exp: option('exp', EXPERIENCE_LEVELS), reg: option('reg', REGIONS),
    availability: option('availability', ['open', 'all'], 'open') as 'open' | 'all', sort: option('sort', ['newest', 'featured', 'salary'], 'newest') as JobSort, currency: option('currency', CURRENCIES, '₪'), page };
}
export function patchJobsSearch(current: URLSearchParams, patch: Partial<JobsSearchState>): URLSearchParams {
  const next = new URLSearchParams(current);
  for (const [key, value] of Object.entries(patch)) { if (value === '' || (key === 'page' && value === 1) || (key === 'sort' && value === 'newest') || (key === 'availability' && value === 'open')) next.delete(key); else next.set(key, String(value)); }
  if (!('page' in patch)) next.delete('page');
  return next;
}
export function jobsApiQuery(state: JobsSearchState): URLSearchParams {
  const params = new URLSearchParams({ page: String(state.page), limit: String(JOBS_PAGE_SIZE), sort: state.sort, availability: state.availability });
  for (const [key, value] of Object.entries({ search: state.q.trim(), field: state.field.trim(), type: state.type, exp: state.exp, region: state.reg, ...(state.sort === 'salary' ? { currency: state.currency } : {}) })) if (value) params.set(key, value);
  return params;
}
export function isJobOpen(job: { is_active: boolean; deadline: string | null }, now = Date.now()): boolean {
  if (!job.is_active) return false;
  if (!job.deadline) return true;
  const deadline = new Date(job.deadline).getTime(); return Number.isFinite(deadline) && deadline >= now;
}
export function jobsReturnPath(state: unknown): string {
  if (state && typeof state === 'object' && 'fromJobs' in state && typeof state.fromJobs === 'string' && /^\/jobs(?:\?[^#]*)?$/.test(state.fromJobs) && !/[\\\u0000-\u0020]/.test(state.fromJobs)) return state.fromJobs;
  return '/jobs';
}
