import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const links = [
  { to: '/home', label: 'الرئيسية' },
  { to: '/jobs', label: 'الوظائف' },
  { to: '/companies', label: 'الشركات' },
  { to: '/cv', label: 'السيرة الذاتية' },
  { to: '/support', label: 'الدعم' },
];

export default function Navbar() {
  const { isLoggedIn, logout } = useAuth();
  const [openAt, setOpenAt] = useState<string | null>(null);
  const location = useLocation();
  const open = openAt === location.pathname;
  const close = () => setOpenAt(null);
  return <nav className="site-nav" dir="rtl" aria-label="التنقل الرئيسي">
    <div className="site-nav-inner">
      <Link className="site-nav-brand" to="/home" onClick={close}>تطوّر <span>ttwar</span></Link>
      <button className="site-nav-toggle" type="button" aria-expanded={open} aria-controls="site-nav-menu" onClick={() => setOpenAt(open ? null : location.pathname)}>{open ? 'إغلاق القائمة' : 'القائمة'} <span aria-hidden="true">{open ? '×' : '☰'}</span></button>
      <div id="site-nav-menu" className={`site-nav-menu${open ? ' is-open' : ''}`}>
        <div className="site-nav-links">{links.map(({ to, label }) => <NavLink key={to} to={to} onClick={close} className={({ isActive }) => isActive ? 'is-active' : ''}>{label}</NavLink>)}</div>
        <div className="site-nav-account">{isLoggedIn ? <><NavLink to="/profile" onClick={close}>حسابي</NavLink><button type="button" onClick={() => { logout(); close(); }}>تسجيل الخروج</button></> : <><Link to="/login" onClick={close}>تسجيل الدخول</Link><Link className="site-nav-signup" to="/signup" onClick={close}>إنشاء حساب</Link></>}</div>
      </div>
    </div>
  </nav>;
}
