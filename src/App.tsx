import { useState } from "react";
import {
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import {
  CssBaseline,
  ThemeProvider,
} from "@mui/material";

import {
  ColorModeContext,
  useMode,
} from "./theme";

import Topbar from "./scenes/dashboard/global/topbar";
import Sidebar from "./scenes/dashboard/global/sidebar";

import Dashboard from "./scenes/dashboard";
import Team from "./scenes/team";
import Contacts from "./scenes/contacts";
import Invoices from "./scenes/invoices";
import Form from "./scenes/Form";
import Calendar from "./scenes/calendar/calendar";
import Companies from "./scenes/companies";
import CompanyDetails from "./scenes/companyDetails";
import CompanyDashboard from "./scenes/companyDashboard";
import Applicants from "./scenes/applicants";
import Login from "./scenes/login";

const App = () => {
  const [theme, colorMode] = useMode();

  const [isSidebar, setIsSidebar] =
    useState(true);

  const location = useLocation();

  const isLoginPage =
    location.pathname === "/";

  return (
    <ColorModeContext.Provider
      value={colorMode}
    >
      <ThemeProvider theme={theme}>
        <CssBaseline />

        <div className="app">
          {!isLoginPage && <Sidebar />}

          <main className="content">
            {!isLoginPage && (
              <Topbar
                setIsSidebar={setIsSidebar}
              />
            )}

            <Routes>
              <Route
                path="/"
                element={<Login />}
              />

              <Route
                path="/dashboard"
                element={<Dashboard />}
              />

              <Route
                path="/team"
                element={<Team />}
              />

              <Route
                path="/contacts"
                element={<Contacts />}
              />

              <Route
                path="/invoices"
                element={<Invoices />}
              />

              <Route
                path="/form"
                element={<Form />}
              />

              <Route
                path="/calendar"
                element={<Calendar />}
              />

              <Route
                path="/companies"
                element={<Companies />}
              />

              <Route
                path="/company-details"
                element={<CompanyDetails />}
              />

              <Route
                path="/company-dashboard"
                element={<CompanyDashboard />}
              />

              <Route
                path="/applicants"
                element={<Applicants />}
              />
            </Routes>
          </main>
        </div>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};

export default App;