import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { geographicFeaturesTable } from '../db/schema';
import { type GetFeaturesInBoundsInput, type CreateGeographicFeatureInput } from '../schema';
import { getFeaturesInBounds } from '../handlers/get_features_in_bounds';

// Helper function to create test features
const createTestFeature = async (feature: CreateGeographicFeatureInput) => {
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
  
  return result[0];
};

describe('getFeaturesInBounds', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return features within specified bounds', async () => {
    // Create test features - some inside bounds, some outside
    await createTestFeature({
      name: 'Feature Inside',
      description: 'A feature within bounds',
      feature_type: 'city',
      latitude: 40.7128, // NYC latitude
      longitude: -74.0060 // NYC longitude
    });

    await createTestFeature({
      name: 'Feature Outside',
      description: 'A feature outside bounds',
      feature_type: 'city',
      latitude: 51.5074, // London latitude
      longitude: -0.1278 // London longitude
    });

    // Define bounding box around NYC area
    const input: GetFeaturesInBoundsInput = {
      bounds: {
        north: 41.0,
        south: 40.0,
        east: -73.0,
        west: -75.0
      },
      limit: 100
    };

    const result = await getFeaturesInBounds(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Feature Inside');
    expect(result[0].feature_type).toEqual('city');
    expect(result[0].latitude).toBeCloseTo(40.7128, 4);
    expect(result[0].longitude).toBeCloseTo(-74.0060, 4);
  });

  it('should filter by feature types when specified', async () => {
    // Create features of different types within bounds
    await createTestFeature({
      name: 'City Feature',
      description: 'A city',
      feature_type: 'city',
      latitude: 40.7128,
      longitude: -74.0060
    });

    await createTestFeature({
      name: 'Landmark Feature',
      description: 'A landmark',
      feature_type: 'landmark',
      latitude: 40.7589,
      longitude: -73.9851
    });

    await createTestFeature({
      name: 'Natural Feature',
      description: 'A natural feature',
      feature_type: 'natural',
      latitude: 40.6892,
      longitude: -74.0445
    });

    const input: GetFeaturesInBoundsInput = {
      bounds: {
        north: 41.0,
        south: 40.0,
        east: -73.0,
        west: -75.0
      },
      feature_types: ['city', 'landmark'],
      limit: 100
    };

    const result = await getFeaturesInBounds(input);

    expect(result).toHaveLength(2);
    expect(result.some(f => f.feature_type === 'city')).toBe(true);
    expect(result.some(f => f.feature_type === 'landmark')).toBe(true);
    expect(result.some(f => f.feature_type === 'natural')).toBe(false);
  });

  it('should respect the limit parameter', async () => {
    // Create multiple features within bounds
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(createTestFeature({
        name: `Feature ${i}`,
        description: `Test feature ${i}`,
        feature_type: 'city',
        latitude: 40.7 + (i * 0.01), // Slight variations within bounds
        longitude: -74.0 + (i * 0.01)
      }));
    }
    await Promise.all(promises);

    const input: GetFeaturesInBoundsInput = {
      bounds: {
        north: 41.0,
        south: 40.0,
        east: -73.0,
        west: -75.0
      },
      limit: 3
    };

    const result = await getFeaturesInBounds(input);

    expect(result).toHaveLength(3);
  });

  it('should return empty array when no features are within bounds', async () => {
    // Create a feature outside the search bounds
    await createTestFeature({
      name: 'Far Away Feature',
      description: 'A feature far from bounds',
      feature_type: 'city',
      latitude: 51.5074, // London
      longitude: -0.1278
    });

    const input: GetFeaturesInBoundsInput = {
      bounds: {
        north: 41.0,
        south: 40.0,
        east: -73.0,
        west: -75.0
      },
      limit: 100
    };

    const result = await getFeaturesInBounds(input);

    expect(result).toHaveLength(0);
  });

  it('should handle edge case features exactly on boundaries', async () => {
    // Create features exactly on the boundary coordinates
    await createTestFeature({
      name: 'North Boundary',
      description: 'Feature on north boundary',
      feature_type: 'landmark',
      latitude: 41.0, // Exactly on north boundary
      longitude: -74.0
    });

    await createTestFeature({
      name: 'South Boundary',
      description: 'Feature on south boundary',
      feature_type: 'landmark',
      latitude: 40.0, // Exactly on south boundary
      longitude: -74.0
    });

    await createTestFeature({
      name: 'East Boundary',
      description: 'Feature on east boundary',
      feature_type: 'landmark',
      latitude: 40.5,
      longitude: -73.0 // Exactly on east boundary
    });

    await createTestFeature({
      name: 'West Boundary',
      description: 'Feature on west boundary',
      feature_type: 'landmark',
      latitude: 40.5,
      longitude: -75.0 // Exactly on west boundary
    });

    const input: GetFeaturesInBoundsInput = {
      bounds: {
        north: 41.0,
        south: 40.0,
        east: -73.0,
        west: -75.0
      },
      limit: 100
    };

    const result = await getFeaturesInBounds(input);

    expect(result).toHaveLength(4);
    expect(result.map(f => f.name)).toContain('North Boundary');
    expect(result.map(f => f.name)).toContain('South Boundary');
    expect(result.map(f => f.name)).toContain('East Boundary');
    expect(result.map(f => f.name)).toContain('West Boundary');
  });

  it('should handle features with properties correctly', async () => {
    await createTestFeature({
      name: 'Feature with Properties',
      description: 'A feature with additional properties',
      feature_type: 'city',
      latitude: 40.7128,
      longitude: -74.0060,
      properties: {
        population: '8000000',
        country: 'USA',
        timezone: 'EST'
      }
    });

    const input: GetFeaturesInBoundsInput = {
      bounds: {
        north: 41.0,
        south: 40.0,
        east: -73.0,
        west: -75.0
      },
      limit: 100
    };

    const result = await getFeaturesInBounds(input);

    expect(result).toHaveLength(1);
    expect(result[0].properties).toBeDefined();
    expect(result[0].properties).toEqual({
      population: '8000000',
      country: 'USA',
      timezone: 'EST'
    });
  });

  it('should handle normal longitude bounds correctly', async () => {
    // Test normal case where west < east (no date line crossing)
    await createTestFeature({
      name: 'Within Normal Bounds',
      description: 'Feature within normal longitude bounds',
      feature_type: 'city',
      latitude: 40.7128,
      longitude: -74.0060 // NYC
    });

    await createTestFeature({
      name: 'Outside Normal Bounds',
      description: 'Feature outside normal longitude bounds',
      feature_type: 'city',
      latitude: 40.7128,
      longitude: -70.0 // Too far east
    });

    const input: GetFeaturesInBoundsInput = {
      bounds: {
        north: 41.0,
        south: 40.0,
        east: -73.0,  // Normal case: west < east
        west: -75.0
      },
      limit: 100
    };

    const result = await getFeaturesInBounds(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Within Normal Bounds');
  });

  it('should handle cross-meridian bounds correctly', async () => {
    // Create features around the International Date Line
    await createTestFeature({
      name: 'Western Pacific',
      description: 'Feature in western Pacific',
      feature_type: 'city',
      latitude: 60.0,
      longitude: 175.0 // Western side of date line
    });

    await createTestFeature({
      name: 'Eastern Pacific', 
      description: 'Feature in eastern Pacific',
      feature_type: 'city',
      latitude: 60.0,
      longitude: -175.0 // Eastern side of date line
    });

    await createTestFeature({
      name: 'Outside Range',
      description: 'Feature outside cross-meridian range',
      feature_type: 'city',
      latitude: 60.0,
      longitude: 0.0 // Should be excluded
    });

    // Bounding box that crosses the date line (west > east)
    const input: GetFeaturesInBoundsInput = {
      bounds: {
        north: 65.0,
        south: 55.0,
        east: -170.0, // Eastern boundary
        west: 170.0   // Western boundary - crosses date line since west > east
      },
      limit: 100
    };

    const result = await getFeaturesInBounds(input);

    // Both features near the date line should be included, but not the one at 0°
    expect(result).toHaveLength(2);
    expect(result.map(f => f.name)).toContain('Western Pacific');
    expect(result.map(f => f.name)).toContain('Eastern Pacific');
    expect(result.map(f => f.name)).not.toContain('Outside Range');
  });
});