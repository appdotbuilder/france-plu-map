import { db } from '../db';
import { geographicFeaturesTable } from '../db/schema';
import { type CreateGeographicFeatureInput, type GeographicFeature } from '../schema';

export const createGeographicFeature = async (input: CreateGeographicFeatureInput): Promise<GeographicFeature> => {
  try {
    // Insert geographic feature record
    const result = await db.insert(geographicFeaturesTable)
      .values({
        name: input.name,
        description: input.description || null,
        feature_type: input.feature_type,
        latitude: input.latitude, // real type - no conversion needed
        longitude: input.longitude, // real type - no conversion needed
        properties: input.properties as any || null
      })
      .returning()
      .execute();

    // Convert the database result to match the expected schema type
    const feature = result[0];
    return {
      ...feature,
      properties: feature.properties as Record<string, string> | null
    };
  } catch (error) {
    console.error('Geographic feature creation failed:', error);
    throw error;
  }
};