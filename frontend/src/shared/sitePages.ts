export type SiteRole = 'seeker' | 'company' | 'admin';
export interface SitePage { name: string; path: string; access?: string; roles?: SiteRole[]; hint?: string }
export const sitePageGroups: { title: string; items: SitePage[] }[] = [
  { title: 'اكتشف المنصة', items: [
    { name: 'الرئيسية', path: '/home' }, { name: 'الشركات', path: '/companies', hint: 'اختر شركة لعرض صفحتها' },
    { name: 'الوظائف', path: '/jobs' }, { name: 'السيرة الذاتية', path: '/cv' }, { name: 'المساعد الذكي', path: '/ai' },
    { name: 'ساحة التدريب', path: '/practice', hint: 'اختر مسألة لعرض تفاصيلها' }, { name: 'محرر الأكواد', path: '/playground' },
    { name: 'الدعم', path: '/support' }, { name: 'دليل جميع الصفحات', path: '/pages' },
  ] },
  { title: 'حسابي', items: [
    { name: 'الملف الشخصي', path: '/profile', access: 'تسجيل دخول', roles: ['seeker', 'company', 'admin'] },
    { name: 'استكمال البيانات', path: '/questions', access: 'تسجيل دخول', roles: ['seeker', 'company', 'admin'] },
    { name: 'تقديماتي', path: '/applications', access: 'باحث عن عمل', roles: ['seeker'] },
  ] },
  { title: 'الإدارة والشركات', items: [
    { name: 'لوحة التحكم', path: '/admin/dashboard', access: 'مدير', roles: ['admin'] },
    { name: 'فريق الإدارة', path: '/admin/team', access: 'مدير', roles: ['admin'] },
    { name: 'إدارة الحسابات', path: '/admin/contacts', access: 'مدير', roles: ['admin'] },
    { name: 'سجل الإدارة', path: '/admin/history', access: 'مدير', roles: ['admin'] },
    { name: 'الفواتير', path: '/admin/invoices', access: 'مدير', roles: ['admin'] },
    { name: 'النموذج', path: '/admin/form', access: 'مدير', roles: ['admin'], hint: 'لا يوجد نموذج إداري متاح حاليًا' },
    { name: 'التقويم', path: '/admin/calendar', access: 'مدير', roles: ['admin'] },
    { name: 'إدارة الشركات', path: '/admin/companies', access: 'مدير', roles: ['admin'] },
    { name: 'تفاصيل الشركة', path: '/admin/company-details', access: 'مدير', roles: ['admin'], hint: 'تحتاج بيانات شركة محددة' },
    { name: 'لوحة الشركة', path: '/admin/company-dashboard', access: 'مدير / شركة', roles: ['admin', 'company'] },
    { name: 'المتقدمون', path: '/admin/applicants', access: 'مدير / شركة', roles: ['admin', 'company'] },
    { name: 'رسائل الشركة', path: '/admin/messages', access: 'مدير / شركة', roles: ['admin', 'company'] },
  ] },
  { title: 'الدخول والأمان', items: [
    { name: 'تسجيل الدخول', path: '/login' }, { name: 'إنشاء حساب', path: '/signup' }, { name: 'تأكيد البريد', path: '/verify-email' },
    { name: 'نسيت كلمة المرور', path: '/forgot-password' }, { name: 'تعيين كلمة مرور جديدة', path: '/reset-password' },
  ] },
];

export function sitePageDestination(page: SitePage, pathname: string, search: string): string {
  const workspace = ['/admin/company-dashboard', '/admin/applicants', '/admin/messages'];
  const company = new URLSearchParams(search).get('company');
  return workspace.includes(pathname) && workspace.includes(page.path) && company && /^[a-f\d]{24}$/i.test(company)
    ? `${page.path}?${new URLSearchParams({ company })}` : page.path;
}

export function searchSitePages(query: string) {
  const normalize = (value: string) => value.toLocaleLowerCase().normalize('NFD').replace(/[\u064b-\u065f\u0300-\u036f]/g, '').replace(/[أإآ]/g, 'ا').trim();
  const term = normalize(query);
  return sitePageGroups.map(group => ({ ...group, items: group.items.filter(page => normalize(`${page.name} ${page.path} ${group.title}`).includes(term)) })).filter(group => group.items.length);
}
