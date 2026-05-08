import { ResponsiveLine } from "@nivo/line";
import { useTheme } from "@mui/material";
import { tokens } from "../theme";
import { mockLineData } from "../data/src/data/mockData";

type Props = {
  isDashboard?: boolean;
};

const LineChart: React.FC<Props> = ({ isDashboard = false }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <ResponsiveLine
      data={mockLineData}
      margin={{ top: 50, right: 110, bottom: 50, left: 60 }}

      animate={true}
      motionConfig="wobbly"

      xScale={{ type: "point" }}
      yScale={{ type: "linear" }}
      axisBottom={{
        legend: isDashboard ? undefined : "month",
      }}
      axisLeft={{
        legend: isDashboard ? undefined : "value",
      }}
    />
  );
};

export default LineChart;