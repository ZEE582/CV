import React from 'react';
import type { Job } from '../../types';
import { fmtSal, ago, jobColor, jobId } from '../../utils/helpers';

interface Props { jobs: Job[]; highlightJobId?: string; onSelect: (j: Job) => void; }

const T: React.CSSProperties = { fontFamily: "'Tajawal',sans-serif" };

export default function JobsGrid({ jobs, highlightJobId, onSelect }: Props) {
  if (!jobs.length) return null;

  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ ...T, fontWeight: 800, fontSize: 18, color: '#1a1a2e', marginBottom: 16 }}>
        💼 الوظائف المتاحة ({jobs.length})
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>
        {jobs.map(j => {
          const c  = jobColor(j);
          const hi = jobId(j) === highlightJobId;
          return (
            <div key={jobId(j)} onClick={() => onSelect(j)}
              style={{ background: hi ? `${c}0e` : 'rgba(255,255,255,0.85)', border: `1px solid ${hi ? c+'44' : 'rgba(0,0,0,0.07)'}`, borderRadius: 14, padding: '14px 16px', cursor: 'pointer', transition: 'all .15s', position: 'relative', overflow: 'hidden' }}
              onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.transform = 'translateY(-1px)'; d.style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)'; }}
              onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.transform = 'none'; d.style.boxShadow = 'none'; }}>
              <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 3, background: c, borderRadius: '0 14px 14px 0' }} />
              <div style={{ ...T, fontWeight: 700, fontSize: 14, color: '#1a1a2e', marginBottom: 5 }}>{j.title}</div>
              <div style={{ ...T, fontSize: 13, fontWeight: 700, color: c, marginBottom: 7 }}>{fmtSal(j)}</div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {j.job_type && <span style={{ ...T, fontSize: 11, padding: '2px 8px', borderRadius: 99, background: `${c}14`, color: c }}>{j.job_type}</span>}
                {j.region   && <span style={{ ...T, fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'rgba(59,130,246,0.09)', color: '#2563eb' }}>📍 {j.region}</span>}
              </div>
              <div style={{ ...T, fontSize: 11, color: '#9999bb', marginTop: 8 }}>{ago(j.createdAt)}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
