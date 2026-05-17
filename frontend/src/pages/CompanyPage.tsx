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
  const { toast } = useApp();
  const [co, setCo]         = useState<Company | null>(null);
  const [jobs, setJobs]     = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selJob, setSelJob]   = useState<Job | null>(null);

  useEffect(() => {
    setLoading(true);
    companiesApi.get(id)
      .then(d => {
        setCo(d.company);
        setJobs(d.jobs || []);
        if (highlightJobId) {
          const found = d.jobs?.find(j => jobId(j) === highlightJobId);
          if (found) setSelJob(found);
        }
      })
      .catch(() => toast('تعذّر تحميل بيانات الشركة', 'err'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner />;

  if (!co) return (
    <div style={{ textAlign: 'center', padding: '80px 24px', fontFamily: "'Tajawal',sans-serif" }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
      <p style={{ color: '#1a1a2e', fontWeight: 700, fontSize: 18 }}>الشركة غير موجودة</p>
    </div>
  );

  const color = co.color && !['#1a7a4a','#0d5c30'].includes(co.color) ? co.color : '#7b68ee';

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 40px', animation: 'fadeUp .3s ease' }}>
      <CompanyHero co={co} color={color} />
      <JobsGrid jobs={jobs} highlightJobId={highlightJobId} onSelect={setSelJob} />
      {selJob && <JobDetail job={selJob} onClose={() => setSelJob(null)} />}
      <ContactForm companyId={id} companyName={co.name_ar} color={color} />
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}
