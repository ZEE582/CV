import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { Job, Company, Toast } from '../types';
import { jobsApi, companiesApi } from '../api/client';
import { isITJob } from '../utils/helpers';

interface AppContextValue {
  allJobs:   Job[];   // جميع الوظائف IT فقط
  allCos:    Company[];
  loadJobs:  () => Promise<void>;
  loadCos:   () => Promise<void>;
  toast:     (msg: string, type?: 'ok' | 'err') => void;
  toasts:    Toast[];
  activePage:    string;
  setActivePage: (p: string) => void;
  // صفحة الشركة المفتوحة حالياً
  activeCompanyId: string | null;
  openCompanyPage: (id: string) => void;
  closeCompanyPage: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [allCos,  setAllCos]  = useState<Company[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    try {
      const d = await jobsApi.list({ limit: 200, field: 'تكنولوجيا' });
      // فلترة إضافية بالكلمات المفتاحية
      const filtered = (d.jobs || []).filter(isITJob);
      setAllJobs(filtered.length > 0 ? filtered : (d.jobs || []));
    } catch (e) { console.error('loadJobs:', e); }
  }, []);

  const loadCos = useCallback(async () => {
    try {
      const d = await companiesApi.list();
      setAllCos(d.companies || []);
    } catch (e) { console.error('loadCos:', e); }
  }, []);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);
  const toast = useCallback((message: string, type: 'ok' | 'err' = 'ok') => {
    const id = String(++idRef.current);
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3200);
  }, []);

  const [activePage, setActivePage] = useState('jobs');

  const openCompanyPage  = useCallback((id: string) => setActiveCompanyId(id), []);
  const closeCompanyPage = useCallback(() => setActiveCompanyId(null), []);

  return (
    <AppContext.Provider value={{
      allJobs, allCos, loadJobs, loadCos,
      toast, toasts,
      activePage, setActivePage,
      activeCompanyId, openCompanyPage, closeCompanyPage,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
