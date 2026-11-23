import { JSX, useState } from "react";
import { Sidebar as ProSidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import { tokens } from "../../../theme";
import { companyWorkspaceLink } from "../../../utils/companyDashboard";

import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import ContactsOutlinedIcon from "@mui/icons-material/ContactsOutlined";
import ReceiptOutlinedIcon from "@mui/icons-material/ReceiptOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import AssignmentIndOutlinedIcon from "@mui/icons-material/AssignmentIndOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';

interface ItemProps {
  title: string;
  to: string;
  icon: JSX.Element;
  selected: string;
  setSelected: (value: string) => void;
}

const Item = ({ title, to, icon, setSelected }: ItemProps) => {
  const theme = useTheme();
  const location = useLocation();
  const active = location.pathname === to;
  const destination = companyWorkspaceLink(to, new URLSearchParams(location.search).get("company"));
  const colors = tokens(theme.palette.mode);

  return (
    <MenuItem
      active={active}
      component={<Link to={destination} style={{textDecoration:"none",color:"inherit"}}/>}
      aria-current={active?"page":undefined}
      title={title}
      onClick={() => setSelected(title)}
      icon={icon}
      style={{
        color: active ? colors.greenAccent[500] : colors.grey[100],
      }}
    >
      <Typography>{title}</Typography>
    </MenuItem>
  );
};

import { useAuth } from "../../../../../shared/AuthContext";
const Sidebar = () => {
  const { logout, user } = useAuth();
  return <SidebarNavigation role={user?.role} onLogout={()=>{logout();window.location.href="/";}}/>;
};

export const SidebarNavigation=({role,onLogout}:{role?:string;onLogout:()=>void})=>{
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const mode = theme.palette.mode;
  const smallScreen = useMediaQuery('(max-width:760px)');
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(false);

  const getSelected = () => {
    if (location.pathname === "/admin/dashboard") return "Dashboard";
    if (location.pathname === "/admin/team") return "Team";
    if (location.pathname === "/admin/contacts") return "Contacts";
    if (location.pathname === "/admin/history") return "History";
    if (location.pathname === "/admin/calendar") return "Calendar";
    if (location.pathname === "/admin/companies") return "Companies";
    if (location.pathname === "/admin/company-dashboard") return "Company Dashboard";
    if (location.pathname === "/admin/applicants") return "Applicants";
    if (location.pathname === "/admin/invoices") return "Invoices";
    return "Dashboard";
  };

  const [selected, setSelected] = useState(getSelected());

  const collapsed=isCollapsed||smallScreen;

  return (
    <Box
      sx={{
        "& .ps-sidebar-container": {
          background: mode === "dark" ? colors.primary[500] : "#ffffff",
        },
        "& .ps-menu-icon": {
          backgroundColor: "transparent !important",
        },
        "& .ps-menu-button": {
          padding: "5px 35px 5px 20px !important",
        },
        "& button.ps-menu-button": {
          width: "100%",
          border: 0,
          background: "transparent",
          font: "inherit",
          textAlign: "inherit",
          cursor: "pointer",
        },
        "& .ps-menu-button:focus-visible": {
          outline: `2px solid ${colors.greenAccent[500]}`,
          outlineOffset: "-2px",
        },
        "& button.ps-menu-button:disabled": {
          cursor: "default",
        },
        "& .ps-menu-button:hover": {
          color: colors.greenAccent[400] + " !important",
        },
        "& .ps-menuitem-root.ps-active": {
          color: colors.greenAccent[500] + " !important",
        },
      }}
    >
      <ProSidebar collapsed={collapsed} width="270px" collapsedWidth="80px" backgroundColor={mode==="dark"?colors.primary[500]:"#ffffff"}>
        <Menu menuItemStyles={{button:{height:44}}}>
          <MenuItem
            component={<button type="button" disabled={smallScreen}/>}
            disabled={smallScreen}
            aria-disabled={smallScreen}
            tabIndex={smallScreen?-1:0}
            aria-label={smallScreen?"القائمة مضغوطة على الهاتف":collapsed?"توسيع القائمة الجانبية":"طي القائمة الجانبية"}
            aria-expanded={!collapsed}
            onClick={() => {if(!smallScreen)setIsCollapsed(!isCollapsed);}}
            icon={<MenuOutlinedIcon />}
            style={{ color: colors.grey[100] }}
          >
            {!collapsed && <Typography variant="h3">ADMINIS</Typography>}
          </MenuItem>

          <Box paddingLeft={collapsed ? undefined : "10%"}>
            {role === 'admin' && <>
            <Item
              title="Dashboard"
              to="/admin/dashboard"
              icon={<HomeOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Item
              title="فريق الإدارة"
              to="/admin/team"
              icon={<PeopleOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Item
              title="إدارة الحسابات"
              to="/admin/contacts"
              icon={<ContactsOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Item
              title="التقويم"
              to="/admin/calendar"
              icon={<CalendarTodayOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Item
              title="Companies"
              to="/admin/companies"
              icon={<BusinessOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Item title="سجل الإدارة" to="/admin/history" icon={<HistoryOutlinedIcon />} selected={selected} setSelected={setSelected} />
            </>}
            <Item
              title="Company Dashboard"
              to="/admin/company-dashboard"
              icon={<BusinessCenterOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Item
              title="Applicants"
              to="/admin/applicants"
              icon={<AssignmentIndOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            {role === 'admin' && <Item
              title="Invoices"
              to="/admin/invoices"
              icon={<ReceiptOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />}

            <Item title="رسائل الشركة" to="/admin/messages" icon={<MailOutlineIcon />} selected={selected} setSelected={setSelected} />

            <MenuItem
              component="button"
              onClick={onLogout}
              icon={<LogoutOutlinedIcon />}
              style={{
                color: colors.redAccent[400],
                marginTop: "20px",
              }}
            >
              <Typography>Logout</Typography>
            </MenuItem>
          </Box>
        </Menu>
      </ProSidebar>
    </Box>
  );
};

export default Sidebar;
