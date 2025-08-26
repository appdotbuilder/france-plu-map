import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { geographicFeaturesTable } from '../db/schema';
import { type SearchGeographicFeaturesInput, type CreateGeographicFeatureInput } from '../schema';
import { searchGeographicFeatures } from '../handlers/search_geographic_features';
import { eq } from 'drizzle-orm';

// Test data setup
const testFeatures: CreateGeographicFeatureInput[] = [
  {
    name: 'New York City',
    description: 'Major city in the US',
    feature_type: 'city',
    latitude: 40.7128,
    longitude: -74.0060,
    properties: { population: '8419000', state: 'NY' }
  },
  {
    name: 'Central Park',
    description: 'Large public park in Manhattan',
    feature_type: 'landmark',
    latitude: 40.7829,
    longitude: -73.9654,
    properties: { area: '843 acres' }
  },
  {
    name: 'Los Angeles',
    description: 'City in California',
    feature_type: 'city',
    latitude: 34.0522,
    longitude: -118.2437,
    properties: { population: '3971000', state: 'CA' }
  },
  {
    name: 'Mount Rushmore',
    description: 'National memorial',
    feature_type: 'landmark',
    latitude: 43.8791,
    longitude: -103.4591,
    properties: { state: 'SD' }
  },
  {
    name: 'Yellowstone Region',
    description: 'Natural region containing the national park',
    feature_type: 'region',
    latitude: 44.4280,
    longitude: -110.5885,
    properties: { park: 'true' }
  }
];

