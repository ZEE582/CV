import React from 'react';
import { useApp } from '../../context/AppContext';

const AC = '#6B5FE6';

export default function Logo() {
  const { setActivePage, closeCompanyPage } = useApp();
  return (
    <button onClick={() => { closeCompanyPage(); setActivePage('jobs'); }}
      style={{ display: 'flex', alignItems: 'baseline', gap: 6, border: 'none', background: 'none', cursor: 'pointer', padding: '4px 0', flexShrink: 0 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: `linear-gradient(135deg,${AC},#a89cf7)`, display: 'inline-block', marginBottom: 2 }} />
      <span style={{ fontFamily: "'Tajawal',sans-serif", fontWeight: 900, fontSize: 'clamp(18px,3vw,22px)', color: '#1a1a2e', letterSpacing: '-0.5px' }}>تطوّر</span>
      <span style={{ fontFamily: "'Tajawal',sans-serif", fontWeight: 300, fontSize: 'clamp(10px,1.5vw,13px)', color: '#9090bb', letterSpacing: '2px' }}>ttwar</span>
    </button>
  );
}
