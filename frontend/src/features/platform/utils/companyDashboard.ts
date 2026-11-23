import type { Job } from '../types';
import { isJobOpen } from './jobsSearch';
export const publicationViews = { all: 'كل الحالات', open: 'التقديم مفتوح', paused: 'موقوفة', expired: 'انتهى التقديم', company_paused: 'الشركة موقوفة' };
export type PublicationView = keyof typeof publicationViews;
export function dashboardJobState(job: Pick<Job, 'is_active' | 'deadline'>, companyActive: boolean, now = Date.now()): Exclude<PublicationView, 'all'> {
  if (!job.is_active) return 'paused'; if (!companyActive) return 'company_paused'; return isJobOpen(job, now) ? 'open' : 'expired';
}
export function readCompanyDashboardSearch(params: URLSearchParams) {
  const view = params.get('view') || 'all'; const page = Number(params.get('page'));
  return { search: (params.get('q') || '').slice(0, 120), view: Object.hasOwn(publicationViews, view) ? view as PublicationView : 'all' as PublicationView, sort: params.get('sort') === 'oldest' ? 'oldest' : 'newest', page: Number.isSafeInteger(page) && page > 0 && page <= 1000000 ? page : 1 };
}
export function patchCompanyDashboardSearch(previous: URLSearchParams, patch: Record<string, string | number>) {
  const next = new URLSearchParams(previous);
  if ('company' in patch) for (const key of ['job', 'q', 'view', 'sort', 'page', 'status', 'is_read']) next.delete(key);
  else if (!('page' in patch)) next.delete('page');
  for (const [key, value] of Object.entries(patch)) { if (value === '' || value === 'all' || value === 'newest' || (key === 'page' && Number(value) === 1)) next.delete(key); else next.set(key, String(value)); }
  return next;
}
export function companyWorkspaceLink(path: string, companyId: string | null) {
  return companyId !== null && ['/admin/company-dashboard', '/admin/applicants', '/admin/messages'].includes(path) ? path + '?' + new URLSearchParams({ company: companyId }).toString() : path;
}
export function companyJobPage(jobs: Job[], state: ReturnType<typeof readCompanyDashboardSearch>, companyActive: boolean, now = Date.now()) {
  const search = state.search.trim().toLocaleLowerCase();
  const filtered = jobs.filter(job => (state.view === 'all' || dashboardJobState(job, companyActive, now) === state.view) && (!search || [job.title, job.location, job.field].some(value => (value || '').toLocaleLowerCase().includes(search))));
  const direction = state.sort === 'oldest' ? 1 : -1;
  filtered.sort((first, second) => direction * ((new Date(first.createdAt).getTime() || 0) - (new Date(second.createdAt).getTime() || 0) || first._id.localeCompare(second._id)));
  const pages = Math.max(1, Math.ceil(filtered.length / 12)); const page = Math.min(state.page, pages);
  return { items: filtered.slice((page - 1) * 12, page * 12), total: filtered.length, pages, page };
}
