import { ResponsiveChoropleth } from "@nivo/geo";
import { geoFeatures } from "../data/mockGeoFeature";
import { mockGeographyData } from "../data/mockData";

type Props = {
  isDashboard?: boolean;
};

const GeographyChart: React.FC<Props> = ({ isDashboard = false }) => {
  return (
    <ResponsiveChoropleth
      data={mockGeographyData}
      features={geoFeatures.features}
      projectionScale={isDashboard ? 40 : 150}
    />
  );
};

export default GeographyChart;