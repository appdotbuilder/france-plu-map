import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { getFranceBounds } from '../handlers/get_france_bounds';
import { type BoundingBox } from '../schema';

describe('getFranceBounds', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return France bounding box coordinates', async () => {
    const result = await getFranceBounds();

    // Validate structure
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
    
    // Validate all required properties exist
    expect(result.north).toBeDefined();
    expect(result.south).toBeDefined();
    expect(result.east).toBeDefined();
    expect(result.west).toBeDefined();
    
    // Validate types are numbers
    expect(typeof result.north).toBe('number');
    expect(typeof result.south).toBe('number');
    expect(typeof result.east).toBe('number');
    expect(typeof result.west).toBe('number');
  });

  it('should return valid latitude coordinates', async () => {
    const result = await getFranceBounds();

    // Validate latitude bounds (-90 to 90)
    expect(result.north).toBeGreaterThanOrEqual(-90);
    expect(result.north).toBeLessThanOrEqual(90);
    expect(result.south).toBeGreaterThanOrEqual(-90);
    expect(result.south).toBeLessThanOrEqual(90);
    
    // North should be greater than south
    expect(result.north).toBeGreaterThan(result.south);
  });

  it('should return valid longitude coordinates', async () => {
    const result = await getFranceBounds();

    // Validate longitude bounds (-180 to 180)
    expect(result.east).toBeGreaterThanOrEqual(-180);
    expect(result.east).toBeLessThanOrEqual(180);
    expect(result.west).toBeGreaterThanOrEqual(-180);
    expect(result.west).toBeLessThanOrEqual(180);
    
    // East should be greater than west
    expect(result.east).toBeGreaterThan(result.west);
  });

  it('should return expected France coordinates', async () => {
    const result = await getFranceBounds();

    // Validate specific France bounds
    expect(result.north).toEqual(51.1);
    expect(result.south).toEqual(41.3);
    expect(result.east).toEqual(9.6);
    expect(result.west).toEqual(-5.1);
  });

  it('should return consistent results on multiple calls', async () => {
    const result1 = await getFranceBounds();
    const result2 = await getFranceBounds();
    const result3 = await getFranceBounds();

    // All results should be identical
    expect(result1).toEqual(result2);
    expect(result2).toEqual(result3);
    expect(result1).toEqual(result3);
  });

  it('should return bounds that cover major French cities', async () => {
    const result = await getFranceBounds();

    // Test that major French cities fall within the bounds
    
    // Paris (48.8566° N, 2.3522° E)
    const parisLat = 48.8566;
    const parisLng = 2.3522;
    expect(parisLat).toBeGreaterThanOrEqual(result.south);
    expect(parisLat).toBeLessThanOrEqual(result.north);
    expect(parisLng).toBeGreaterThanOrEqual(result.west);
    expect(parisLng).toBeLessThanOrEqual(result.east);

    // Marseille (43.2965° N, 5.3698° E)
    const marseilleLat = 43.2965;
    const marseilleLng = 5.3698;
    expect(marseilleLat).toBeGreaterThanOrEqual(result.south);
    expect(marseilleLat).toBeLessThanOrEqual(result.north);
    expect(marseilleLng).toBeGreaterThanOrEqual(result.west);
    expect(marseilleLng).toBeLessThanOrEqual(result.east);

    // Lyon (45.7640° N, 4.8357° E)
    const lyonLat = 45.7640;
    const lyonLng = 4.8357;
    expect(lyonLat).toBeGreaterThanOrEqual(result.south);
    expect(lyonLat).toBeLessThanOrEqual(result.north);
    expect(lyonLng).toBeGreaterThanOrEqual(result.west);
    expect(lyonLng).toBeLessThanOrEqual(result.east);

    // Nice (43.7102° N, 7.2620° E)
    const niceLat = 43.7102;
    const niceLng = 7.2620;
    expect(niceLat).toBeGreaterThanOrEqual(result.south);
    expect(niceLat).toBeLessThanOrEqual(result.north);
    expect(niceLng).toBeGreaterThanOrEqual(result.west);
    expect(niceLng).toBeLessThanOrEqual(result.east);
  });

  it('should return bounds suitable for map display', async () => {
    const result = await getFranceBounds();

    // Calculate approximate dimensions
    const latitudeSpan = result.north - result.south;
    const longitudeSpan = result.east - result.west;

    // France should have reasonable dimensions for map display
    // Latitude span should be around 10 degrees
    expect(latitudeSpan).toBeGreaterThan(5);
    expect(latitudeSpan).toBeLessThan(20);

    // Longitude span should be around 15 degrees
    expect(longitudeSpan).toBeGreaterThan(10);
    expect(longitudeSpan).toBeLessThan(25);

    // Ensure bounds form a proper rectangle
    expect(result.north - result.south).toBeGreaterThan(0);
    expect(result.east - result.west).toBeGreaterThan(0);
  });
});