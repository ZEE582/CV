import { Link, useLocation } from 'react-router-dom';
import { jobsReturnPath } from '../utils/jobsSearch';
import { applicationsReturnPath } from '../utils/myApplications';
import './JobsPage.css';
import React, { useEffect, useState } from 'react';
import { companiesApi } from '../api/client';
import { useApp } from '../context/AppContext';
import type { Company, Job } from '../types';
import { jobId } from '../utils/helpers';
import CompanyHero from '../components/company/CompanyHero';
import JobsGrid    from '../components/company/JobsGrid';
import JobDetail   from '../components/company/JobDetail';
import ContactForm from '../components/company/ContactForm';
import Spinner     from '../components/common/Spinner';

interface Props { companyId: string; highlightJobId?: string; }

export default function CompanyPage({ companyId: id, highlightJobId }: Props) {
  const location = useLocation();
  const applicationReturn = applicationsReturnPath(location.state);
  const { toast } = useApp();
  const [co, setCo]         = useState<Company | null>(null);
  const [jobs, setJobs]     = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selJob, setSelJob]   = useState<Job | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true); setError(false); setCo(null); setJobs([]); setSelJob(null);
    companiesApi.get(id)
      .then(d => {
        if (!active) return;
        setCo(d.company);
        setJobs(d.jobs || []);
        if (highlightJobId) {
          const found = d.jobs?.find(j => jobId(j) === highlightJobId);
          if (found) setSelJob(found);
        }
      })
      .catch(() => { if (active) { setError(true); toast('تعذّر تحميل بيانات الشركة', 'err'); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, highlightJobId, toast, retry]);

  if (loading) return <Spinner />;

  if (!co) return (
    <div style={{ textAlign: 'center', padding: '80px 24px', fontFamily: "'Tajawal',sans-serif" }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
      <p role={error ? 'alert' : undefined} style={{ color: '#1a1a2e', fontWeight: 700, fontSize: 18 }}>{error ? 'تعذر تحميل بيانات الشركة. تحقق من الاتصال وحاول مجددًا.' : 'الشركة غير موجودة'}</p>
      {error && <button onClick={() => setRetry(value => value + 1)} style={{ color: '#5146b7', marginTop: 12 }}>إعادة المحاولة</button>}
    </div>
  );

  const color = co.color && !['#1a7a4a','#0d5c30'].includes(co.color) ? co.color : '#7b68ee';

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 'clamp(20px, 4vw, 32px) clamp(16px, 4vw, 40px)', animation: 'fadeUp .3s ease' }}>
      <Link to={applicationReturn || jobsReturnPath(location.state)} style={{ display: 'inline-block', marginBottom: 20, color: '#6256d9', fontSize: 14 }}>{applicationReturn ? 'العودة إلى طلباتي' : 'العودة إلى نتائج الوظائف'}</Link>
      {highlightJobId && !jobs.some(job => jobId(job) === highlightJobId) && <p role="alert" style={{ marginBottom: 20 }}>هذه الوظيفة لم تعد متاحة. يمكنك مراجعة وظائف الشركة الأخرى.</p>}
      <CompanyHero co={co} color={color} />
      <JobsGrid jobs={jobs} highlightJobId={selJob ? jobId(selJob) : undefined} onSelect={setSelJob} />
      {selJob && <JobDetail key={jobId(selJob)} job={selJob} onClose={() => { const selectedId = jobId(selJob); setSelJob(null); requestAnimationFrame(() => document.getElementById('company-job-' + selectedId)?.focus()); }} />}
      <ContactForm companyId={id} companyName={co.name_ar} color={color} />
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}
