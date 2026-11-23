export const geoFeatures = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Palestine" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [34.9, 31.6],
            [35.6, 31.6],
            [35.6, 32.5],
            [34.9, 32.5],
            [34.9, 31.6]
          ]
        ]
      }
    },
    {
      type: "Feature",
      properties: { name: "USA" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-100, 30],
            [-90, 30],
            [-90, 40],
            [-100, 40],
            [-100, 30]
          ]
        ]
      }
    },
    {
      type: "Feature",
      properties: { name: "France" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [2, 44],
            [3, 44],
            [3, 45],
            [2, 45],
            [2, 44]
          ]
        ]
      }
    }
  ]
};