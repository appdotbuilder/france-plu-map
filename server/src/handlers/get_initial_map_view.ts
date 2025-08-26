import { type MapView } from '../schema';

export const getInitialMapView = async (): Promise<MapView> => {
  try {
    // Return initial map view configuration centered on France
    // with appropriate zoom level to show the entire country
    // France center coordinates: approximately 46.2276°N, 2.2137°E
    return {
      center: {
        latitude: 46.2276,
        longitude: 2.2137
      },
      zoom_level: 6, // Appropriate zoom to show entire France
      bounds: {
        north: 51.1,   // Northern border (near Belgium/Netherlands)
        south: 41.3,   // Southern border (Mediterranean/Pyrenees)
        east: 9.6,     // Eastern border (near Germany/Switzerland)
        west: -5.1     // Western border (Atlantic Ocean)
      }
    };
  } catch (error) {
    console.error('Failed to get initial map view:', error);
    throw error;
  }
};