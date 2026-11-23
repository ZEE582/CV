import { ResponsiveBar } from "@nivo/bar";

import { mockBarData as data } from "../data/mockData";

type Props = {
  isDashboard?: boolean;
};

const BarChart: React.FC<Props> = ({ isDashboard = false }) => {


  return (
    <ResponsiveBar
      data={data}
      keys={["hot dog", "burger", "sandwich", "kebab", "fries", "donut"]}
      indexBy="country"
      margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
      padding={0.3}
      valueScale={{ type: "linear" }}
      indexScale={{ type: "band", round: true }}
      colors={{ scheme: "nivo" }}
      axisBottom={{
        legend: isDashboard ? undefined : "country",
      }}
      axisLeft={{
        legend: isDashboard ? undefined : "food",
      }}
      enableLabel={false}
      role="application"
      barAriaLabel={(e) =>
        `${e.id}: ${e.formattedValue} in country: ${e.indexValue}`
      }
    />
  );
};

export default BarChart;
