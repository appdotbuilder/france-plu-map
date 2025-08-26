import { serial, text, pgTable, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Departments table
export const departmentsTable = pgTable('departments', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  geometry: jsonb('geometry').notNull(), // GeoJSON geometry object
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Communes table
export const communesTable = pgTable('communes', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  department_code: text('department_code').notNull(),
  geometry: jsonb('geometry').notNull(), // GeoJSON geometry object
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// PLU Zones table
export const pluZonesTable = pgTable('plu_zones', {
  id: serial('id').primaryKey(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  commune_code: text('commune_code').notNull(),
  zone_type: text('zone_type').notNull(), // Type of PLU zone (A, AU, N, U, etc.)
  geometry: jsonb('geometry').notNull(), // GeoJSON geometry object
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Define relations
export const departmentsRelations = relations(departmentsTable, ({ many }) => ({
  communes: many(communesTable)
}));

export const communesRelations = relations(communesTable, ({ one, many }) => ({
  department: one(departmentsTable, {
    fields: [communesTable.department_code],
    references: [departmentsTable.code]
  }),
  pluZones: many(pluZonesTable)
}));

export const pluZonesRelations = relations(pluZonesTable, ({ one }) => ({
  commune: one(communesTable, {
    fields: [pluZonesTable.commune_code],
    references: [communesTable.code]
  })
}));

// TypeScript types for the table schemas
export type Department = typeof departmentsTable.$inferSelect;
export type NewDepartment = typeof departmentsTable.$inferInsert;

export type Commune = typeof communesTable.$inferSelect;
export type NewCommune = typeof communesTable.$inferInsert;

export type PluZone = typeof pluZonesTable.$inferSelect;
export type NewPluZone = typeof pluZonesTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  departments: departmentsTable,
  communes: communesTable,
  pluZones: pluZonesTable
};

export const tableRelations = {
  departments: departmentsRelations,
  communes: communesRelations,
  pluZones: pluZonesRelations
};