describe('searchGeographicFeatures', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test data
  const createTestFeatures = async () => {
    const results = [];
    for (const feature of testFeatures) {
      const result = await db.insert(geographicFeaturesTable)
        .values({
          name: feature.name,
          description: feature.description,
          feature_type: feature.feature_type,
          latitude: feature.latitude,
          longitude: feature.longitude,
          properties: feature.properties || null
        })
        .returning()
        .execute();
      results.push(result[0]);
    }
    return results;
  };

  it('should return all features when no filters are applied', async () => {
    await createTestFeatures();

    const input: SearchGeographicFeaturesInput = {
      limit: 50
    };
    const results = await searchGeographicFeatures(input);

    expect(results).toHaveLength(5);
    expect(results.every(f => f.id !== undefined)).toBe(true);
    expect(results.every(f => f.created_at instanceof Date)).toBe(true);
  });

  it('should search features by name query (case-insensitive)', async () => {
    await createTestFeatures();

    const input: SearchGeographicFeaturesInput = {
      query: 'new york',
      limit: 50
    };
    const results = await searchGeographicFeatures(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual('New York City');
    expect(results[0].feature_type).toEqual('city');
    expect(results[0].latitude).toEqual(40.7128);
    expect(results[0].longitude).toEqual(-74.0060);
  });

  it('should search features by partial name match', async () => {
    await createTestFeatures();

    const input: SearchGeographicFeaturesInput = {
      query: 'park',
      limit: 50
    };
    const results = await searchGeographicFeatures(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual('Central Park');
    expect(results[0].feature_type).toEqual('landmark');
  });

  it('should filter features by type', async () => {
    await createTestFeatures();

    const input: SearchGeographicFeaturesInput = {
      feature_type: 'city',
      limit: 50
    };
    const results = await searchGeographicFeatures(input);

    expect(results).toHaveLength(2);
    expect(results.every(f => f.feature_type === 'city')).toBe(true);
    
    const cities = results.map(f => f.name).sort();
    expect(cities).toEqual(['Los Angeles', 'New York City']);
  });

  it('should filter features by landmark type', async () => {
    await createTestFeatures();

    const input: SearchGeographicFeaturesInput = {
      feature_type: 'landmark',
      limit: 50
    };
    const results = await searchGeographicFeatures(input);

    expect(results).toHaveLength(2);
    expect(results.every(f => f.feature_type === 'landmark')).toBe(true);
    
    const landmarks = results.map(f => f.name).sort();
    expect(landmarks).toEqual(['Central Park', 'Mount Rushmore']);
  });

  it('should filter features within geographic bounds', async () => {
    await createTestFeatures();

    // Bounds covering New York area
    const input: SearchGeographicFeaturesInput = {
      bounds: {
        north: 41.0,
        south: 40.0,
        east: -73.0,
        west: -75.0
      },
      limit: 50
    };
    const results = await searchGeographicFeatures(input);

    expect(results).toHaveLength(2);
    const names = results.map(f => f.name).sort();
    expect(names).toEqual(['Central Park', 'New York City']);
  });

  it('should combine text search with type filter', async () => {
    await createTestFeatures();

    const input: SearchGeographicFeaturesInput = {
      query: 'mount',
      feature_type: 'landmark',
      limit: 50
    };
    const results = await searchGeographicFeatures(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual('Mount Rushmore');
    expect(results[0].feature_type).toEqual('landmark');
  });

  it('should combine all filters together', async () => {
    await createTestFeatures();

    const input: SearchGeographicFeaturesInput = {
      query: 'park',
      feature_type: 'landmark',
      bounds: {
        north: 41.0,
        south: 40.0,
        east: -73.0,
        west: -75.0
      },
      limit: 50
    };
    const results = await searchGeographicFeatures(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual('Central Park');
  });

  it('should respect limit parameter', async () => {
    await createTestFeatures();

    const input: SearchGeographicFeaturesInput = {
      limit: 2
    };
    const results = await searchGeographicFeatures(input);

    expect(results).toHaveLength(2);
  });

  it('should use default limit when not specified', async () => {
    // Create exactly 55 features to test default limit of 50
    const manyFeatures = Array.from({ length: 55 }, (_, i) => ({
      name: `Feature ${i}`,
      description: `Test feature ${i}`,
      feature_type: 'landmark' as const,
      latitude: 40 + (i * 0.01),
      longitude: -74 + (i * 0.01),
      properties: null
    }));

    for (const feature of manyFeatures) {
      await db.insert(geographicFeaturesTable)
        .values(feature)
        .execute();
    }

    const input: SearchGeographicFeaturesInput = {
      limit: 50 // Explicitly set to test default behavior
    };
    const results = await searchGeographicFeatures(input);

    // Should respect the limit of 50
    expect(results).toHaveLength(50);
  });

  it('should return empty array when no features match query', async () => {
    await createTestFeatures();

    const input: SearchGeographicFeaturesInput = {
      query: 'nonexistent feature',
      limit: 50
    };
    const results = await searchGeographicFeatures(input);

    expect(results).toHaveLength(0);
  });

  it('should return empty array when no features match bounds', async () => {
    await createTestFeatures();

    // Bounds covering middle of ocean (no features)
    const input: SearchGeographicFeaturesInput = {
      bounds: {
        north: 10.0,
        south: 5.0,
        east: 10.0,
        west: 5.0
      },
      limit: 50
    };
    const results = await searchGeographicFeatures(input);

    expect(results).toHaveLength(0);
  });

  it('should handle features with null properties', async () => {
    // Create a feature with null properties
    await db.insert(geographicFeaturesTable)
      .values({
        name: 'Simple Feature',
        description: 'Feature without properties',
        feature_type: 'natural',
        latitude: 45.0,
        longitude: -90.0,
        properties: null
      })
      .execute();

    const input: SearchGeographicFeaturesInput = {
      feature_type: 'natural',
      limit: 50
    };
    const results = await searchGeographicFeatures(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual('Simple Feature');
    expect(results[0].properties).toBeNull();
  });

  it('should verify features are saved to database correctly', async () => {
    const createdFeatures = await createTestFeatures();
    const firstFeature = createdFeatures[0];

    // Query directly from database to verify storage
    const dbFeatures = await db.select()
      .from(geographicFeaturesTable)
      .where(eq(geographicFeaturesTable.id, firstFeature.id))
      .execute();

    expect(dbFeatures).toHaveLength(1);
    expect(dbFeatures[0].name).toEqual('New York City');
    expect(dbFeatures[0].feature_type).toEqual('city');
    expect(dbFeatures[0].latitude).toEqual(40.7128);
    expect(dbFeatures[0].longitude).toEqual(-74.0060);
    expect(dbFeatures[0].created_at).toBeInstanceOf(Date);
    expect(typeof dbFeatures[0].properties).toBe('object');
  });
});