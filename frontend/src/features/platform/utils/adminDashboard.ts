import type { AdminCompany } from '../api/adminDashboard';
export function selectedAdminCompany(companies: AdminCompany[], requested: string | null): AdminCompany | undefined { return requested === null ? undefined : companies.find(company => company._id === requested); }
export function adminCompanyLinks(companyId: string, jobId?: string) {
  const query = new URLSearchParams({ company: companyId }); const applicants = new URLSearchParams(query); if (jobId) applicants.set('job', jobId);
  return { dashboard: '/admin/company-dashboard?' + query, applicants: '/admin/applicants?' + applicants, messages: '/admin/messages?' + query, unread: '/admin/messages?' + query + '&is_read=false' };
}
