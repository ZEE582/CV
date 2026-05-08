import { Box, Button, IconButton, Typography, useTheme } from "@mui/material";
import { tokens } from "../../theme";
import { mockTransactions } from "../../data/src/data/mockData";
import Header from "../../components/header";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import EmailIcon from "@mui/icons-material/Email";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import TrafficIcon from "@mui/icons-material/Traffic";

interface StatBoxProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  progress: string;
  increase: string;
}

const StatBox: React.FC<StatBoxProps> = ({ title, subtitle, icon, progress, increase }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode as "dark" | "light");

  return (
    <Box width="100%" m="0 30px">
      <Box display="flex" justifyContent="space-between">
        <Box>
          {icon}
          <Typography variant="h4" fontWeight="bold" sx={{ color: colors.grey[100] }}>
            {title}
          </Typography>
        </Box>
        <Box>
          <Typography variant="h5" fontStyle="italic" sx={{ color: colors.greenAccent[600] }}>
            {increase}
          </Typography>
        </Box>
      </Box>
      <Box display="flex" justifyContent="space-between" mt="2px">
        <Typography variant="h5" sx={{ color: colors.greenAccent[500] }}>
          {subtitle}
        </Typography>
        <Typography variant="h5" fontStyle="italic" sx={{ color: colors.greenAccent[600] }}>
          {progress}
        </Typography>
      </Box>
    </Box>
  );
};

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode as "dark" | "light");

  return (
    <Box m="20px">
      {/* HEADER */}
      

      {/* GRID */}
      <Box
        display="grid"
        gridTemplateColumns="repeat(12, 1fr)"
        gridAutoRows="140px"
        gap="20px"
      >
        {/* ROW 1 - STAT BOXES */}
        <Box
          gridColumn="span 3"
          bgcolor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius="8px"
        >
          <StatBox
            title="12,361"
            subtitle="Emails Sent"
            progress="75%"
            increase="+14%"
            icon={
              <EmailIcon
                sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
              />
            }
          />
        </Box>

        

        <Box
          gridColumn="span 3"
          bgcolor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius="8px"
        >
          <StatBox
            title="32,441"
            subtitle="New Clients"
            progress="80%"
            increase="+5%"
            icon={
              <PersonAddIcon
                sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
              />
            }
          />
        </Box>

       

     
        {/* ROW 2 - TRAFFIC */}
        <Box
          gridColumn="span 4"
          gridRow="span 2"
          bgcolor={colors.primary[400]}
          borderRadius="8px"
        >
          <Typography
            variant="h5"
            fontWeight="600"
            sx={{ padding: "30px 30px 0 30px" }}
          >
            Traffic Source
          </Typography>
          <Box
            display="flex"
            flexDirection="column"
            gap="10px"
            p="20px 30px"
          >
            {[
              { label: "Direct", value: "40%", color: colors.blueAccent[500] },
              { label: "Social", value: "25%", color: colors.greenAccent[500] },
              { label: "Email", value: "20%", color: colors.redAccent[500] },
              { label: "Other", value: "15%", color: colors.blueAccent[300] },
            ].map((item) => (
              <Box key={item.label}>
                <Box display="flex" justifyContent="space-between" mb="4px">
                  <Typography color={colors.grey[100]}>{item.label}</Typography>
                  <Typography color={colors.grey[100]}>{item.value}</Typography>
                </Box>
                <Box
                  height="8px"
                  borderRadius="4px"
                  bgcolor={colors.primary[300]}
                >
                  <Box
                    height="8px"
                    borderRadius="4px"
                    width={item.value}
                    bgcolor={item.color}
                  />
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;