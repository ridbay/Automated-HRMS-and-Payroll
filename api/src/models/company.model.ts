import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const companies = sqliteTable('companies', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  subdomain: text('subdomain').unique(),
  registrationNumber: text('registration_number'),
  industry: text('industry'),
  fiscalYearStart: text('fiscal_year_start'),
  address: text('address'),
  supportEmail: text('support_email'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').$onUpdate(() => new Date().toISOString()),
});
