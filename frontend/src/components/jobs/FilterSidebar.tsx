import React from 'react';
import type { JobFilters } from '../../types';

const TYPES = ['دوام كامل','دوام جزئي','عقد مؤقت','عمل عن بُعد','فريلانس','تدريب مدفوع'];
const EXP   = ['حديث التخرج','1-3 سنوات','3-5 سنوات','+5 سنوات','قيادي'];
const REGS  = ['ضفة','قدس','غزة','48','remote'];

const s: React.CSSProperties = {
  width: '100%', fontSize: 12, fontFamily: "'Tajawal',sans-serif",
  border: '1px solid rgba(0,0,0,0.09)', borderRadius: 9,
  padding: '7px 10px', background: 'rgba(255,255,255,0.85)',
  color: '#1a1a2e', outline: 'none', cursor: 'pointer',
};

function Sel({ label, value, opts, onChange }: { label: string; value: string; opts: string[]; onChange: (v: string) => void }) {
  return (
    <div style={{ marginBottom: 13 }}>
      <div style={{ fontFamily: "'Tajawal',sans-serif", fontSize: 10, fontWeight: 700, color: '#9999cc', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 5 }}>{label}</div>
      <select value={value} onChange={e => onChange(e.target.value)} style={s} dir="rtl">
        <option value="">الكل</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

interface Props { filters: JobFilters; onChange: (f: Partial<JobFilters>) => void; onReset: () => void; total: number; }

export default function FilterSidebar({ filters, onChange, onReset, total }: Props) {
  const hasActive = Object.values(filters).some(v => v !== '');
  return (
    <aside style={{ width: 175, flexShrink: 0 }}>
      <div style={{ background: 'rgba(255,255,255,0.78)', borderRadius: 16, border: '1px solid rgba(0,0,0,0.07)', padding: '15px 13px', position: 'sticky', top: 70, backdropFilter: 'blur(8px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
          <span style={{ fontFamily: "'Tajawal',sans-serif", fontWeight: 700, fontSize: 14, color: '#1a1a2e' }}>الفلاتر</span>
          <span style={{ fontFamily: "'Tajawal',sans-serif", fontSize: 12, fontWeight: 700, color: '#7b68ee' }}>{total}</span>
        </div>
        <Sel label="نوع العمل"    value={filters.type} opts={TYPES} onChange={v => onChange({ type: v })} />
        <Sel label="مستوى الخبرة" value={filters.exp}  opts={EXP}   onChange={v => onChange({ exp: v })} />
        <Sel label="المنطقة"      value={filters.reg}  opts={REGS}  onChange={v => onChange({ reg: v })} />
        {hasActive && (
          <button onClick={onReset} style={{ width: '100%', padding: '7px', borderRadius: 9, border: '1px solid rgba(0,0,0,0.09)', background: 'transparent', fontFamily: "'Tajawal',sans-serif", fontSize: 12, color: '#9999bb', cursor: 'pointer', marginTop: 3 }}>
            ✕ إعادة تعيين
          </button>
        )}
      </div>
    </aside>
  );
}
