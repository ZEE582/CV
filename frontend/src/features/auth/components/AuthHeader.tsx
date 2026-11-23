import type { MouseEventHandler } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
export default function AuthHeader({ onHomeClick }: { onHomeClick?: MouseEventHandler<HTMLAnchorElement> } = {}) {
  return <header className="login-topbar">
    <Link className="login-brand" to="/home" onClick={onHomeClick} aria-label="تطوّر — الصفحة الرئيسية"><span className="login-brand-mark" aria-hidden="true"><i /><i /><i /></span><span>تطوّر<span className="login-brand-latin">ttwar</span></span></Link>
    <Link className="login-home-link" to="/home" onClick={onHomeClick}><ArrowRightIcon aria-hidden="true" />العودة للرئيسية</Link>
  </header>;
}
