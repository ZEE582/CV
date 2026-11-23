import { Box, Button, IconButton, useTheme } from "@mui/material";
import { Link } from 'react-router-dom';
import { useContext } from "react";
import { ColorModeContext } from "../../../theme";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";

type Props = {
  setIsSidebar?: React.Dispatch<React.SetStateAction<boolean>>;
};

const Topbar: React.FC<Props> = () => {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);

  return (
    <Box display="flex" justifyContent="space-between" p={2}>
      <Box display="flex" flexWrap="wrap">
        <Button component={Link} to="/home">الرئيسية</Button>
        <Button component={Link} to="/pages">كل الواجهات</Button>
      </Box>

      <Box display="flex">
        <IconButton onClick={colorMode.toggleColorMode} aria-label="تبديل الوضع الفاتح والداكن">
          {theme.palette.mode === "dark" ? (
            <DarkModeOutlinedIcon />
          ) : (
            <LightModeOutlinedIcon />
          )}
        </IconButton>
      </Box>
    </Box>
  );
};

export default Topbar;
