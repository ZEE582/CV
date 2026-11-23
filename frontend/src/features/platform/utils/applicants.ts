import type { Job } from '../types';
import { applicationStatuses, type ApplicationStatus } from '../api/recruitment';
export const APPLICANTS_PAGE_SIZE = 12;
export interface ApplicantsSearch { q: string; status: '' | ApplicationStatus; sort: 'newest' | 'oldest'; page: number }
export function selectedApplicantJob(jobs: Job[], requested: string | null): Job | undefined { return requested !== null ? jobs.find(job => job._id === requested) : jobs[0]; }
export function readApplicantsSearch(params: URLSearchParams): ApplicantsSearch {
  const status = params.get('status') || ''; const page = params.get('page') || '1';
  return { q: (params.get('q') || '').slice(0, 120), status: Object.hasOwn(applicationStatuses, status) ? status as ApplicationStatus : '', sort: params.get('sort') === 'oldest' ? 'oldest' : 'newest', page: /^[1-9][0-9]{0,6}$/.test(page) && Number(page) <= 1000000 ? Number(page) : 1 };
}
export function patchApplicantsSearch(current: URLSearchParams, patch: Partial<ApplicantsSearch> & { company?: string; job?: string }): URLSearchParams {
  const next = new URLSearchParams(current);
  if ('company' in patch || 'job' in patch) { for (const key of ['q', 'status', 'sort', 'page']) next.delete(key); if ('company' in patch) next.delete('job'); }
  if (!('page' in patch)) next.delete('page');
  for (const [key, value] of Object.entries(patch)) { if (value === '' || (key === 'page' && value === 1) || (key === 'sort' && value === 'newest')) next.delete(key); else next.set(key, String(value)); }
  return next;
}
export function applicantsApiQuery(state: ApplicantsSearch): URLSearchParams {
  const query = new URLSearchParams({ page: String(state.page), limit: String(APPLICANTS_PAGE_SIZE), sort: state.sort });
  if (state.q.trim()) query.set('search', state.q.trim()); if (state.status) query.set('status', state.status); return query;
}
export function applicantDate(value?: string): string { const time = value ? new Date(value).getTime() : NaN; return Number.isFinite(time) ? new Intl.DateTimeFormat('ar', { timeZone: 'Asia/Hebron', dateStyle: 'medium' }).format(new Date(time)) : 'غير محدد'; }
