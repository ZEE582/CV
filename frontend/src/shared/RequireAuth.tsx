import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth, type SessionUser } from './AuthContext';
export default function RequireAuth({ children, roles }: { children: ReactNode; roles?: SessionUser['role'][] }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <p role="status" className="p-8 text-center">جاري التحقق من الجلسة...</p>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/home" replace />;
  return <>{children}</>;
}
