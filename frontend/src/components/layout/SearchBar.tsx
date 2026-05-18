import React from 'react';

interface Props { value: string; onChange: (q: string) => void; }

export default function SearchBar({ value, onChange }: Props) {
  return (
    <div style={{ borderTop: '1px solid rgba(107,95,230,0.08)', background: 'rgba(255,255,255,0.85)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px clamp(16px,4vw,44px)', maxWidth: 1280, margin: '0 auto' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9090b8" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder="ابحث عن وظيفة تقنية..."
          style={{ flex: 1, border: 'none', background: 'transparent', fontFamily: "'Tajawal',sans-serif", fontSize: 14, color: '#1a1a2e', outline: 'none' }} />
        {value && <button onClick={() => onChange('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8080aa', fontSize: 17 }}>×</button>}
      </div>
    </div>
  );
}
