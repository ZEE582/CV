import type { ManagedCompany } from '../api/companyManagement';
export interface CompanyDraft { name_ar: string; name_en: string; location: string; sector: string; website: string; email: string; about_ar: string; is_active: boolean; is_verified: boolean }
export function companyDraft(company?: ManagedCompany): CompanyDraft { return { name_ar: company?.name_ar || '', name_en: company?.name_en || '', location: company?.location || '', sector: company?.sector || '', website: company?.website || '', email: company?.email || '', about_ar: company?.about_ar || '', is_active: company?.is_active ?? true, is_verified: company?.is_verified ?? false }; }
export function companyErrors(draft: CompanyDraft) {
  const errors: Partial<Record<keyof CompanyDraft, string>> = {};
  if (draft.name_ar.trim().length < 2 || draft.name_ar.trim().length > 200) errors.name_ar = 'اكتب اسمًا بين حرفين و200 حرف.';
  for (const key of ['name_en', 'location', 'sector'] as const) if (draft[key].trim().length > 200) errors[key] = 'استخدم 200 حرف أو أقل.';
  if (draft.about_ar.trim().length < 10 || draft.about_ar.trim().length > 10000) errors.about_ar = 'اكتب نبذة بين 10 و10000 حرف.';
  if (draft.email.trim() && (draft.email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim()))) errors.email = 'اكتب بريدًا إلكترونيًا صالحًا أو اتركه فارغًا.';
  if (draft.website.trim()) { try { const url = new URL(draft.website.trim()); if (!['https:', 'http:'].includes(url.protocol) || !url.hostname || draft.website.trim().length > 2048) throw new Error(); } catch { errors.website = 'استخدم رابطًا كاملًا يبدأ بـ https:// أو http://.'; } }
  return errors;
}
export function companyPayload(draft: CompanyDraft, original?: ManagedCompany): Partial<CompanyDraft> {
  const normalize = (value: CompanyDraft) => Object.fromEntries(Object.keys(companyDraft()).map(key => { const field = value[key as keyof CompanyDraft]; return [key, typeof field === 'string' ? (key === 'email' ? field.trim().toLowerCase() : field.trim()) : field]; })) as unknown as CompanyDraft;
  const current = normalize(draft); const baseline = original ? normalize(companyDraft(original)) : null;
  return Object.fromEntries(Object.entries(current).filter(([key, value]) => !baseline || value !== baseline[key as keyof CompanyDraft]));
}
export function readCompaniesSearch(params: URLSearchParams) {
  const page = Number(params.get('page')); return { search: (params.get('q') || '').slice(0, 120), state: ['active', 'paused'].includes(params.get('state') || '') ? params.get('state')! : 'all', verification: ['verified', 'unverified'].includes(params.get('verification') || '') ? params.get('verification')! : 'all', sort: params.get('sort') === 'newest' ? 'newest' : 'name', page: Number.isSafeInteger(page) && page > 0 && page <= 1000000 ? page : 1 };
}
export function companiesQuery(state: ReturnType<typeof readCompaniesSearch>) { const query = new URLSearchParams({ page: String(state.page), limit: '12', state: state.state, verification: state.verification, sort: state.sort }); if (state.search.trim()) query.set('search', state.search.trim()); return query; }
export function patchCompaniesSearch(previous: URLSearchParams, patch: Record<string, string | number>) { const next = new URLSearchParams(previous); if (!('page' in patch)) next.delete('page'); for (const [key, value] of Object.entries(patch)) { if (value === '' || value === 'all' || (key === 'sort' && value === 'name') || (key === 'page' && Number(value) === 1)) next.delete(key); else next.set(key, String(value)); } return next; }
