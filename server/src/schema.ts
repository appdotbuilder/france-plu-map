import { z } from 'zod';

// Geographic coordinate schema for latitude and longitude
export const coordinateSchema = z.object({
  latitude: z.number().min(-90).max(90), // Valid latitude range
  longitude: z.number().min(-180).max(180) // Valid longitude range
});

export type Coordinate = z.infer<typeof coordinateSchema>;

// Bounding box schema for map view boundaries
export const boundingBoxSchema = z.object({
  north: z.number().min(-90).max(90),
  south: z.number().min(-90).max(90),
  east: z.number().min(-180).max(180),
  west: z.number().min(-180).max(180)
});

export type BoundingBox = z.infer<typeof boundingBoxSchema>;

// Geographic feature schema for points of interest, regions, etc.
export const geographicFeatureSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  feature_type: z.enum(['city', 'region', 'landmark', 'administrative', 'natural']),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  properties: z.record(z.string()).nullable(), // JSON properties for additional data
  created_at: z.coerce.date()
});

export type GeographicFeature = z.infer<typeof geographicFeatureSchema>;

// Input schema for creating geographic features
export const createGeographicFeatureInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable(),
  feature_type: z.enum(['city', 'region', 'landmark', 'administrative', 'natural']),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  properties: z.record(z.string()).nullable().optional()
});

export type CreateGeographicFeatureInput = z.infer<typeof createGeographicFeatureInputSchema>;

// Map view configuration schema
export const mapViewSchema = z.object({
  center: coordinateSchema,
  zoom_level: z.number().min(1).max(20),
  bounds: boundingBoxSchema.optional()
});

export type MapView = z.infer<typeof mapViewSchema>;

// Query schema for searching geographic features
export const searchGeographicFeaturesInputSchema = z.object({
  query: z.string().optional(),
  feature_type: z.enum(['city', 'region', 'landmark', 'administrative', 'natural']).optional(),
  bounds: boundingBoxSchema.optional(),
  limit: z.number().int().positive().max(100).default(50)
});

export type SearchGeographicFeaturesInput = z.infer<typeof searchGeographicFeaturesInputSchema>;

// Schema for getting features within a bounding box
export const getFeaturesInBoundsInputSchema = z.object({
  bounds: boundingBoxSchema,
  feature_types: z.array(z.enum(['city', 'region', 'landmark', 'administrative', 'natural'])).optional(),
  limit: z.number().int().positive().max(1000).default(100)
});

export type GetFeaturesInBoundsInput = z.infer<typeof getFeaturesInBoundsInputSchema>;