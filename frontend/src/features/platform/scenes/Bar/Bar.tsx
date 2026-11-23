import { Box } from "@mui/material";
import Header from "../../components/header";
import BarChart from "../../components/BarChart";

const Bar: React.FC = () => {
  return (
    <Box m="20px">
      <Header title="Bar Chart" subtitle="Simple Chart" />
      <Box height="75vh">
        <BarChart />
      </Box>
    </Box>
  );
};

export default Bar;