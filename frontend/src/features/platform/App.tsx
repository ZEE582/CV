import React, { useState, lazy } from "react";
import { Routes, Route, useLocation, useSearchParams } from "react-router-dom";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";

import type { ThemeOptions } from '@mui/material/styles';

// Context Providers
import { AppProvider, useApp } from "./context/AppContext";
import { ColorModeContext, useMode, themeSettings } from "./theme";

// Layout Components
const Topbar = lazy(() => import("./scenes/dashboard/global/topbar"));
const Sidebar = lazy(() => import("./scenes/dashboard/global/sidebar"));
import Header from "./components/layout/Header";
import Toaster from "./components/common/Toaster";

// Pages & Scenes
const Dashboard = lazy(() => import("./scenes/dashboard"));
const Team = lazy(() => import("./scenes/team"));
const Contacts = lazy(() => import("./scenes/contacts"));
const Invoices = lazy(() => import("./scenes/invoices"));
const Form = lazy(() => import("./scenes/Form"));
const Calendar = lazy(() => import("./scenes/calendar/calendar"));
const Companies = lazy(() => import("./scenes/companies"));
const ManagementHistory = lazy(() => import('./pages/ManagementHistoryPage'));
const CompanyDetails = lazy(() => import("./scenes/companyDetails"));
const CompanyDashboard = lazy(() => import("./scenes/companyDashboard"));
const Applicants = lazy(() => import("./scenes/applicants"));
const CompanyMessages = lazy(() => import("./scenes/messages"));
import { Navigate } from "react-router-dom";
import { useAuth } from "../../shared/AuthContext";

// Public User Platform Pages
const JobsPage = lazy(() => import("./pages/JobsPage"));
const MyApplicationsPage = lazy(() => import("./pages/MyApplicationsPage"));
const CompanyPage = lazy(() => import("./pages/CompanyPage"));
const AiChat = lazy(() => import("./components/ai/AiChat"));
const PracticePage = lazy(() => import('./pages/PracticePage'));
const PlaygroundPage = lazy(() => import('./pages/PlaygroundPage'));
const CVBuilderPage = lazy(() => import("./pages/CVBuilderPage"));

const publicTheme = createTheme(themeSettings('light') as ThemeOptions);

/**
 * مكون المنصة العامة للوظائف والخدمات
 */
function PublicPlatform() {
  const { activePage, activeCompanyId } = useApp();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQ = (searchParams.get('q') || '').slice(0, 120);
  function setSearchQ(value: string) { setSearchParams(previous => { const next = new URLSearchParams(previous); if (value) next.set('q', value.slice(0, 120)); else next.delete('q'); next.delete('page'); return next; }, { replace: true }); }

  return (
    <div style={{ minHeight: "100vh", direction: "rtl", fontFamily: "'Tajawal', sans-serif" }}>
      <Header searchQ={searchQ} onSearch={setSearchQ} />
      <main>
        {activeCompanyId ? (
          <CompanyPage companyId={activeCompanyId} highlightJobId={new URLSearchParams(location.search).get('job') || undefined} />
        ) : (
          <>
            {activePage === "jobs" && <JobsPage />}
            {activePage === "applications" && <MyApplicationsPage />}
            {activePage === "ai" && <AiChat />}
            {activePage === "practice" && <PracticePage />}
            {activePage === "playground" && <PlaygroundPage />}
            {activePage === "cv" && (
              <div style={{ direction: "ltr" }}>
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

/**
 * المكون الرئيسي للتطبيق
 */
function AppContent() {
  const [theme, colorMode] = useMode();
  const [, setIsSidebar] = useState(true);

  const location = useLocation();
  const isLoginPage = false;
  const { user } = useAuth();
  const isDashboardRoute = location.pathname.startsWith("/admin");

  if (isDashboardRoute && user?.role === "company" && !["/admin/company-dashboard", "/admin/applicants", "/admin/messages"].includes(location.pathname)) return <Navigate to="/admin/company-dashboard" replace />;
  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={isDashboardRoute ? theme : publicTheme}>
        <CssBaseline />
        {isDashboardRoute || isLoginPage ? (
          <div className="app" style={{ backgroundColor: theme.palette.background.default, color: theme.palette.text.primary }}>
            {!isLoginPage && <Sidebar />}
            <main className="content">
              {!isLoginPage && <Topbar setIsSidebar={setIsSidebar} />}
              <Routes>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="*" element={<p className="p-8">الصفحة غير موجودة</p>} />

                <Route path="dashboard" element={<Dashboard />} />
                <Route path="team" element={<Team />} />
                <Route path="contacts" element={<Contacts />} />
                <Route path="invoices" element={<Invoices />} />
                <Route path="form" element={<Form />} />
                <Route path="calendar" element={<Calendar />} />
                <Route path="companies" element={<Companies />} />
                <Route path="history" element={<ManagementHistory />} />
                <Route path="company-details" element={<CompanyDetails />} />
                <Route path="company-dashboard" element={<CompanyDashboard />} />
                <Route path="applicants" element={<Applicants />} />
                <Route path="messages" element={<CompanyMessages />} />
              </Routes>
            </main>
          </div>
        ) : (
          <PublicPlatform />
        )}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
