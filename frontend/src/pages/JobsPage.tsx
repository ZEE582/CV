import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import JobCard from '../components/jobs/JobCard';
import FilterSidebar from '../components/jobs/FilterSidebar';
import type { Job, JobFilters } from '../types';

const SORT_OPTIONS = [
  { val: 'newest',   label: 'الأحدث' },
  { val: 'featured', label: '⭐ المميزة' },
  { val: 'salary',   label: '💰 الراتب' },
];

interface Props { searchQ: string; }

export default function JobsPage({ searchQ }: Props) {
  const { allJobs, loadJobs, openCompanyPage } = useApp();
  const [sort, setSort]       = useState<'newest'|'featured'|'salary'>('newest');
  const [filters, setFilters] = useState<JobFilters>({ q:'', type:'', exp:'', reg:'' });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { if (!allJobs.length) loadJobs(); }, []);

  const filtered = useMemo(() => {
    let list = [...allJobs];
    const q = (searchQ || filters.q).trim().toLowerCase();
    if (q) list = list.filter(j =>
      j.title.toLowerCase().includes(q) ||
      (j.company_name||'').toLowerCase().includes(q) ||
      (j.field||'').toLowerCase().includes(q) ||
      (j.description||'').toLowerCase().includes(q)
    );
    if (filters.type) list = list.filter(j => j.job_type === filters.type);
    if (filters.exp)  list = list.filter(j => j.experience_level === filters.exp);
    if (filters.reg)  list = list.filter(j => j.region === filters.reg);

    if (sort === 'newest')   list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (sort === 'featured') list.sort((a, b) => (b.is_featured?1:0) - (a.is_featured?1:0));
    if (sort === 'salary')   list.sort((a, b) => (b.salary_max||0) - (a.salary_max||0));
    return list;
  }, [allJobs, searchQ, filters, sort]);

  const handleJobClick = (job: Job) => { openCompanyPage(job.company_id); };

  return (
    <div style={{
      maxWidth: 1280, margin: '0 auto',
      padding: 'clamp(16px, 3vw, 24px) clamp(12px, 4vw, 40px)',
    }}>
      {/* Sort + count + filter toggle (mobile) */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontFamily: "'Tajawal',sans-serif", fontSize: 14, color: '#9999bb' }}>
            <span style={{ fontWeight: 700, color: '#7b68ee' }}>{filtered.length}</span> وظيفة تقنية
          </div>
          {/* زر الفلاتر — يظهر على الجوال */}
          <button
            onClick={() => setShowFilters(o => !o)}
            className="filter-toggle-btn"
            style={{
              fontFamily: "'Tajawal',sans-serif", fontSize: 12,
              padding: '5px 12px', borderRadius: 8, cursor: 'pointer',
              border: '1px solid rgba(107,95,230,0.3)',
              background: showFilters ? 'rgba(107,95,230,0.10)' : 'rgba(255,255,255,0.8)',
              color: '#7b68ee', display: 'none',
            }}
          >
            🔽 فلاتر
          </button>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {SORT_OPTIONS.map(o => (
            <button key={o.val} onClick={() => setSort(o.val as typeof sort)}
              style={{
                padding: '5px clamp(8px, 2vw, 13px)',
                borderRadius: 8, fontSize: 'clamp(11px, 2vw, 12px)',
                fontFamily: "'Tajawal',sans-serif", cursor: 'pointer', transition: 'all .15s',
                border: '1px solid',
                borderColor: sort === o.val ? '#7b68ee' : 'rgba(0,0,0,0.09)',
                background: sort === o.val ? '#7b68ee' : 'rgba(255,255,255,0.8)',
                color: sort === o.val ? '#fff' : '#7777aa',
                boxShadow: sort === o.val ? '0 2px 8px rgba(107,95,230,0.25)' : 'none',
              }}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
        {/* Sidebar — يخفى على الجوال ويظهر عند الضغط على فلاتر */}
        <div className="sidebar-wrapper" style={{ flexShrink: 0 }}>
          <FilterSidebar
            filters={filters}
            onChange={f => setFilters(p => ({...p, ...f}))}
            onReset={() => setFilters({ q:'', type:'', exp:'', reg:'' })}
            total={filtered.length}
          />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {allJobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', fontFamily: "'Tajawal',sans-serif", color: '#9999bb' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
              <p style={{ fontSize: 15 }}>جاري تحميل الوظائف…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', fontFamily: "'Tajawal',sans-serif" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>لا توجد وظائف مطابقة</p>
              <p style={{ fontSize: 13, color: '#9999bb', marginTop: 4 }}>جرّب كلمة بحث أخرى أو غيّر الفلاتر</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 12,
            }}>
              {filtered.map(j => (
                <JobCard key={j.id} job={j} onClick={() => handleJobClick(j)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Responsive CSS */}
      <style>{`
        @media (max-width: 768px) {
          .filter-toggle-btn { display: flex !important; }
          .sidebar-wrapper { display: ${showFilters ? 'block' : 'none'}; width: 100%; }
        }
        @media (max-width: 480px) {
          div[style*="auto-fill"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
