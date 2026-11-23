import { ResponsiveChoropleth } from '@nivo/geo';
import { geoFeatures } from '../data/mockGeoFeatures';
export default function GeographyChart({ isDashboard = false }: { isDashboard?: boolean }) {
  return <ResponsiveChoropleth data={[]} domain={[0, 1]} features={geoFeatures.features} projectionScale={isDashboard ? 40 : 150} />;
}
