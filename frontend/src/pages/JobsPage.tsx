import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import JobCard       from '../components/jobs/JobCard';
import FilterSidebar from '../components/jobs/FilterSidebar';
import SortBar       from '../components/jobs/SortBar';
import EmptyState    from '../components/common/EmptyState';
import { companyId } from '../utils/helpers';
import type { JobFilters } from '../types';

interface Props { searchQ: string; }

export default function JobsPage({ searchQ }: Props) {
  const { allJobs, openCompanyPage } = useApp();
  const [sort, setSort]         = useState<'newest'|'featured'|'salary'>('newest');
  const [filters, setFilters]   = useState<JobFilters>({ q:'', type:'', exp:'', reg:'' });
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let list = [...allJobs];
    const q = (searchQ || filters.q).trim().toLowerCase();
    if (q) list = list.filter(j =>
      j.title.toLowerCase().includes(q) ||
      (j.company_name || '').toLowerCase().includes(q) ||
      (j.field || '').toLowerCase().includes(q)
    );
    if (filters.type) list = list.filter(j => j.job_type === filters.type);
    if (filters.exp)  list = list.filter(j => j.experience_level === filters.exp);
    if (filters.reg)  list = list.filter(j => j.region === filters.reg);

    if (sort === 'newest')   list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (sort === 'featured') list.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
    if (sort === 'salary')   list.sort((a, b) => (b.salary_max || 0) - (a.salary_max || 0));
    return list;
  }, [allJobs, searchQ, filters, sort]);

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(16px,3vw,24px) clamp(12px,4vw,40px)' }}>
      <SortBar
        total={filtered.length}
        sort={sort}
        onSort={v => setSort(v as typeof sort)}
        onToggleFilters={() => setShowFilters(o => !o)}
        showFilters={showFilters}
      />

      <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
        <div className="sidebar-wrapper" style={{ flexShrink: 0 }}>
          <FilterSidebar
            filters={filters}
            onChange={f => setFilters(p => ({ ...p, ...f }))}
            onReset={() => setFilters({ q:'', type:'', exp:'', reg:'' })}
            total={filtered.length}
          />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {filtered.length === 0 ? (
            <EmptyState icon="🔍" title="لا توجد وظائف مطابقة" sub="جرّب كلمة بحث أخرى أو غيّر الفلاتر" />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>
              {filtered.map(j => (
                <JobCard key={j._id || j.id} job={j} onClick={() => openCompanyPage(companyId(j))} />
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media(max-width:768px){
          .filter-toggle-btn{display:flex!important}
          .sidebar-wrapper{display:${showFilters ? 'block' : 'none'};width:100%}
        }
        @media(max-width:480px){
          div[style*="auto-fill"]{grid-template-columns:1fr!important}
        }
      `}</style>
    </div>
  );
}
