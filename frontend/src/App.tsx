import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/layout/Header';
import Toaster from './components/common/Toaster';
import JobsPage from './pages/JobsPage';
import CompanyPage from './pages/CompanyPage';
import AiChat from './components/ai/AiChat';

function AppInner() {
  const { activePage, loadJobs, activeCompanyId } = useApp();
  const [searchQ, setSearchQ] = useState('');

  useEffect(() => { loadJobs(); }, []);

  return (
    <div style={{ minHeight: '100vh', direction: 'rtl', fontFamily: "'Tajawal', sans-serif" }}>
      <Header searchQ={searchQ} onSearch={setSearchQ} />
      <main>
        {/* صفحة الشركة تأخذ الأولوية عند فتحها */}
        {activeCompanyId ? (
          <CompanyPage companyId={activeCompanyId} />
        ) : (
          <>
            {activePage === 'jobs' && <JobsPage searchQ={searchQ} />}
            {activePage === 'ai'   && <AiChat />}
          </>
        )}
      </main>
      <Toaster />
    </div>
  );
}

export default function App() {
  return <AppProvider><AppInner /></AppProvider>;
}
