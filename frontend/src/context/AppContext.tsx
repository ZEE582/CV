import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { Job, Company, Toast } from '../types';
import { jobsApi, companiesApi } from '../api/client';
import { isITJob } from '../utils/helpers';

interface Ctx {
  allJobs: Job[]; allCos: Company[];
  loadJobs: () => Promise<void>; loadCos: () => Promise<void>;
  toast: (msg: string, type?: 'ok' | 'err') => void; toasts: Toast[];
  activePage: string; setActivePage: (p: string) => void;
  activeCompanyId: string | null;
  openCompanyPage: (id: string) => void;
  closeCompanyPage: () => void;
}

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [allCos,  setAllCos]  = useState<Company[]>([]);
  const [activePage, setActivePage]         = useState('jobs');
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const loadJobs = useCallback(async () => {
    try {
      const d = await jobsApi.list({ limit: 200, field: 'تكنولوجيا' });
      const jobs = d.jobs || [];
      const filtered = jobs.filter(isITJob);
      setAllJobs(filtered.length > 0 ? filtered : jobs);
    } catch (e) { console.error('loadJobs:', e); }
  }, []);

  const loadCos = useCallback(async () => {
    try {
      const d = await companiesApi.list();
      setAllCos(d.companies || []);
    } catch (e) { console.error('loadCos:', e); }
  }, []);

  // تحميل الوظائف فوراً عند بدء التطبيق بدون انتظار
  useEffect(() => { loadJobs(); }, []);

  const toast = useCallback((message: string, type: 'ok' | 'err' = 'ok') => {
    const id = String(++idRef.current);
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3200);
  }, []);

  return (
    <AppContext.Provider value={{
      allJobs, allCos, loadJobs, loadCos, toast, toasts,
      activePage, setActivePage,
      activeCompanyId,
      openCompanyPage:  useCallback((id: string) => setActiveCompanyId(id), []),
      closeCompanyPage: useCallback(() => setActiveCompanyId(null), []),
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
