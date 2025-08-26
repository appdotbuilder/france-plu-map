import { db } from '../db';
import { geographicFeaturesTable } from '../db/schema';
import { type SearchGeographicFeaturesInput, type GeographicFeature } from '../schema';
import { eq, and, ilike, gte, lte, type SQL } from 'drizzle-orm';

export const searchGeographicFeatures = async (input: SearchGeographicFeaturesInput): Promise<GeographicFeature[]> => {
  try {
    const conditions: SQL<unknown>[] = [];

    // Text search in name (case-insensitive)
    if (input.query) {
      conditions.push(ilike(geographicFeaturesTable.name, `%${input.query}%`));
    }

    // Filter by feature type
    if (input.feature_type) {
      conditions.push(eq(geographicFeaturesTable.feature_type, input.feature_type));
    }

    // Filter by geographic bounds
    if (input.bounds) {
      conditions.push(
        gte(geographicFeaturesTable.latitude, input.bounds.south),
        lte(geographicFeaturesTable.latitude, input.bounds.north),
        gte(geographicFeaturesTable.longitude, input.bounds.west),
        lte(geographicFeaturesTable.longitude, input.bounds.east)
      );
    }

    // Build the complete query in one chain
    const query = conditions.length > 0
      ? db.select()
          .from(geographicFeaturesTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .limit(input.limit)
      : db.select()
          .from(geographicFeaturesTable)
          .limit(input.limit);

    const results = await query.execute();

    // Convert results to match schema type with proper properties handling
    return results.map(result => ({
      ...result,
      properties: result.properties as Record<string, string> | null
    }));
  } catch (error) {
    console.error('Geographic feature search failed:', error);
    throw error;
  }
};