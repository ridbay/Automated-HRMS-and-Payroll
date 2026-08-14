import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { companies } from './company.model';

export const departments = sqliteTable('departments', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  headCount: integer('head_count').default(0),
  // Plain reference (no FK constraint), same convention as employees.managerId
  managerId: text('manager_id'),
  teamLeadId: text('team_lead_id'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').$onUpdate(() => new Date().toISOString()),
});

export const locations = sqliteTable('locations', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id).notNull(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  city: text('city'),
  country: text('country'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').$onUpdate(() => new Date().toISOString()),
});
