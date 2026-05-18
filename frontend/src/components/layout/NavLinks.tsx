import React from 'react';
import { useApp } from '../../context/AppContext';

const AC = '#6B5FE6';

interface Props { menuOpen: boolean; setMenuOpen: (v: boolean) => void; }

export default function NavLinks({ menuOpen, setMenuOpen }: Props) {
  const { activePage, setActivePage, activeCompanyId, closeCompanyPage } = useApp();

  const isActive = (id: string) => activePage === id && (id !== 'jobs' || !activeCompanyId);
  const nav = [
    { id: 'jobs', label: 'الوظائف' },
    { id: 'cv',   label: '📄 CV Builder' },
    { id: 'ai',   label: '🤖 مساعد AI' },
  ];

  const go = (id: string) => { closeCompanyPage(); setActivePage(id); setMenuOpen(false); };
  const btnS = (active: boolean): React.CSSProperties => ({
    fontFamily: "'Tajawal',sans-serif", fontSize: 14, fontWeight: active ? 700 : 500,
    color: active ? '#1a1a2e' : '#555577',
    background: active ? 'rgba(107,95,230,0.10)' : 'rgba(0,0,0,0.04)',
    border: `1px solid ${active ? 'rgba(107,95,230,0.22)' : 'rgba(0,0,0,0.08)'}`,
    borderRadius: 9, padding: '7px 18px', cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap',
  });

  return (
    <>
      {/* Desktop */}
      <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {activeCompanyId && (
          <button onClick={closeCompanyPage} style={{ fontFamily: "'Tajawal',sans-serif", fontSize: 13, color: '#8080aa', background: 'none', border: 'none', cursor: 'pointer', padding: '5px 10px' }}>
            ← الوظائف
          </button>
        )}
        {nav.map(({ id, label }) => <button key={id} onClick={() => go(id)} style={btnS(isActive(id))}>{label}</button>)}
      </nav>

      {/* Hamburger */}
      <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)}
        style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: '#555577' }} aria-label="القائمة">
        {menuOpen
          ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        }
      </button>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', borderTop: '1px solid rgba(107,95,230,0.10)', padding: '12px 20px 16px', display: 'flex', flexDirection: 'column', gap: 8, boxShadow: '0 8px 24px rgba(107,95,230,0.12)', zIndex: 200 }}>
          {activeCompanyId && <button onClick={() => { closeCompanyPage(); setMenuOpen(false); }} style={{ fontFamily: "'Tajawal',sans-serif", fontSize: 14, color: '#8080aa', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0', textAlign: 'right' }}>← الرجوع</button>}
          {nav.map(({ id, label }) => (
            <button key={id} onClick={() => go(id)} style={{ fontFamily: "'Tajawal',sans-serif", fontSize: 15, fontWeight: isActive(id) ? 700 : 500, color: isActive(id) ? AC : '#333355', background: isActive(id) ? 'rgba(107,95,230,0.08)' : 'transparent', border: 'none', borderRadius: 10, padding: '10px 14px', cursor: 'pointer', textAlign: 'right' }}>
              {label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
