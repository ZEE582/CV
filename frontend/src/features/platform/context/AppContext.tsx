import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Job, Company, Toast } from '../types';
import { jobsApi, companiesApi } from '../api/client';
import { isITJob } from '../utils/helpers';
interface Ctx {
  allJobs: Job[]; jobsLoading: boolean; jobsError: boolean; allCos: Company[]; loadJobs: () => Promise<void>; loadCos: () => Promise<void>;
  toast: (message: string, type?: 'ok' | 'err') => void; toasts: Toast[];
  activePage: string; setActivePage: (page: string) => void; activeCompanyId: string | null;
  openCompanyPage: (id: string, jobId?: string) => void; closeCompanyPage: () => void;
}
const AppContext = createContext<Ctx | null>(null);
export function AppProvider({ children }: { children: ReactNode }) {
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState(false);
  const [allCos, setAllCos] = useState<Company[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);
  const location = useLocation();
  const navigate = useNavigate();
  const activePage = location.pathname === '/cv' ? 'cv' : location.pathname === '/ai' ? 'ai' : location.pathname === '/playground' ? 'playground' : location.pathname.startsWith('/practice') ? 'practice' : location.pathname === '/applications' ? 'applications' : 'jobs';
  const activeCompanyId = location.pathname.startsWith('/company/') ? decodeURIComponent(location.pathname.slice(9)) : null;
  const loadJobs = useCallback(async () => {
    setJobsLoading(true); setJobsError(false);
    try { const data = await jobsApi.list({ limit: 200, field: 'تكنولوجيا' }); const jobs = data.jobs || []; const filtered = jobs.filter(isITJob); setAllJobs(filtered.length ? filtered : jobs); }
    catch { setJobsError(true); }
    finally { setJobsLoading(false); }
  }, []);
  const loadCos = useCallback(async () => {
    try { const data = await companiesApi.list(); setAllCos(data.companies || []); }
    catch (error) { console.error('loadCos:', error); }
  }, []);
  const toast = useCallback((message: string, type: 'ok' | 'err' = 'ok') => {
    const id = String(++idRef.current); setToasts(previous => [...previous, { id, message, type }]);
    setTimeout(() => setToasts(previous => previous.filter(item => item.id !== id)), 3200);
  }, []);
  const setActivePage = useCallback((page: string) => navigate('/' + page), [navigate]);
  const openCompanyPage = useCallback((id: string, jobId?: string) => navigate('/company/' + encodeURIComponent(id) + (jobId ? '?job=' + encodeURIComponent(jobId) : '')), [navigate]);
  const closeCompanyPage = useCallback(() => navigate('/jobs'), [navigate]);
  return <AppContext.Provider value={{ allJobs, jobsLoading, jobsError, allCos, loadJobs, loadCos, toast, toasts, activePage, setActivePage, activeCompanyId, openCompanyPage, closeCompanyPage }}>{children}</AppContext.Provider>;
}
export function useApp() { const state = useContext(AppContext); if (!state) throw new Error('useApp must be inside AppProvider'); return state; }
