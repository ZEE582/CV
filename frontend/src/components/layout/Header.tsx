import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import Logo      from './Logo';
import NavLinks  from './NavLinks';
import SearchBar from './SearchBar';

interface Props { searchQ: string; onSearch: (q: string) => void; }

export default function Header({ searchQ, onSearch }: Props) {
  const { activePage, activeCompanyId } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);

  const isJobs = activePage === 'jobs' && !activeCompanyId;
  const isCV   = activePage === 'cv';

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(107,95,230,0.12)', boxShadow: '0 2px 20px rgba(107,95,230,0.10)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 clamp(16px,4vw,44px)', height: 60, maxWidth: 1280, margin: '0 auto', flexDirection: 'row-reverse', position: 'relative' }}>
        <Logo />
        <NavLinks menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      </div>

      {isJobs && <SearchBar value={searchQ} onChange={onSearch} />}

      {isCV && (
        <div style={{ borderTop: '1px solid rgba(107,95,230,0.08)', background: 'linear-gradient(90deg,rgba(107,95,230,0.06),rgba(168,156,247,0.03))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px clamp(16px,4vw,44px)', maxWidth: 1280, margin: '0 auto' }}>
            <span>📄</span>
            <span style={{ fontFamily: "'Tajawal',sans-serif", fontSize: 13, color: '#6B5FE6', fontWeight: 700 }}>CV Builder</span>
            <span style={{ fontFamily: "'Tajawal',sans-serif", fontSize: 12, color: '#9090bb' }}>— منشئ السيرة الذاتية الاحترافية</span>
            <span style={{ marginRight: 'auto', background: 'rgba(107,95,230,0.12)', color: '#6B5FE6', borderRadius: 5, padding: '2px 8px', fontSize: 9, fontWeight: 700 }}>10 Templates · PDF · Word</span>
          </div>
        </div>
      )}

      <style>{`
        @media(max-width:640px){
          .desktop-nav{display:none!important}
          .mobile-menu-btn{display:flex!important;align-items:center}
        }
      `}</style>
    </header>
  );
}
