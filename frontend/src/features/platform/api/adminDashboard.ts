import { API_BASE_URL } from '../../../shared/api';
export const adminStatKeys = ['totalUsers', 'activeUsers', 'totalCompanies', 'activeCompanies', 'verifiedCompanies', 'totalJobs', 'activeJobs', 'openJobs', 'pausedJobs', 'expiredJobs', 'companyPausedJobs', 'totalApplications', 'pendingApplications', 'reviewableApplications', 'reviewablePendingApplications', 'totalMessages', 'reviewableMessages', 'unreadMessages'] as const;
export type AdminStats = Record<typeof adminStatKeys[number], number>;
export interface AdminCompany { _id: string; name_ar: string; name_en: string | null; is_active: boolean }
export interface RecentAdminJob { _id: string; title: string; company_id: string; company_name: string; company_active: boolean; is_active: boolean; deadline: string | null; createdAt: string | null }
export interface AdminDashboardData { success: true; generated_at: string; stats: AdminStats; recordIssues: { jobs: number; applications: number; messages: number }; companies: AdminCompany[]; recentJobs: RecentAdminJob[] }
export function readAdminDashboard(value: unknown): AdminDashboardData {
  const invalid = () => new Error('تعذر التحقق من بيانات لوحة الإدارة. أعد تحميلها.');
  if (!value || typeof value !== 'object') throw invalid();
  const data = value as Partial<AdminDashboardData>; const count = (value: unknown) => Number.isSafeInteger(value) && Number(value) >= 0; const date = (value: unknown) => typeof value === 'string' && Number.isFinite(Date.parse(value));
  if (data.success !== true || !date(data.generated_at) || !data.stats || adminStatKeys.some(key => !count(data.stats?.[key])) || !data.recordIssues || ['jobs', 'applications', 'messages'].some(key => !count(data.recordIssues?.[key as keyof typeof data.recordIssues])) || !Array.isArray(data.companies) || !Array.isArray(data.recentJobs) || data.recentJobs.length > 5) throw invalid();
  const { stats: s, recordIssues: issues, companies, recentJobs } = data;
  if (companies.some(company => !company || typeof company._id !== 'string' || !company._id || typeof company.name_ar !== 'string' || typeof company.is_active !== 'boolean' || (company.name_en !== null && typeof company.name_en !== 'string')) || new Set(companies.map(company => company._id)).size !== companies.length) throw invalid();
  if (s.activeUsers > s.totalUsers || s.totalCompanies !== companies.length || s.activeCompanies !== companies.filter(company => company.is_active).length || s.verifiedCompanies > s.totalCompanies
    || s.activeJobs > s.totalJobs || s.openJobs > s.activeJobs || s.openJobs + s.pausedJobs + s.expiredJobs + s.companyPausedJobs + issues.jobs !== s.totalJobs
    || s.reviewableApplications + issues.applications !== s.totalApplications || s.pendingApplications > s.totalApplications || s.reviewablePendingApplications > Math.min(s.pendingApplications, s.reviewableApplications)
    || s.reviewableMessages + issues.messages !== s.totalMessages || s.unreadMessages > s.reviewableMessages) throw invalid();
  if (recentJobs.some(job => { const company = companies.find(company => company._id === job?.company_id); return !job || typeof job._id !== 'string' || !job._id || typeof job.title !== 'string' || !company || job.company_name !== company.name_ar || job.company_active !== company.is_active || typeof job.is_active !== 'boolean' || (job.deadline !== null && !date(job.deadline)) || (job.createdAt !== null && !date(job.createdAt)); }) || new Set(recentJobs.map(job => job._id)).size !== recentJobs.length) throw invalid();
  return data as AdminDashboardData;
}
function currentToken() { try { return localStorage.getItem('token'); } catch { return null; } }
export function createAdminDashboardClient(accountId: string, role: string) {
  const token = currentToken();
  return { async load(signal?: AbortSignal): Promise<AdminDashboardData> {
    if (!accountId || role !== 'admin' || !token || currentToken() !== token) throw new Error('تغيّرت جلسة الدخول أو لا تملك صلاحية الإدارة. سجل الدخول مجددًا.');
    let response: Response;
    try { response = await fetch(API_BASE_URL + '/admin/stats', { credentials: 'include', cache: 'no-store', signal, headers: { Authorization: 'Bearer ' + token } }); }
    catch (failure) { if (signal?.aborted) throw failure; throw new Error('تعذر الاتصال بخدمة الإدارة. تحقق من الاتصال وأعد المحاولة.'); }
    const data: unknown = await response.json().catch(() => null);
    if (currentToken() !== token) throw new Error('تغيّرت جلسة الدخول أثناء الطلب. حدّث الصفحة.');
    if (!response.ok) throw new Error(response.status === 401 ? 'انتهت الجلسة. سجل الدخول مجددًا.' : response.status === 403 ? 'هذه اللوحة متاحة للمدير فقط.' : response.status === 429 ? 'طلبات كثيرة. انتظر قليلًا ثم أعد المحاولة.' : 'تعذر تحميل لوحة الإدارة. أعد المحاولة.');
    return readAdminDashboard(data);
  } };
}
