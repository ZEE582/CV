import React from 'react';
import type { Job } from '../../types';
import { ini, ago, fmtSal, parseJson, jobColor } from '../../utils/helpers';

interface Props { job: Job; onClick: () => void; }

export default function JobCard({ job, onClick }: Props) {
  const reqs  = parseJson(job.requirements).slice(0, 3);
  const color = jobColor(job);

  return (
    <div onClick={onClick}
      style={{
        background: 'rgba(255,255,255,0.82)', borderRadius: 16,
        border: '1px solid rgba(0,0,0,0.07)', padding: '18px 20px',
        cursor: 'pointer', position: 'relative', overflow: 'hidden',
        backdropFilter: 'blur(8px)',
        transition: 'transform .18s, box-shadow .18s',
        boxShadow: '0 2px 12px rgba(107,95,230,0.08), 0 1px 4px rgba(107,95,230,0.05)',
        animation: 'fadeUp .3s ease both',
      }}
      onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.transform = 'translateY(-2px)'; d.style.boxShadow = '0 8px 28px rgba(0,0,0,0.09)'; }}
      onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.transform = 'none'; d.style.boxShadow = 'none'; }}>

      {/* خط جانبي ملوّن */}
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 3, background: color, borderRadius: '0 16px 16px 0' }} />

      {/* أعلى البطاقة */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 11 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14, fontFamily: "'Tajawal',sans-serif", flexShrink: 0, boxShadow: `0 4px 12px ${color}44` }}>
          {ini(job.company_name || '')}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Tajawal',sans-serif", fontWeight: 700, fontSize: 14, color: '#1a1a2e', lineHeight: 1.3, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {job.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#7777aa', fontFamily: "'Tajawal',sans-serif" }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.company_name}</span>
            {job.company_verified && <span style={{ color: '#22c55e', fontSize: 11 }}>✓</span>}
            {job.is_featured && <span style={{ background: '#fef3c7', color: '#92400e', fontSize: 9, padding: '1px 6px', borderRadius: 99, fontWeight: 700 }}>مميزة</span>}
          </div>
        </div>
      </div>

      {/* الراتب */}
      <div style={{ fontFamily: "'Tajawal',sans-serif", fontSize: 13, fontWeight: 700, color, marginBottom: 9 }}>
        {fmtSal(job)}
      </div>

      {/* الوسوم */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
        {job.job_type && (
          <span style={{ padding: '2px 9px', borderRadius: 99, fontSize: 11, fontFamily: "'Tajawal',sans-serif", background: `${color}14`, color }}>
            {job.job_type}
          </span>
        )}
        {job.region && (
          <span style={{ padding: '2px 9px', borderRadius: 99, fontSize: 11, fontFamily: "'Tajawal',sans-serif", background: 'rgba(59,130,246,0.09)', color: '#2563eb' }}>
            📍 {job.region}
          </span>
        )}
        {job.experience_level && (
          <span style={{ padding: '2px 9px', borderRadius: 99, fontSize: 11, fontFamily: "'Tajawal',sans-serif", background: 'rgba(109,40,217,0.08)', color: '#6d28d9' }}>
            {job.experience_level}
          </span>
        )}
      </div>

      {/* المتطلبات */}
      {reqs.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 9 }}>
          {reqs.map((r, i) => (
            <span key={i} style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontFamily: "'Tajawal',sans-serif", background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.07)', color: '#555577' }}>
              {r}
            </span>
          ))}
        </div>
      )}

      {/* فوتر */}
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 9, borderTop: '1px solid rgba(0,0,0,0.06)', fontSize: 11, color: '#9999bb', fontFamily: "'Tajawal',sans-serif" }}>
        <span>{ago(job.created_at)}</span>
        <span>👁 {(job.views_count||0).toLocaleString()} &nbsp;📝 {(job.applications_count||0).toLocaleString()}</span>
      </div>
    </div>
  );
}
