import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { geographicFeaturesTable } from '../db/schema';
import { getGeographicFeatures } from '../handlers/get_geographic_features';

// Test data for French geographic features
const parisData = {
  name: 'Paris',
  description: 'Capital of France',
  feature_type: 'city' as const,
  latitude: 48.8566,
  longitude: 2.3522,
  properties: { population: '2,161,000', country: 'France' }
};

const lyonData = {
  name: 'Lyon',
  description: 'Second largest city in France',
  feature_type: 'city' as const,
  latitude: 45.7640,
  longitude: 4.8357,
  properties: { population: '515,695', country: 'France' }
};

const eiffelTowerData = {
  name: 'Eiffel Tower',
  description: 'Famous landmark in Paris',
  feature_type: 'landmark' as const,
  latitude: 48.8584,
  longitude: 2.2945,
  properties: { height: '330m', built: '1889' }
};

const alpesData = {
  name: 'French Alps',
  description: 'Mountain range in southeastern France',
  feature_type: 'natural' as const,
  latitude: 45.8326,
  longitude: 6.8652,
  properties: { highest_peak: 'Mont Blanc', elevation: '4809m' }
};

describe('getGeographicFeatures', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no features exist', async () => {
    const result = await getGeographicFeatures();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all geographic features', async () => {
    // Create test features
    await db.insert(geographicFeaturesTable)
      .values([parisData, lyonData])
      .execute();

    const result = await getGeographicFeatures();

    expect(result).toHaveLength(2);
    
    // Since both features are inserted in a single batch, order may vary
    // Check that both cities are present
    const cityNames = result.map(f => f.name);
    expect(cityNames).toContain('Paris');
    expect(cityNames).toContain('Lyon');
    
    // Find Lyon to verify coordinates are numbers
    const lyonFeature = result.find(f => f.name === 'Lyon');
    expect(lyonFeature).toBeDefined();
    expect(typeof lyonFeature!.latitude).toBe('number');
    expect(typeof lyonFeature!.longitude).toBe('number');
    expect(lyonFeature!.latitude).toEqual(45.7640);
    expect(lyonFeature!.longitude).toEqual(4.8357);
  });

  it('should return features ordered by created_at descending', async () => {
    // Insert features with slight delay to ensure different timestamps
    await db.insert(geographicFeaturesTable)
      .values(parisData)
      .execute();
    
    // Small delay to ensure different created_at timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    await db.insert(geographicFeaturesTable)
      .values(lyonData)
      .execute();

    const result = await getGeographicFeatures();

    expect(result).toHaveLength(2);
    // Lyon was inserted second, so should be first in desc order
    expect(result[0].name).toEqual('Lyon');
    expect(result[1].name).toEqual('Paris');
    
    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should handle different feature types correctly', async () => {
    // Create features of different types
    await db.insert(geographicFeaturesTable)
      .values([parisData, eiffelTowerData, alpesData])
      .execute();

    const result = await getGeographicFeatures();

    expect(result).toHaveLength(3);
    
    // Check feature types are preserved
    const featureTypes = result.map(f => f.feature_type);
    expect(featureTypes).toContain('city');
    expect(featureTypes).toContain('landmark');
    expect(featureTypes).toContain('natural');
  });

  it('should preserve properties and nullable fields correctly', async () => {
    // Feature with properties
    const featureWithProps = { ...parisData };
    
    // Feature without properties or description
    const minimalFeature = {
      name: 'Unknown Location',
      description: null,
      feature_type: 'administrative' as const,
      latitude: 46.2276,
      longitude: 2.2137,
      properties: null
    };

    await db.insert(geographicFeaturesTable)
      .values([featureWithProps, minimalFeature])
      .execute();

    const result = await getGeographicFeatures();

    expect(result).toHaveLength(2);
    
    // Find features in result
    const parisFeature = result.find(f => f.name === 'Paris');
    const minimalFound = result.find(f => f.name === 'Unknown Location');

    // Verify properties are preserved
    expect(parisFeature?.properties).toEqual({ population: '2,161,000', country: 'France' });
    expect(parisFeature?.description).toEqual('Capital of France');
    
    // Verify null values are handled
    expect(minimalFound?.properties).toBeNull();
    expect(minimalFound?.description).toBeNull();
  });

  it('should handle coordinates with high precision', async () => {
    const preciseLocation = {
      name: 'Precise Location',
      description: 'Location with high precision coordinates',
      feature_type: 'landmark' as const,
      latitude: 48.858370123456,
      longitude: 2.294481987654,
      properties: null
    };

    await db.insert(geographicFeaturesTable)
      .values(preciseLocation)
      .execute();

    const result = await getGeographicFeatures();

    expect(result).toHaveLength(1);
    expect(typeof result[0].latitude).toBe('number');
    expect(typeof result[0].longitude).toBe('number');
    
    // Coordinates should maintain reasonable precision (real type limitation)
    expect(Math.abs(result[0].latitude - 48.858370123456)).toBeLessThan(0.0001);
    expect(Math.abs(result[0].longitude - 2.294481987654)).toBeLessThan(0.0001);
  });

  it('should include all required fields in response', async () => {
    await db.insert(geographicFeaturesTable)
      .values(parisData)
      .execute();

    const result = await getGeographicFeatures();

    expect(result).toHaveLength(1);
    const feature = result[0];

    // Verify all schema fields are present
    expect(feature.id).toBeDefined();
    expect(typeof feature.id).toBe('number');
    expect(feature.name).toBeDefined();
    expect(feature.description).toBeDefined();
    expect(feature.feature_type).toBeDefined();
    expect(feature.latitude).toBeDefined();
    expect(feature.longitude).toBeDefined();
    expect(feature.created_at).toBeInstanceOf(Date);
    
    // Properties can be null but should be defined
    expect('properties' in feature).toBe(true);
  });
});