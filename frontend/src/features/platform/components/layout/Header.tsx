import { useApp } from '../../context/AppContext';
import SearchBar from './SearchBar';

interface Props { searchQ: string; onSearch: (q: string) => void; }

export default function Header({ searchQ, onSearch }: Props) {
  const { activePage, activeCompanyId } = useApp();

  const isJobs = activePage === 'jobs' && !activeCompanyId;
  const isCV   = activePage === 'cv';

  if (!isJobs && !isCV) return null;
  return (
    <header style={{ background: '#fff', borderBottom: '1px solid rgba(107,95,230,0.12)' }}>

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

    </header>
  );
}
