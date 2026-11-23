import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { apiFetch } from './api';
export interface SessionUser {
  id?: string; _id: string; email: string; name: string; role: 'seeker' | 'company' | 'admin';
  hasCompletedQuestions: boolean;
}
interface AuthState {
  user: SessionUser | null; loading: boolean; isLoggedIn: boolean;
  completeLogin: (token: string, user: SessionUser) => void; logout: () => void;
  updateUser: (user: SessionUser) => void;
}
const AuthContext = createContext<AuthState | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const logout = useCallback(() => {
    localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null);
  }, []);
  const updateUser = useCallback((account: SessionUser) => {
    localStorage.setItem('user', JSON.stringify(account));
    setUser(account);
  }, []);
  const completeLogin = useCallback((token: string, account: SessionUser) => {
    localStorage.setItem('token', token);
    updateUser(account);
  }, [updateUser]);
  useEffect(() => {
    let cancelled = false;
    async function restore() {
      try {
        if (localStorage.getItem('token')) {
          const response = await apiFetch('/auth/me');
          if (cancelled) return;
          if (!response.ok) { logout(); return; }
          const data = await response.json();
          if (!cancelled) { setUser(data.user); localStorage.setItem('user', JSON.stringify(data.user)); }
        }
      } catch { if (!cancelled) logout(); }
      finally { if (!cancelled) setLoading(false); }
    }
    void restore();
    return () => { cancelled = true; };
  }, [logout]);
  return <AuthContext.Provider value={{ user, loading, isLoggedIn: !!user, completeLogin, logout, updateUser }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const state = useContext(AuthContext);
  if (!state) throw new Error('useAuth must be inside AuthProvider');
  return state;
}
