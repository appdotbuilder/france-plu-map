import { serial, text, pgTable, timestamp, real, jsonb, pgEnum } from 'drizzle-orm/pg-core';

// Enum for geographic feature types
export const featureTypeEnum = pgEnum('feature_type', [
  'city', 
  'region', 
  'landmark', 
  'administrative', 
  'natural'
]);

// Geographic features table for storing points of interest, cities, regions, etc.
export const geographicFeaturesTable = pgTable('geographic_features', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'), // Nullable by default
  feature_type: featureTypeEnum('feature_type').notNull(),
  latitude: real('latitude').notNull(), // Using real for decimal coordinates
  longitude: real('longitude').notNull(), // Using real for decimal coordinates
  properties: jsonb('properties'), // Nullable JSONB for additional feature properties
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type GeographicFeature = typeof geographicFeaturesTable.$inferSelect; // For SELECT operations
export type NewGeographicFeature = typeof geographicFeaturesTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { 
  geographicFeatures: geographicFeaturesTable 
};