import { type BoundingBox } from '../schema';

export const getFranceBounds = async (): Promise<BoundingBox> => {
  try {
    // France metropolitan bounds including overseas territories approximation
    // These coordinates encompass mainland France plus major overseas territories
    // North: Dunkirk area (northern tip)
    // South: Corsica/Mediterranean coast
    // East: Alsace region (German border)
    // West: Atlantic coast/Brittany
    const franceBounds: BoundingBox = {
      north: 51.1,  // Northern France (near Belgium/North Sea)
      south: 41.3,  // Southern France (Mediterranean/Corsica)
      east: 9.6,    // Eastern France (Rhine valley/Alsace)
      west: -5.1    // Western France (Atlantic coast/Brittany)
    };

    return franceBounds;
  } catch (error) {
    console.error('Failed to get France bounds:', error);
    throw error;
  }
};