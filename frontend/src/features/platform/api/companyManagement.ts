import { API_BASE_URL } from '../../../shared/api';
import type { CompanyDraft } from '../utils/companyManagement';
export interface ManagedCompany { _id: string; name_ar: string; name_en: string | null; location: string | null; sector: string | null; user_id: string | null; is_active: boolean; is_verified: boolean; __v: number; updatedAt: string | null; about_ar?: string | null; website?: string | null; email?: string | null }
export interface CompaniesResult { success: true; companies: ManagedCompany[]; total: number; page: number; pages: number; limit: number; counts: { all: number; active: number; paused: number; verified: number; unverified: number } }
export class CompanyManagementError extends Error { constructor(message: string, public status = 0, public uncertain = false) { super(message); } }
function currentToken() { try { return localStorage.getItem('token'); } catch { return null; } }
function readCompany(value: unknown, detail = false): ManagedCompany {
  if (!value || typeof value !== 'object') throw new CompanyManagementError('تعذر قراءة بيانات الشركة. أعد التحميل.');
  const company = value as ManagedCompany;
  if (typeof company._id !== 'string' || !company._id || typeof company.name_ar !== 'string' || typeof company.is_active !== 'boolean' || typeof company.is_verified !== 'boolean' || !Number.isSafeInteger(company.__v) || company.__v < 0
    || ['name_en', 'location', 'sector', 'user_id', ...(detail ? ['about_ar', 'website', 'email'] : [])].some(key => { const field = (company as unknown as Record<string, unknown>)[key]; return field != null && typeof field !== 'string'; })
    || (company.updatedAt != null && (typeof company.updatedAt !== 'string' || !Number.isFinite(Date.parse(company.updatedAt))))) throw new CompanyManagementError('تعذر التحقق من بيانات الشركة ونسختها. أعد التحميل.');
  return { _id: company._id, name_ar: company.name_ar, name_en: company.name_en ?? null, location: company.location ?? null, sector: company.sector ?? null, user_id: company.user_id ?? null, is_active: company.is_active, is_verified: company.is_verified, __v: company.__v, updatedAt: company.updatedAt ?? null, ...(detail ? { about_ar: company.about_ar ?? null, website: company.website ?? null, email: company.email ?? null } : {}) };
}
export function createCompanyManagementClient(accountId: string, role: string) {
  const token = currentToken();
  async function request(path: string, options: RequestInit = {}) {
    const write = !!options.method && options.method !== 'GET';
    if (!accountId || role !== 'admin' || !token || currentToken() !== token) throw new CompanyManagementError('تغيّرت الجلسة أو لا تملك صلاحية الإدارة. حدّث الصفحة.', 401);
    let response: Response;
    try { response = await fetch(API_BASE_URL + path, { ...options, credentials: 'include', cache: 'no-store', headers: { Authorization: 'Bearer ' + token, ...(options.body ? { 'Content-Type': 'application/json' } : {}) } }); }
    catch (failure) { if (options.signal?.aborted) throw failure; throw new CompanyManagementError(write ? 'تعذر تأكيد الحفظ. احتفظ ببياناتك وراجع القائمة قبل إعادة العملية.' : 'تعذر الاتصال بخدمة الشركات. أعد المحاولة.', 0, write); }
    const data: unknown = await response.json().catch(() => null);
    if (currentToken() !== token) throw new CompanyManagementError('تغيّرت الجلسة أثناء الطلب. حدّث الصفحة للتحقق من البيانات.', 401, write);
    if (!response.ok) throw new CompanyManagementError(response.status === 409 ? 'تغيّرت الشركة أو ارتباط حسابها منذ فتحها. أعد تحميلها قبل المتابعة.' : response.status === 401 ? 'انتهت الجلسة. سجل الدخول مجددًا.' : response.status === 403 ? 'إدارة الشركات متاحة للمدير فقط.' : response.status === 404 ? 'الشركة غير موجودة أو غير متاحة لهذا الإجراء.' : response.status === 400 ? 'راجع الحقول وحدودها وصيغة الروابط ثم أعد المحاولة.' : response.status === 429 ? 'طلبات كثيرة. انتظر قليلًا وأعد المحاولة.' : 'تعذر تأكيد العملية. حدّث القائمة قبل تكرار الحفظ.', response.status, write && response.status >= 500);
    if (!data || typeof data !== 'object' || !('success' in data) || data.success !== true) throw new CompanyManagementError('تعذر قراءة رد الخدمة. تحقق من القائمة قبل تكرار العملية.', 0, write);
    return { data, status: response.status };
  }
  return {
    async list(query: URLSearchParams, signal?: AbortSignal): Promise<CompaniesResult> {
      const { data } = await request('/companies/manage/list?' + query, { signal });
      const value = data as unknown as CompaniesResult; const count = (value: unknown) => Number.isSafeInteger(value) && Number(value) >= 0;
      if (!Array.isArray(value.companies) || !count(value.total) || !count(value.page) || value.page < 1 || !count(value.pages) || value.pages < value.page || !count(value.limit) || value.limit < 1 || value.limit > 100 || value.companies.length > value.limit || !value.counts || ['all', 'active', 'paused', 'verified', 'unverified'].some(key => !count((value.counts as unknown as Record<string, unknown>)[key])) || value.counts.active + value.counts.paused !== value.counts.all || value.counts.verified + value.counts.unverified !== value.counts.all || value.total > value.counts.all) throw new CompanyManagementError('تعذر التحقق من قائمة الشركات وأعدادها. أعد التحميل.');
      const companies = value.companies.map(company => readCompany(company));
      if (new Set(companies.map(company => company._id)).size !== companies.length || companies.some(company => (query.get('state') === 'active' && !company.is_active) || (query.get('state') === 'paused' && company.is_active) || (query.get('verification') === 'verified' && !company.is_verified) || (query.get('verification') === 'unverified' && company.is_verified))) throw new CompanyManagementError('لا تتطابق الشركات مع التصفية المحددة. أعد التحميل.');
      return { ...value, companies };
    },
    async detail(id: string, signal?: AbortSignal) { const { data } = await request('/companies/manage/' + encodeURIComponent(id), { signal }); const company = readCompany('company' in data ? data.company : null, true); if (company._id !== id) throw new CompanyManagementError('لا تتطابق الشركة مع اختيارك. أعد فتحها.'); return company; },
    async save(payload: Partial<CompanyDraft>, original?: ManagedCompany, signal?: AbortSignal) {
      if (!Object.keys(payload).length) throw new CompanyManagementError('لم تتغير بيانات الشركة.');
      const { data, status } = await request('/companies' + (original ? '/' + encodeURIComponent(original._id) : ''), { method: original ? 'PUT' : 'POST', signal, body: JSON.stringify({ ...payload, ...(original ? { expected_version: original.__v } : {}) }) });
      if (status !== (original ? 200 : 201) || !('company_id' in data) || typeof data.company_id !== 'string' || !data.company_id || (original && data.company_id !== original._id) || !('version' in data) || data.version !== (original ? original.__v + 1 : 0) || ['is_active', 'is_verified'].some(key => key in payload && (!(key in data) || (data as Record<string, unknown>)[key] !== payload[key as keyof CompanyDraft]))) throw new CompanyManagementError('تعذر تأكيد حفظ الشركة. راجع القائمة قبل تكرار العملية.', 0, true);
      return data.company_id;
    },
    async createAccount(company: ManagedCompany, values: { email: string; password: string; full_name: string }, signal?: AbortSignal) {
      if (company.user_id || !company.is_active) throw new CompanyManagementError('أعد تحميل الشركة وتحقق من تفعيلها وعدم ارتباطها بحساب.');
      const { data, status } = await request('/auth/company-account', { method: 'POST', signal, body: JSON.stringify({ company_id: company._id, expected_version: company.__v, email: values.email.trim().toLowerCase(), password: values.password, full_name: values.full_name.trim() || company.name_ar }) });
      if (status !== 201 || !('company_id' in data) || data.company_id !== company._id || !('version' in data) || data.version !== company.__v + 1 || !('user' in data) || !data.user || typeof data.user !== 'object' || !('_id' in data.user) || typeof data.user._id !== 'string' || !data.user._id || !('email' in data.user) || data.user.email !== values.email.trim().toLowerCase() || !('role' in data.user) || data.user.role !== 'company') throw new CompanyManagementError('تعذر تأكيد ربط الحساب. أعد تحميل الشركة قبل تكرار الإنشاء.', 0, true);
    },
  };
}
export type CompanyManagementClient = ReturnType<typeof createCompanyManagementClient>;
