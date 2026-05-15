/**
 * CompanyPage.tsx
 * صفحة الشركة الكاملة — تُعرض مباشرة عند النقر على وظيفة
 */
import React, { useEffect, useState } from 'react';
import { companiesApi, sendContactMessage } from '../api/client';
import { useApp } from '../context/AppContext';
import type { Company, Job } from '../types';
import { ini, fmtSal, parseJson, jobColor, ago } from '../utils/helpers';

interface Props { companyId: string; highlightJobId?: string; }

const T: React.CSSProperties = { fontFamily: "'Tajawal',sans-serif" };

export default function CompanyPage({ companyId, highlightJobId }: Props) {
  const { toast, openCompanyPage } = useApp();
  const [co, setCo]       = useState<Company | null>(null);
  const [jobs, setJobs]   = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selJob, setSelJob]   = useState<Job | null>(null);
  const [form, setForm]   = useState({ name:'', email:'', phone:'', subject:'استفسار', msg:'' });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setLoading(true);
    companiesApi.get(companyId).then(d => {
      setCo(d.company);
      setJobs(d.jobs || []);
      // افتح الوظيفة المحددة تلقائياً
      if (highlightJobId) {
        const j = d.jobs?.find(j => j.id === highlightJobId);
        if (j) setSelJob(j);
      }
    }).catch(() => toast('تعذّر تحميل بيانات الشركة', 'err'))
      .finally(() => setLoading(false));
  }, [companyId]);

  const handleSend = async () => {
    if (!form.name || !form.email || !form.msg) { toast('يرجى ملء الاسم والبريد والرسالة', 'err'); return; }
    setSending(true);
    try {
      await sendContactMessage({ company_id: companyId, sender_name: form.name, sender_email: form.email, sender_phone: form.phone || undefined, subject: form.subject, message: form.msg });
      toast('تم إرسال رسالتك بنجاح ✓');
      setForm({ name:'', email:'', phone:'', subject:'استفسار', msg:'' });
    } catch (e: unknown) { toast(e instanceof Error ? e.message : 'فشل الإرسال', 'err'); }
    finally { setSending(false); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 40, height: 40, border: '3px solid #e0e0f0', borderTopColor: '#7b68ee', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ ...T, color: '#9999bb', fontSize: 14 }}>جاري التحميل…</span>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!co) return (
    <div style={{ textAlign: 'center', padding: '80px 24px', ...T }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
      <p style={{ color: '#1a1a2e', fontWeight: 700, fontSize: 18 }}>الشركة غير موجودة</p>
    </div>
  );

  const color = co.color && co.color !== '#1a7a4a' && co.color !== '#0d5c30' ? co.color : '#7b68ee';
  const inp: React.CSSProperties = { width: '100%', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 10, padding: '9px 12px', ...T, fontSize: 13, background: '#fafafa', color: '#1a1a2e', outline: 'none' };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 40px', animation: 'fadeUp .3s ease' }}>

      {/* ── Hero الشركة ── */}
      <div style={{ background: `linear-gradient(135deg, ${color}18, ${color}08)`, borderRadius: 20, border: `1px solid ${color}22`, padding: '32px', marginBottom: 28 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{ width: 72, height: 72, borderRadius: 18, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 24, ...T, flexShrink: 0, boxShadow: `0 8px 24px ${color}44` }}>
            {ini(co.name_ar)}
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
              <h1 style={{ ...T, fontWeight: 900, fontSize: 26, color: '#1a1a2e', margin: 0 }}>{co.name_ar}</h1>
              {co.is_verified && <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: 11, padding: '3px 10px', borderRadius: 99, fontWeight: 700, ...T }}>✓ موثقة</span>}
              {co.is_featured && <span style={{ background: '#fef9c3', color: '#a16207', fontSize: 11, padding: '3px 10px', borderRadius: 99, fontWeight: 700, ...T }}>⭐ مميزة</span>}
            </div>
            {co.name_en && <div style={{ ...T, fontSize: 14, color: '#8080aa', marginBottom: 10 }}>{co.name_en}</div>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {co.sector   && <span style={{ ...T, fontSize: 12, padding: '3px 11px', borderRadius: 99, background: `${color}15`, color }}>{co.sector}</span>}
              {co.region   && <span style={{ ...T, fontSize: 12, padding: '3px 11px', borderRadius: 99, background: 'rgba(59,130,246,0.09)', color: '#2563eb' }}>📍 {co.region}</span>}
              {co.size     && <span style={{ ...T, fontSize: 12, padding: '3px 11px', borderRadius: 99, background: 'rgba(0,0,0,0.05)', color: '#555577' }}>👥 {co.size}</span>}
              {co.founded_year && <span style={{ ...T, fontSize: 12, padding: '3px 11px', borderRadius: 99, background: 'rgba(0,0,0,0.05)', color: '#555577' }}>📅 {co.founded_year}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {co.website && <a href={co.website} target="_blank" rel="noopener noreferrer" style={{ ...T, fontSize: 13, color, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>🌐 {co.website}</a>}
            {co.email   && <a href={`mailto:${co.email}`} style={{ ...T, fontSize: 13, color, textDecoration: 'none' }}>✉️ {co.email}</a>}
          </div>
        </div>

        {/* About */}
        <p style={{ ...T, fontSize: 14, color: '#444466', lineHeight: 1.9, marginTop: 20, maxWidth: 680 }}>{co.about_ar}</p>
      </div>

      {/* ── الوظائف ── */}
      {jobs.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ ...T, fontWeight: 800, fontSize: 18, color: '#1a1a2e', marginBottom: 16 }}>
            💼 الوظائف المتاحة ({jobs.length})
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {jobs.map(j => {
              const c = jobColor(j);
              const isHighlight = j.id === highlightJobId;
              return (
                <div key={j.id} onClick={() => setSelJob(j)}
                  style={{ background: isHighlight ? `${c}0e` : 'rgba(255,255,255,0.85)', border: `1px solid ${isHighlight ? c+'44' : 'rgba(0,0,0,0.07)'}`, borderRadius: 14, padding: '14px 16px', cursor: 'pointer', transition: 'all .15s', position: 'relative', overflow: 'hidden' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}>
                  <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 3, background: c, borderRadius: '0 14px 14px 0' }} />
                  <div style={{ ...T, fontWeight: 700, fontSize: 14, color: '#1a1a2e', marginBottom: 5 }}>{j.title}</div>
                  <div style={{ ...T, fontSize: 13, fontWeight: 700, color: c, marginBottom: 7 }}>{fmtSal(j)}</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {j.job_type && <span style={{ ...T, fontSize: 11, padding: '2px 8px', borderRadius: 99, background: `${c}14`, color: c }}>{j.job_type}</span>}
                    {j.region   && <span style={{ ...T, fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'rgba(59,130,246,0.09)', color: '#2563eb' }}>📍 {j.region}</span>}
                  </div>
                  <div style={{ ...T, fontSize: 11, color: '#9999bb', marginTop: 8 }}>{ago(j.created_at)}</div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── تفاصيل الوظيفة المحددة ── */}
      {selJob && (
        <section style={{ background: 'rgba(255,255,255,0.9)', borderRadius: 18, border: '1px solid rgba(0,0,0,0.08)', padding: '24px', marginBottom: 32, backdropFilter: 'blur(8px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
            <div>
              <h3 style={{ ...T, fontWeight: 800, fontSize: 20, color: '#1a1a2e', marginBottom: 4 }}>{selJob.title}</h3>
              <div style={{ ...T, fontSize: 14, fontWeight: 700, color: jobColor(selJob) }}>{fmtSal(selJob)}</div>
            </div>
            <button onClick={() => setSelJob(null)} style={{ background: 'rgba(0,0,0,0.07)', border: 'none', borderRadius: 99, width: 30, height: 30, cursor: 'pointer', fontSize: 15, color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 18 }}>
            {[
              { i: '📍', l: 'المنطقة', v: selJob.region || '—' },
              { i: '⏰', l: 'نوع العمل', v: selJob.job_type || '—' },
              { i: '🎓', l: 'الخبرة', v: selJob.experience_level || '—' },
              { i: '⏳', l: 'آخر موعد', v: selJob.deadline ? new Date(selJob.deadline).toLocaleDateString('ar') : '—' },
            ].map(({ i, l, v }) => (
              <div key={l} style={{ background: '#f8f8fc', borderRadius: 12, padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{i}</div>
                <div style={{ ...T, fontSize: 10, color: '#9999bb', marginBottom: 2 }}>{l}</div>
                <div style={{ ...T, fontSize: 11, fontWeight: 700, color: '#1a1a2e' }}>{v}</div>
              </div>
            ))}
          </div>

          {selJob.description && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ ...T, fontWeight: 700, fontSize: 14, color: '#1a1a2e', marginBottom: 8 }}>وصف الوظيفة</div>
              <p style={{ ...T, fontSize: 13, color: '#444466', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{selJob.description}</p>
            </div>
          )}

          {parseJson(selJob.requirements).length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ ...T, fontWeight: 700, fontSize: 14, color: '#1a1a2e', marginBottom: 8 }}>المتطلبات</div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {parseJson(selJob.requirements).map((r, i) => (
                  <li key={i} style={{ display: 'flex', gap: 8, ...T, fontSize: 13, color: '#444466' }}>
                    <span style={{ color: jobColor(selJob), flexShrink: 0 }}>◆</span>{r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {parseJson(selJob.benefits).length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ ...T, fontWeight: 700, fontSize: 14, color: '#1a1a2e', marginBottom: 8 }}>المزايا</div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {parseJson(selJob.benefits).map((b, i) => (
                  <li key={i} style={{ display: 'flex', gap: 8, ...T, fontSize: 13, color: '#444466' }}>
                    <span style={{ color: '#f59e0b', flexShrink: 0 }}>★</span>{b}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* ── نموذج التواصل ── */}
      <section style={{ background: 'rgba(255,255,255,0.88)', borderRadius: 18, border: '1px solid rgba(0,0,0,0.07)', padding: '24px' }}>
        <h2 style={{ ...T, fontWeight: 800, fontSize: 17, color: '#1a1a2e', marginBottom: 18 }}>✉️ تواصل مع {co.name_ar}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ ...T, fontSize: 11, color: '#9999bb', display: 'block', marginBottom: 4 }}>الاسم الكامل *</label>
            <input style={inp} value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="محمد أحمد" />
          </div>
          <div>
            <label style={{ ...T, fontSize: 11, color: '#9999bb', display: 'block', marginBottom: 4 }}>البريد الإلكتروني *</label>
            <input style={inp} type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} placeholder="name@example.com" dir="ltr" />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ ...T, fontSize: 11, color: '#9999bb', display: 'block', marginBottom: 4 }}>رقم الهاتف</label>
            <input style={inp} value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} placeholder="+970..." dir="ltr" />
          </div>
          <div>
            <label style={{ ...T, fontSize: 11, color: '#9999bb', display: 'block', marginBottom: 4 }}>الموضوع</label>
            <input style={inp} value={form.subject} onChange={e => setForm(p => ({...p, subject: e.target.value}))} placeholder="استفسار عن وظيفة" />
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ ...T, fontSize: 11, color: '#9999bb', display: 'block', marginBottom: 4 }}>الرسالة *</label>
          <textarea style={{ ...inp, height: 100, resize: 'none' }} value={form.msg} onChange={e => setForm(p => ({...p, msg: e.target.value}))} placeholder="اكتب رسالتك هنا..." dir="rtl" />
        </div>
        <button onClick={handleSend} disabled={sending}
          style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: '#fff', ...T, fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: sending ? 0.65 : 1, transition: 'opacity .15s' }}>
          {sending ? 'جاري الإرسال…' : '📤 إرسال الرسالة'}
        </button>
      </section>
    </div>
  );
}
