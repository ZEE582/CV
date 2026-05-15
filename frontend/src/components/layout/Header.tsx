/**
 * Header.tsx
 * ناف بار — شعار تطوّر في الزاوية اليسرى + responsive كامل
 * في RTL: اليسار = نهاية الصفحة (end)
 * الشعار يظهر على اليسار دائماً، الناف على اليمين
 */
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

interface Props { searchQ: string; onSearch: (q: string) => void; }

const ACCENT = '#6B5FE6';

export default function Header({ searchQ, onSearch }: Props) {
  const { activePage, setActivePage, activeCompanyId, closeCompanyPage } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);

  const isJobsActive = activePage === 'jobs' && !activeCompanyId;
  const isAiActive   = activePage === 'ai';

  const navItems = [
    { id: 'jobs', label: 'الوظائف', active: isJobsActive },
    { id: 'ai',   label: '🤖 مساعد AI', active: isAiActive  },
  ];

  const handleNav = (id: string) => {
    closeCompanyPage();
    setActivePage(id);
    setMenuOpen(false);
  };

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(255,255,255,0.94)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(107,95,230,0.12)',
      /* شادو مناسب لألوان الصفحة البنفسجية */
      boxShadow: '0 2px 20px rgba(107,95,230,0.10), 0 1px 4px rgba(107,95,230,0.06)',
    }}>
      {/* ── الشريط الرئيسي ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        /* padding responsive */
        padding: '0 clamp(16px, 4vw, 44px)',
        height: 60,
        maxWidth: 1280,
        margin: '0 auto',
        /* الشعار على اليسار، الناف على اليمين (RTL) */
        flexDirection: 'row-reverse',
      }}>

        {/* ── الشعار: تطوّر — الزاوية اليسرى ── */}
        <button
          onClick={() => { closeCompanyPage(); setActivePage('jobs'); setMenuOpen(false); }}
          style={{
            display: 'flex', alignItems: 'baseline', gap: 6,
            border: 'none', background: 'none', cursor: 'pointer', padding: '4px 0',
            flexShrink: 0,
          }}
        >
          {/* أيقونة التطوير — نقطة بنفسجية */}
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: `linear-gradient(135deg, ${ACCENT}, #a89cf7)`,
            display: 'inline-block', marginBottom: 2, flexShrink: 0,
          }} />
          <span style={{
            fontFamily: "'Tajawal',sans-serif", fontWeight: 900,
            fontSize: 'clamp(18px, 3vw, 22px)',
            color: '#1a1a2e', letterSpacing: '-0.5px', lineHeight: 1,
          }}>
            تطوّر
          </span>
          <span style={{
            fontFamily: "'Tajawal',sans-serif", fontWeight: 300,
            fontSize: 'clamp(10px, 1.5vw, 13px)',
            color: '#9090bb', letterSpacing: '2px', lineHeight: 1,
          }}>
            ttwar
          </span>
        </button>

        {/* ── Desktop Nav — يظهر من md وفوق ── */}
        <nav style={{
          display: 'flex', alignItems: 'center', gap: 6,
        }} className="desktop-nav">
          {activeCompanyId && (
            <button
              onClick={closeCompanyPage}
              style={{
                fontFamily: "'Tajawal',sans-serif", fontSize: 13,
                color: '#8080aa', background: 'none', border: 'none',
                cursor: 'pointer', padding: '5px 10px',
              }}
            >
              ← الوظائف
            </button>
          )}

          {navItems.map(({ id, label, active }) => (
            <button
              key={id}
              onClick={() => handleNav(id)}
              style={{
                fontFamily: "'Tajawal',sans-serif",
                fontSize: 14,
                fontWeight: active ? 700 : 500,
                color: active ? '#1a1a2e' : '#555577',
                background: active ? 'rgba(107,95,230,0.10)' : 'rgba(0,0,0,0.04)',
                border: active ? '1px solid rgba(107,95,230,0.22)' : '1px solid rgba(0,0,0,0.08)',
                borderRadius: 9,
                padding: '7px 18px',
                cursor: 'pointer',
                transition: 'all .15s',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* ── Mobile Hamburger — يظهر على الشاشات الصغيرة ── */}
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="mobile-menu-btn"
          style={{
            display: 'none',
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 6, borderRadius: 8,
            color: '#555577',
          }}
          aria-label="القائمة"
        >
          {menuOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          )}
        </button>
      </div>

      {/* ── Mobile Dropdown Menu ── */}
      {menuOpen && (
        <div style={{
          background: '#fff',
          borderTop: '1px solid rgba(107,95,230,0.10)',
          padding: '12px 20px 16px',
          display: 'flex', flexDirection: 'column', gap: 8,
          boxShadow: '0 8px 24px rgba(107,95,230,0.12)',
        }}>
          {activeCompanyId && (
            <button
              onClick={() => { closeCompanyPage(); setMenuOpen(false); }}
              style={{
                fontFamily: "'Tajawal',sans-serif", fontSize: 14,
                color: '#8080aa', background: 'none', border: 'none',
                cursor: 'pointer', padding: '8px 0', textAlign: 'right',
              }}
            >
              ← الرجوع للوظائف
            </button>
          )}
          {navItems.map(({ id, label, active }) => (
            <button
              key={id}
              onClick={() => handleNav(id)}
              style={{
                fontFamily: "'Tajawal',sans-serif",
                fontSize: 15, fontWeight: active ? 700 : 500,
                color: active ? ACCENT : '#333355',
                background: active ? 'rgba(107,95,230,0.08)' : 'transparent',
                border: 'none', borderRadius: 10,
                padding: '10px 14px', cursor: 'pointer',
                textAlign: 'right', transition: 'background .15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── شريط البحث ── */}
      {isJobsActive && (
        <div style={{
          borderTop: '1px solid rgba(107,95,230,0.08)',
          background: 'rgba(255,255,255,0.85)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px clamp(16px, 4vw, 44px)',
            maxWidth: 1280, margin: '0 auto',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9090b8" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text" value={searchQ} onChange={e => onSearch(e.target.value)}
              placeholder="ابحث عن وظيفة تقنية..."
              style={{
                flex: 1, border: 'none', background: 'transparent',
                fontFamily: "'Tajawal',sans-serif", fontSize: 14,
                color: '#1a1a2e', outline: 'none',
              }}
            />
            {searchQ && (
              <button onClick={() => onSearch('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8080aa', fontSize: 17, lineHeight: 1 }}>
                ×
              </button>
            )}
          </div>
        </div>
      )}

      {/* Responsive CSS */}
      <style>{`
        @media (max-width: 640px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; align-items: center; }
        }
      `}</style>
    </header>
  );
}
