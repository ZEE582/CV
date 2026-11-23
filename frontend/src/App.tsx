import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, Link, Outlet, useNavigate } from 'react-router-dom';
import RequireAuth from './shared/RequireAuth';
import Navigation from './shared/SiteNavigation';
import { useAuth } from './shared/AuthContext';
const PageIndex = lazy(() => import('./features/public/pages/PageIndex'));
const Landing = lazy(() => import('./features/public/pages/LandingPage'));
const Companies = lazy(() => import('./features/public/pages/CompaniesPage'));
const Support = lazy(() => import('./features/public/pages/SupportPage'));
const Login = lazy(() => import('./features/auth/pages/Login'));
const PasswordRecovery = lazy(() => import('./features/auth/pages/PasswordRecovery'));
const Signup = lazy(() => import('./features/auth/pages/Signup'));
const Verify = lazy(() => import('./features/auth/pages/VerifyEmail'));
const Questions = lazy(() => import('./features/auth/pages/Questions'));
const Profile = lazy(() => import('./features/auth/pages/Profile'));
const Platform = lazy(() => import('./features/platform/App'));
export default function App() {
  return <div className="site-shell"><Navigation /><Suspense fallback={<p role="status" className="p-8 text-center">جاري التحميل...</p>}><Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/forgot-password" element={<PasswordRecovery />} />
    <Route path="/reset-password" element={<PasswordRecovery />} />
    <Route path="/signup" element={<Signup />} />
    <Route path="/verify-email" element={<Verify />} />
    <Route path="/" element={<Navigate to="/home" replace />} />
    <Route path="/home" element={<Landing />} />
    <Route element={<RequireAuth><Outlet /></RequireAuth>}>
    <Route path="/pages" element={<PageIndex />} />
    <Route path="/companies" element={<Companies />} />
    <Route path="/support" element={<Support />} />
    <Route path="/logout" element={<Logout />} />
    <Route path="/questions" element={<Questions />} />
    <Route path="/profile" element={<Profile />} />
    <Route path="/applications" element={<RequireAuth roles={['seeker']}><Platform /></RequireAuth>} />
    {['/jobs','/cv','/ai','/practice','/practice/:id','/playground','/company/:id'].map(path => <Route key={path} path={path} element={<Platform />} />)}
    <Route path="/admin/*" element={<RequireAuth roles={['admin','company']}><Platform /></RequireAuth>} />
    <Route path="*" element={<div className="p-12 text-center"><h1>الصفحة غير موجودة</h1><Link to="/home">العودة للرئيسية</Link></div>} />
    </Route>
  </Routes></Suspense></div>;
}

function Logout() {
  const { logout } = useAuth(); const navigate = useNavigate();
  useEffect(() => { logout(); navigate('/login', { replace: true }); }, [logout, navigate]);
  return <p role="status" className="p-8 text-center">جارٍ تسجيل الخروج…</p>;
}
