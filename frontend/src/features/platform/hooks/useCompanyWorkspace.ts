import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../shared/AuthContext';
import { createJobManagementClient, type JobManagementClient } from '../api/jobManagement';
import type { Company, Job } from '../types';
interface CompanyLoad { owner: JobManagementClient | null; items: Company[]; loading: boolean; error: string }
interface JobsLoad { owner: JobManagementClient | null; companyId: string; items: Job[]; loading: boolean; error: string }
export default function useCompanyWorkspace(includeJobs = true) {
  const { user } = useAuth(); const accountId = user?._id || ''; const role = user?.role || '';
  const client = useMemo(() => createJobManagementClient(accountId, role), [accountId, role]);
  const [params, setParams] = useSearchParams(); const requestedCompany = params.get('company');
  const [companyLoad, setCompanyLoad] = useState<CompanyLoad>({ owner: null, items: [], loading: true, error: '' });
  const [jobsLoad, setJobsLoad] = useState<JobsLoad>({ owner: null, companyId: '', items: [], loading: false, error: '' });
  const [version, setVersion] = useState(0);
  const companies = companyLoad.owner === client ? companyLoad.items : [];
  const loadingCompanies = companyLoad.owner !== client || companyLoad.loading;
  const company = role === 'admin' && requestedCompany ? companies.find(item => item._id === requestedCompany) : companies[0];
  const companyId = company?._id;
  useEffect(() => {
    const controller = new AbortController(); setCompanyLoad({ owner: client, items: [], loading: true, error: '' });
    void client.companies(controller.signal).then(items => { if (!controller.signal.aborted) setCompanyLoad({ owner: client, items, loading: false, error: '' }); })
      .catch(failure => { if (!controller.signal.aborted) setCompanyLoad({ owner: client, items: [], loading: false, error: failure instanceof Error ? failure.message : 'تعذر تحميل الشركات.' }); });
    return () => controller.abort();
  }, [client, version]);
  useEffect(() => {
    if (!companyId || !includeJobs || loadingCompanies) { setJobsLoad({ owner: client, companyId: '', items: [], loading: false, error: '' }); return; }
    const controller = new AbortController(); setJobsLoad({ owner: client, companyId, items: [], loading: true, error: '' });
    void client.jobs(companyId, controller.signal).then(items => { if (!controller.signal.aborted) setJobsLoad({ owner: client, companyId, items, loading: false, error: '' }); })
      .catch(failure => { if (!controller.signal.aborted) setJobsLoad({ owner: client, companyId, items: [], loading: false, error: failure instanceof Error ? failure.message : 'تعذر تحميل وظائف الشركة.' }); });
    return () => controller.abort();
  }, [client, companyId, includeJobs, loadingCompanies, version]);
  const jobsMatch = jobsLoad.owner === client && jobsLoad.companyId === companyId;
  const loadingJobs = !!companyId && includeJobs && (!jobsMatch || jobsLoad.loading);
  const selectionError = !loadingCompanies && !companyLoad.error && role === 'admin' && requestedCompany && !company ? 'الشركة المحددة في الرابط غير متاحة. اختر شركة من القائمة.' : '';
  const error = (companyLoad.owner === client ? companyLoad.error : '') || selectionError || (jobsMatch ? jobsLoad.error : '');
  function selectCompany(id: string) { setParams(previous => { const next = new URLSearchParams(previous); next.set('company', id); next.delete('job'); return next; }); }
  const refresh = useCallback(() => setVersion(value => value + 1), []);
  return { company, companies, jobs: !loadingCompanies && jobsMatch ? jobsLoad.items : [], loading: loadingCompanies || loadingJobs, error, selectCompany, refresh, isAdmin: role === 'admin', client };
}
