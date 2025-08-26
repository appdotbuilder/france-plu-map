import { db } from '../db';
import { geographicFeaturesTable } from '../db/schema';
import { type GeographicFeature } from '../schema';
import { desc } from 'drizzle-orm';

export const getGeographicFeatures = async (): Promise<GeographicFeature[]> => {
  try {
    // Fetch all geographic features from the database
    const results = await db.select()
      .from(geographicFeaturesTable)
      .orderBy(desc(geographicFeaturesTable.created_at))
      .execute();

    // Convert real (float) coordinates back to numbers and ensure properties type is correct
    return results.map(feature => ({
      ...feature,
      latitude: Number(feature.latitude),
      longitude: Number(feature.longitude),
      properties: feature.properties as Record<string, string> | null
    }));
  } catch (error) {
    console.error('Failed to fetch geographic features:', error);
    throw error;
  }
};