import { db } from '../db';
import { geographicFeaturesTable } from '../db/schema';
import { type GetFeaturesInBoundsInput, type GeographicFeature } from '../schema';
import { and, gte, lte, inArray, or, type SQL } from 'drizzle-orm';

export const getFeaturesInBounds = async (input: GetFeaturesInBoundsInput): Promise<GeographicFeature[]> => {
  try {
    // Start building the query
    let query = db.select().from(geographicFeaturesTable);

    // Build conditions array for bounding box filtering
    const conditions: SQL<unknown>[] = [
      gte(geographicFeaturesTable.latitude, input.bounds.south),
      lte(geographicFeaturesTable.latitude, input.bounds.north)
    ];

    // Handle longitude bounds - check if we're crossing the International Date Line
    if (input.bounds.west <= input.bounds.east) {
      // Normal case: bounds don't cross the date line
      conditions.push(
        gte(geographicFeaturesTable.longitude, input.bounds.west),
        lte(geographicFeaturesTable.longitude, input.bounds.east)
      );
    } else {
      // Cross-meridian case: west > east, so we need features that are either:
      // >= west OR <= east (wrapping around the date line)
      const crossMeridianCondition = or(
        gte(geographicFeaturesTable.longitude, input.bounds.west),
        lte(geographicFeaturesTable.longitude, input.bounds.east)
      );
      if (crossMeridianCondition) {
        conditions.push(crossMeridianCondition);
      }
    }

    // Add feature type filtering if specified
    if (input.feature_types && input.feature_types.length > 0) {
      conditions.push(inArray(geographicFeaturesTable.feature_type, input.feature_types));
    }

    // Apply all conditions
    const finalQuery = query.where(and(...conditions)).limit(input.limit);

    // Execute the query
    const results = await finalQuery.execute();

    // Return results with proper type mapping
    return results.map(result => ({
      ...result,
      properties: result.properties as Record<string, string> | null
    }));
  } catch (error) {
    console.error('Failed to get features in bounds:', error);
    throw error;
  }
};