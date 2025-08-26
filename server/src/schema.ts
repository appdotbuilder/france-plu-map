import { z } from 'zod';

// GeoJSON geometry types
export const coordinatesSchema = z.array(z.number()).min(2);
export const pointGeometrySchema = z.object({
  type: z.literal('Point'),
  coordinates: coordinatesSchema
});
export const multiPointGeometrySchema = z.object({
  type: z.literal('MultiPoint'),
  coordinates: z.array(coordinatesSchema)
});
export const lineStringGeometrySchema = z.object({
  type: z.literal('LineString'),
  coordinates: z.array(coordinatesSchema)
});
export const multiLineStringGeometrySchema = z.object({
  type: z.literal('MultiLineString'),
  coordinates: z.array(z.array(coordinatesSchema))
});
export const polygonGeometrySchema = z.object({
  type: z.literal('Polygon'),
  coordinates: z.array(z.array(coordinatesSchema))
});
export const multiPolygonGeometrySchema = z.object({
  type: z.literal('MultiPolygon'),
  coordinates: z.array(z.array(z.array(coordinatesSchema)))
});

export const geometrySchema = z.union([
  pointGeometrySchema,
  multiPointGeometrySchema,
  lineStringGeometrySchema,
  multiLineStringGeometrySchema,
  polygonGeometrySchema,
  multiPolygonGeometrySchema
]);

// Department schema
export const departmentSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  geometry: geometrySchema,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Department = z.infer<typeof departmentSchema>;

// Commune schema
export const communeSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  department_code: z.string(),
  geometry: geometrySchema,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Commune = z.infer<typeof communeSchema>;

// PLU Zone schema
export const pluZoneSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  commune_code: z.string(),
  zone_type: z.string(),
  geometry: geometrySchema,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type PluZone = z.infer<typeof pluZoneSchema>;

// Input schemas for queries
export const getDepartmentsInputSchema = z.object({
  bbox: z.array(z.number()).length(4).optional() // [minX, minY, maxX, maxY]
});

export type GetDepartmentsInput = z.infer<typeof getDepartmentsInputSchema>;

export const getCommunesInputSchema = z.object({
  department_code: z.string()
});

export type GetCommunesInput = z.infer<typeof getCommunesInputSchema>;

export const getPluZonesInputSchema = z.object({
  commune_code: z.string()
});

export type GetPluZonesInput = z.infer<typeof getPluZonesInputSchema>;

// Response schemas for API data
export const geoPortailFeatureSchema = z.object({
  type: z.literal('Feature'),
  properties: z.record(z.unknown()),
  geometry: geometrySchema
});

export const geoPortailFeatureCollectionSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(geoPortailFeatureSchema)
});

export type GeoPortailFeature = z.infer<typeof geoPortailFeatureSchema>;
export type GeoPortailFeatureCollection = z.infer<typeof geoPortailFeatureCollectionSchema>;