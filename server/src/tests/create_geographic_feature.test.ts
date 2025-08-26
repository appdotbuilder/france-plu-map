import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { geographicFeaturesTable } from '../db/schema';
import { type CreateGeographicFeatureInput } from '../schema';
import { createGeographicFeature } from '../handlers/create_geographic_feature';
import { eq, and, gte, lte } from 'drizzle-orm';

// Test input for a city
const testCityInput: CreateGeographicFeatureInput = {
  name: 'San Francisco',
  description: 'Major city in California',
  feature_type: 'city',
  latitude: 37.7749,
  longitude: -122.4194,
  properties: {
    population: '883305',
    state: 'California',
    country: 'USA'
  }
};

// Test input for a landmark
const testLandmarkInput: CreateGeographicFeatureInput = {
  name: 'Golden Gate Bridge',
  description: 'Iconic suspension bridge',
  feature_type: 'landmark',
  latitude: 37.8199,
  longitude: -122.4783,
  properties: {
    opened: '1937',
    length: '2737m'
  }
};

// Test input with minimal data
const minimalInput: CreateGeographicFeatureInput = {
  name: 'Test Location',
  description: null,
  feature_type: 'natural',
  latitude: 0.0,
  longitude: 0.0
};

describe('createGeographicFeature', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a geographic feature with full data', async () => {
    const result = await createGeographicFeature(testCityInput);

    // Basic field validation
    expect(result.name).toEqual('San Francisco');
    expect(result.description).toEqual('Major city in California');
    expect(result.feature_type).toEqual('city');
    expect(result.latitude).toEqual(37.7749);
    expect(result.longitude).toEqual(-122.4194);
    expect(result.properties).toEqual({
      population: '883305',
      state: 'California',
      country: 'USA'
    });
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save geographic feature to database', async () => {
    const result = await createGeographicFeature(testCityInput);

    // Query using proper drizzle syntax
    const features = await db.select()
      .from(geographicFeaturesTable)
      .where(eq(geographicFeaturesTable.id, result.id))
      .execute();

    expect(features).toHaveLength(1);
    const savedFeature = features[0];
    expect(savedFeature.name).toEqual('San Francisco');
    expect(savedFeature.description).toEqual('Major city in California');
    expect(savedFeature.feature_type).toEqual('city');
    expect(savedFeature.latitude).toEqual(37.7749);
    expect(savedFeature.longitude).toEqual(-122.4194);
    expect(savedFeature.properties).toEqual({
      population: '883305',
      state: 'California',
      country: 'USA'
    });
    expect(savedFeature.created_at).toBeInstanceOf(Date);
  });

  it('should create different feature types correctly', async () => {
    const landmarkResult = await createGeographicFeature(testLandmarkInput);

    expect(landmarkResult.name).toEqual('Golden Gate Bridge');
    expect(landmarkResult.feature_type).toEqual('landmark');
    expect(landmarkResult.latitude).toEqual(37.8199);
    expect(landmarkResult.longitude).toEqual(-122.4783);
    expect(landmarkResult.properties).toEqual({
      opened: '1937',
      length: '2737m'
    });
  });

  it('should handle minimal input with null values', async () => {
    const result = await createGeographicFeature(minimalInput);

    expect(result.name).toEqual('Test Location');
    expect(result.description).toBeNull();
    expect(result.feature_type).toEqual('natural');
    expect(result.latitude).toEqual(0.0);
    expect(result.longitude).toEqual(0.0);
    expect(result.properties).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should handle coordinates at boundary values', async () => {
    const boundaryInput: CreateGeographicFeatureInput = {
      name: 'Extreme Location',
      description: 'Testing coordinate boundaries',
      feature_type: 'administrative',
      latitude: -90.0, // South pole
      longitude: 180.0, // International date line
      properties: null
    };

    const result = await createGeographicFeature(boundaryInput);

    expect(result.latitude).toEqual(-90.0);
    expect(result.longitude).toEqual(180.0);
    expect(result.feature_type).toEqual('administrative');
  });

  it('should query features by coordinate ranges correctly', async () => {
    // Create multiple test features
    await createGeographicFeature(testCityInput);
    await createGeographicFeature(testLandmarkInput);

    // Query features within San Francisco Bay Area bounds
    const northBound = 38.0;
    const southBound = 37.0;
    const eastBound = -122.0;
    const westBound = -123.0;

    const conditions = [
      gte(geographicFeaturesTable.latitude, southBound),
      lte(geographicFeaturesTable.latitude, northBound),
      gte(geographicFeaturesTable.longitude, westBound),
      lte(geographicFeaturesTable.longitude, eastBound)
    ];

    const features = await db.select()
      .from(geographicFeaturesTable)
      .where(and(...conditions))
      .execute();

    expect(features.length).toBeGreaterThan(0);
    features.forEach(feature => {
      expect(feature.latitude).toBeGreaterThanOrEqual(southBound);
      expect(feature.latitude).toBeLessThanOrEqual(northBound);
      expect(feature.longitude).toBeGreaterThanOrEqual(westBound);
      expect(feature.longitude).toBeLessThanOrEqual(eastBound);
    });
  });

  it('should create multiple features without conflicts', async () => {
    const result1 = await createGeographicFeature(testCityInput);
    const result2 = await createGeographicFeature(testLandmarkInput);
    const result3 = await createGeographicFeature(minimalInput);

    // Verify all have unique IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.id).not.toEqual(result3.id);
    expect(result2.id).not.toEqual(result3.id);

    // Verify all are stored in database
    const allFeatures = await db.select()
      .from(geographicFeaturesTable)
      .execute();

    expect(allFeatures).toHaveLength(3);
    
    const names = allFeatures.map(f => f.name).sort();
    expect(names).toEqual(['Golden Gate Bridge', 'San Francisco', 'Test Location']);
  });
});