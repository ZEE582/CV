import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Bars3Icon, XMarkIcon, ChevronDownIcon, ArrowLeftOnRectangleIcon, UserCircleIcon, ChatBubbleLeftRightIcon, DocumentCheckIcon } from '@heroicons/react/24/outline';
import { useAuth } from './AuthContext';
import { returnPath } from './navigation';
import { sitePageDestination, type SiteRole } from './sitePages';
import './SiteNavigation.css';

const primaryPages = [
  { name: 'الرئيسية', path: '/home' }, { name: 'الوظائف', path: '/jobs' }, { name: 'الشركات', path: '/companies' },
  { name: 'السيرة الذاتية', path: '/cv' }, { name: 'التدريب', path: '/practice' }, { name: 'المساعد الذكي', path: '/ai' },
];
const roleNames = { seeker: 'باحث عن عمل', company: 'حساب شركة', admin: 'مدير المنصة' };

export function SiteNavigation({ user, loading = false }: { user: { name: string; role: SiteRole } | null; loading?: boolean }) {
  const location = useLocation();
  const authState = { from: returnPath(location.state) };
  const [menu, setMenu] = useState<'main' | 'account' | null>(null);
  const root = useRef<HTMLElement>(null);
  const mainTrigger = useRef<HTMLButtonElement>(null);
  const accountTrigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const rolePage = user?.role === 'admin' ? { name: 'الإدارة', path: '/admin/dashboard' }
    : user?.role === 'company' ? { name: 'لوحة الشركة', path: '/admin/company-dashboard' } : null;
  const pages = rolePage ? [...primaryPages, rolePage] : primaryPages;
  useEffect(() => { setMenu(null); }, [location.key]);
  useEffect(() => {
    if (!menu) return;
    panel.current?.querySelector('a')?.focus();
    const outside = (event: PointerEvent) => { if (event.target instanceof Node && !root.current?.contains(event.target)) setMenu(null); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [menu]);
  function primaryLinks() {
    return pages.map(page => <NavLink key={page.path} to={sitePageDestination(page, location.pathname, location.search)} end={page.path === '/home'} className={({ isActive }) => {
      const related = (page.path === '/companies' && location.pathname.startsWith('/company/'))
        || (page.path === '/practice' && location.pathname === '/playground')
        || (page === rolePage && location.pathname.startsWith('/admin/'));
      return isActive || related ? 'is-active' : undefined;
    }}>{page.name}</NavLink>);
  }
  return <header ref={root} className="site-navigation" dir="rtl" onClick={event => {
    if (event.target instanceof Element && event.target.closest('a')) setMenu(null);
  }} onKeyDown={event => {
    if (event.key === 'Escape' && menu) {
      event.preventDefault(); setMenu(null);
      (menu === 'main' ? mainTrigger : accountTrigger).current?.focus();
    }
  }} onBlur={event => { if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) setMenu(null); }}>
    <nav className="site-navigation-bar" aria-label="التنقل الرئيسي">
      <Link to="/home" className="site-navigation-brand" aria-label="تطوّر — الرئيسية"><span className="site-navigation-mark" aria-hidden="true"><i /><i /><i /></span><span>تطوّر<small>ttwar</small></span></Link>
      {user && <div className="site-navigation-main">{primaryLinks()}</div>}
      <div className="site-navigation-actions">{loading ? <span className="site-navigation-status" role="status">جارٍ التحقق…</span> : user ? <>
        <button ref={accountTrigger} type="button" className={'site-navigation-account-button' + (menu === 'account' ? ' is-open' : '')} aria-label="قائمة حسابي" aria-expanded={menu === 'account'} aria-controls="site-account-panel" onClick={() => setMenu(value => value === 'account' ? null : 'account')}><span className="site-navigation-avatar" aria-hidden="true">{user.name.trim().charAt(0) || 'ح'}</span><span className="site-navigation-account-label">حسابي</span><ChevronDownIcon aria-hidden="true" /></button>
        <button ref={mainTrigger} type="button" className="site-navigation-mobile-button" aria-label={menu === 'main' ? 'إغلاق قائمة التنقل' : 'فتح قائمة التنقل'} aria-expanded={menu === 'main'} aria-controls="site-mobile-navigation" onClick={() => setMenu(value => value === 'main' ? null : 'main')}>{menu === 'main' ? <XMarkIcon aria-hidden="true" /> : <Bars3Icon aria-hidden="true" />}</button>
      </> : <><NavLink to="/login" state={authState} className="site-navigation-signin">تسجيل الدخول</NavLink><NavLink to="/signup" state={authState} className="site-navigation-signup">إنشاء حساب</NavLink></>}</div>
    </nav>
    {user && menu === 'main' && <div ref={panel} id="site-mobile-navigation" className="site-navigation-mobile-panel"><nav aria-label="الأقسام الرئيسية">{primaryLinks()}</nav></div>}
    {user && menu === 'account' && <div ref={panel} id="site-account-panel" className="site-navigation-account-panel"><div className="site-navigation-identity"><strong dir="auto">{user.name || 'حسابي'}</strong><span>{roleNames[user.role]}</span></div><Link to="/profile"><UserCircleIcon aria-hidden="true" />الملف الشخصي</Link>{user.role === 'seeker' && <Link to="/applications"><DocumentCheckIcon aria-hidden="true" />تقديماتي</Link>}<Link to="/support"><ChatBubbleLeftRightIcon aria-hidden="true" />الدعم والمساعدة</Link><Link to="/logout" className="site-navigation-logout"><ArrowLeftOnRectangleIcon aria-hidden="true" />تسجيل الخروج</Link></div>}
  </header>;
}

export default function Navigation() { const { user, loading } = useAuth(); return <SiteNavigation user={user} loading={loading} />; }
