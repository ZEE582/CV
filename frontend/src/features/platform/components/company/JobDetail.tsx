import React, { useEffect, useRef } from 'react';
import type { Job } from '../../types';
import { fmtSal, parseJson, jobColor } from '../../utils/helpers';
import ApplicationForm from '../jobs/ApplicationForm';

interface Props { job: Job; onClose: () => void; }

const T: React.CSSProperties = { fontFamily: "'Tajawal',sans-serif" };

export default function JobDetail({ job, onClose }: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  const color = jobColor(job);
  const reqs  = parseJson(job.requirements);
  const bens  = parseJson(job.benefits);

  return (
    <section aria-label="تفاصيل الوظيفة" style={{ background: 'rgba(255,255,255,0.9)', borderRadius: 18, border: '1px solid rgba(0,0,0,0.08)', padding: 'clamp(16px, 4vw, 24px)', overflowWrap: 'anywhere', marginBottom: 32, backdropFilter: 'blur(8px)' }}>
      {/* رأس */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div>
          <h3 ref={heading} tabIndex={-1} style={{ ...T, fontWeight: 800, fontSize: 20, color: '#1a1a2e', marginBottom: 4 }}>{job.title}</h3>
          <div style={{ ...T, fontSize: 14, fontWeight: 700, color }}><bdi dir="ltr">{fmtSal(job)}</bdi></div>
        </div>
        <button type="button" aria-label="إغلاق تفاصيل الوظيفة" onClick={onClose} style={{ background: 'rgba(0,0,0,0.07)', border: 'none', borderRadius: 99, width: 30, height: 30, cursor: 'pointer', fontSize: 15, color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      </div>

      {/* إحصاءات */}
      <div className="job-detail-meta" style={{ display: 'grid', gap: 10, marginBottom: 18 }}>
        {[
          { i: '📍', l: 'المنطقة',  v: job.region === 'remote' ? 'عن بُعد' : job.region || '—' },
          { i: '⏰', l: 'نوع العمل', v: job.job_type || '—' },
          { i: '🎓', l: 'الخبرة',   v: job.experience_level || '—' },
          { i: '⏳', l: 'آخر موعد', v: job.deadline ? new Date(job.deadline).toLocaleDateString('ar') : '—' },
        ].map(({ i, l, v }) => (
          <div key={l} style={{ background: '#f8f8fc', borderRadius: 12, padding: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{i}</div>
            <div style={{ ...T, fontSize: 10, color: '#9999bb', marginBottom: 2 }}>{l}</div>
            <div style={{ ...T, fontSize: 11, fontWeight: 700, color: '#1a1a2e' }}>{v}</div>
          </div>
        ))}
      </div>

      {/* الوصف */}
      {job.description && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ ...T, fontWeight: 700, fontSize: 14, color: '#1a1a2e', marginBottom: 8 }}>وصف الوظيفة</div>
          <p style={{ ...T, fontSize: 13, color: '#444466', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{job.description}</p>
        </div>
      )}

      {/* المتطلبات */}
      {reqs.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ ...T, fontWeight: 700, fontSize: 14, color: '#1a1a2e', marginBottom: 8 }}>المتطلبات</div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {reqs.map((r, i) => <li key={i} style={{ display: 'flex', gap: 8, ...T, fontSize: 13, color: '#444466' }}><span style={{ color, flexShrink: 0 }}>◆</span>{r}</li>)}
          </ul>
        </div>
      )}

      {/* المزايا */}
      {bens.length > 0 && (
        <div>
          <div style={{ ...T, fontWeight: 700, fontSize: 14, color: '#1a1a2e', marginBottom: 8 }}>المزايا</div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {bens.map((b, i) => <li key={i} style={{ display: 'flex', gap: 8, ...T, fontSize: 13, color: '#444466' }}><span style={{ color: '#f59e0b', flexShrink: 0 }}>★</span>{b}</li>)}
          </ul>
        </div>
      )}
      <ApplicationForm key={job._id} job={job} />
    </section>
  );
}
