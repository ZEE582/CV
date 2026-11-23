import { applicationStatuses, type ApplicationRecord, type ApplicationStatus } from '../api/recruitment';
import { readApplicantsSearch, patchApplicantsSearch, type ApplicantsSearch } from './applicants';
export const MY_APPLICATIONS_PAGE_SIZE = 8;
export { readApplicantsSearch as readMyApplicationsSearch, patchApplicantsSearch as patchMyApplicationsSearch } from './applicants';
export function applicationsReturnPath(state: unknown): string | undefined {
  if (!state || typeof state !== 'object' || !('fromApplications' in state) || typeof state.fromApplications !== 'string') return;
  const path = state.fromApplications;
  if (!/^\/applications(?:\?[^#]*)?$/.test(path) || /[\\\u0000-\u0020]/.test(path)) return;
  const query = path.includes('?') ? path.slice(path.indexOf('?') + 1) : '';
  const canonical = patchApplicantsSearch(new URLSearchParams(), readApplicantsSearch(new URLSearchParams(query))).toString();
  return '/applications' + (canonical ? '?' + canonical : '');
}
export function myApplicationsResults(applications: ApplicationRecord[], state: ApplicantsSearch) {
  const counts = Object.fromEntries(Object.keys(applicationStatuses).map(status => [status, 0])) as Record<ApplicationStatus, number>;
  for (const item of applications) counts[item.status]++;
  const query = state.q.trim().normalize('NFKC').toLocaleLowerCase('ar');
  const filtered = applications.filter(item => {
    const job = typeof item.job_id === 'object' ? item.job_id : null;
    const company = typeof item.company_id === 'object' ? item.company_id : null;
    return (!state.status || item.status === state.status) && (!query || [job?.title, company?.name_ar, item.snapshot_title, item.snapshot_company_name].some(text => text?.normalize('NFKC').toLocaleLowerCase('ar').includes(query)));
  }).sort((a, b) => (state.sort === 'oldest' ? 1 : -1) * (Date.parse(a.createdAt) - Date.parse(b.createdAt) || a._id.localeCompare(b._id)));
  const pages = Math.max(1, Math.ceil(filtered.length / MY_APPLICATIONS_PAGE_SIZE));
  const page = Math.min(state.page, pages);
  return { counts, total: filtered.length, pages, page, items: filtered.slice((page - 1) * MY_APPLICATIONS_PAGE_SIZE, page * MY_APPLICATIONS_PAGE_SIZE) };
}
