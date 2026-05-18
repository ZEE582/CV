import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Header      from './components/layout/Header';
import Toaster     from './components/common/Toaster';
import JobsPage    from './pages/JobsPage';
import CompanyPage from './pages/CompanyPage';
import AiChat      from './components/ai/AiChat';
import CVBuilderPage from './pages/CVBuilderPage';

function AppInner() {
  const { activePage, activeCompanyId } = useApp();
  const [searchQ, setSearchQ] = useState('');

  return (
    <div style={{ minHeight: '100vh', direction: 'rtl', fontFamily: "'Tajawal',sans-serif" }}>
      <Header searchQ={searchQ} onSearch={setSearchQ} />
      <main>
        {activeCompanyId ? (
          <CompanyPage companyId={activeCompanyId} />
        ) : (
          <>
            {activePage === 'jobs' && <JobsPage searchQ={searchQ} />}
            {activePage === 'ai'   && <AiChat />}
            {activePage === 'cv'   && (
              <div style={{ direction: 'ltr' }}>
                <CVBuilderPage />
              </div>
            )}
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
