import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { getInitialMapView } from '../handlers/get_initial_map_view';
import { type MapView } from '../schema';

describe('getInitialMapView', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return initial map view configuration', async () => {
    const result = await getInitialMapView();

    // Verify return type structure
    expect(result).toBeDefined();
    expect(result.center).toBeDefined();
    expect(result.zoom_level).toBeDefined();
    expect(result.bounds).toBeDefined();
  });

  it('should return France-centered coordinates', async () => {
    const result = await getInitialMapView();

    // Verify center coordinates are for France
    expect(result.center.latitude).toEqual(46.2276);
    expect(result.center.longitude).toEqual(2.2137);
    
    // Verify coordinates are within valid ranges
    expect(result.center.latitude).toBeGreaterThanOrEqual(-90);
    expect(result.center.latitude).toBeLessThanOrEqual(90);
    expect(result.center.longitude).toBeGreaterThanOrEqual(-180);
    expect(result.center.longitude).toBeLessThanOrEqual(180);
  });

  it('should return appropriate zoom level for country view', async () => {
    const result = await getInitialMapView();

    // Verify zoom level is appropriate for country-level view
    expect(result.zoom_level).toEqual(6);
    expect(result.zoom_level).toBeGreaterThanOrEqual(1);
    expect(result.zoom_level).toBeLessThanOrEqual(20);
  });

  it('should return France bounding box', async () => {
    const result = await getInitialMapView();

    // Verify bounds are defined and represent France
    expect(result.bounds).toBeDefined();
    expect(result.bounds!.north).toEqual(51.1);
    expect(result.bounds!.south).toEqual(41.3);
    expect(result.bounds!.east).toEqual(9.6);
    expect(result.bounds!.west).toEqual(-5.1);
  });

  it('should return valid bounding box coordinates', async () => {
    const result = await getInitialMapView();

    const bounds = result.bounds!;
    
    // Verify all coordinates are within valid ranges
    expect(bounds.north).toBeGreaterThanOrEqual(-90);
    expect(bounds.north).toBeLessThanOrEqual(90);
    expect(bounds.south).toBeGreaterThanOrEqual(-90);
    expect(bounds.south).toBeLessThanOrEqual(90);
    expect(bounds.east).toBeGreaterThanOrEqual(-180);
    expect(bounds.east).toBeLessThanOrEqual(180);
    expect(bounds.west).toBeGreaterThanOrEqual(-180);
    expect(bounds.west).toBeLessThanOrEqual(180);
    
    // Verify bounding box logical consistency
    expect(bounds.north).toBeGreaterThan(bounds.south);
    expect(bounds.east).toBeGreaterThan(bounds.west);
  });

  it('should return center coordinates within bounding box', async () => {
    const result = await getInitialMapView();

    const { center, bounds } = result;
    
    // Verify center is within the defined bounds
    expect(center.latitude).toBeLessThanOrEqual(bounds!.north);
    expect(center.latitude).toBeGreaterThanOrEqual(bounds!.south);
    expect(center.longitude).toBeLessThanOrEqual(bounds!.east);
    expect(center.longitude).toBeGreaterThanOrEqual(bounds!.west);
  });

  it('should return consistent results on multiple calls', async () => {
    const result1 = await getInitialMapView();
    const result2 = await getInitialMapView();

    // Verify consistency across calls
    expect(result1.center.latitude).toEqual(result2.center.latitude);
    expect(result1.center.longitude).toEqual(result2.center.longitude);
    expect(result1.zoom_level).toEqual(result2.zoom_level);
    expect(result1.bounds!.north).toEqual(result2.bounds!.north);
    expect(result1.bounds!.south).toEqual(result2.bounds!.south);
    expect(result1.bounds!.east).toEqual(result2.bounds!.east);
    expect(result1.bounds!.west).toEqual(result2.bounds!.west);
  });

  it('should match MapView schema structure', async () => {
    const result = await getInitialMapView();

    // Verify the result matches expected MapView structure
    expect(typeof result.center.latitude).toBe('number');
    expect(typeof result.center.longitude).toBe('number');
    expect(typeof result.zoom_level).toBe('number');
    expect(typeof result.bounds!.north).toBe('number');
    expect(typeof result.bounds!.south).toBe('number');
    expect(typeof result.bounds!.east).toBe('number');
    expect(typeof result.bounds!.west).toBe('number');
  });
});