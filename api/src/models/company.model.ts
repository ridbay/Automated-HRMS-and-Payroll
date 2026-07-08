import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const companies = sqliteTable('companies', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  subdomain: text('subdomain').unique(),
  createdAt: text('created_at').notNull(),
});
