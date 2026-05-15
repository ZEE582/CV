import { JSX, useState } from "react";
import { ProSidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Box, Typography, useTheme } from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import { tokens } from "../../../theme";

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

interface ItemProps {
  title: string;
  to: string;
  icon: JSX.Element;
  selected: string;
  setSelected: (value: string) => void;
}

const Item = ({ title, to, icon, selected, setSelected }: ItemProps) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <MenuItem
      active={selected === title}
      onClick={() => setSelected(title)}
      icon={icon}
      style={{
        color: selected === title ? colors.greenAccent[500] : colors.grey[100],
      }}
    >
      <Link to={to} style={{ textDecoration: "none", color: "inherit" }}>
        <Typography>{title}</Typography>
      </Link>
    </MenuItem>
  );
};

const Sidebar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const mode = theme.palette.mode;
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(false);

  const getSelected = () => {
    if (location.pathname === "/dashboard") return "Dashboard";
    if (location.pathname === "/team") return "Team";
    if (location.pathname === "/contacts") return "Contacts";
    if (location.pathname === "/calendar") return "Calendar";
    if (location.pathname === "/companies") return "Companies";
    if (location.pathname === "/company-dashboard") return "Company Dashboard";
    if (location.pathname === "/applicants") return "Applicants";
    if (location.pathname === "/invoices") return "Invoices";
    return "Dashboard";
  };

  const [selected, setSelected] = useState(getSelected());

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <Box
      sx={{
        "& .pro-sidebar-inner": {
          background: mode === "dark" ? colors.primary[500] : "#ffffff",
        },
        "& .pro-icon-wrapper": {
          backgroundColor: "transparent !important",
        },
        "& .pro-inner-item": {
          padding: "5px 35px 5px 20px !important",
        },
        "& .pro-inner-item:hover": {
          color: colors.greenAccent[400] + " !important",
        },
        "& .pro-menu-item.active": {
          color: colors.greenAccent[500] + " !important",
        },
      }}
    >
      <ProSidebar collapsed={isCollapsed}>
        <Menu iconShape="square">
          <MenuItem
            onClick={() => setIsCollapsed(!isCollapsed)}
            icon={<MenuOutlinedIcon />}
            style={{ color: colors.grey[100] }}
          >
            {!isCollapsed && <Typography variant="h3">ADMINIS</Typography>}
          </MenuItem>

          <Box paddingLeft={isCollapsed ? undefined : "10%"}>
            <Item
              title="Dashboard"
              to="/dashboard"
              icon={<HomeOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Item
              title="Team"
              to="/team"
              icon={<PeopleOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Item
              title="Contacts"
              to="/contacts"
              icon={<ContactsOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Item
              title="Calendar"
              to="/calendar"
              icon={<CalendarTodayOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Item
              title="Companies"
              to="/companies"
              icon={<BusinessOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Item
              title="Company Dashboard"
              to="/company-dashboard"
              icon={<BusinessCenterOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Item
              title="Applicants"
              to="/applicants"
              icon={<AssignmentIndOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Item
              title="Invoices"
              to="/invoices"
              icon={<ReceiptOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <MenuItem
              onClick={handleLogout}
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