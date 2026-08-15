import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { companies } from './company.model';

// Transactional email templates (Control Center > Communications > Email
// Templates). Seeded with defaults per company on first read; `key` is the
// stable slug (e.g. 'welcome_email') the notification pipeline would look
// up by, `name` is the human label shown in the editor list.
export const emailTemplates = sqliteTable('email_templates', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id).notNull(),
  key: text('key').notNull(),
  name: text('name').notNull(),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').$onUpdate(() => new Date().toISOString()),
});

// Third-party app connections (Control Center > Automation > Integrations).
// Seeded with a default catalog per company on first read; toggling flips
// between 'available' and 'connected'. No real OAuth handshake is wired up
// yet — this tracks the on/off state the rest of the product can key off of.
export const integrations = sqliteTable('integrations', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id).notNull(),
  key: text('key').notNull(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  status: text('status').default('available').notNull(), // 'available' | 'connected'
  connectedAt: text('connected_at'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').$onUpdate(() => new Date().toISOString()),
});

// Automation pipelines (Control Center > Automation > Workflows). Seeded
// with a default catalog per company on first read; `steps` is a JSON array
// of { id, name, assignee } the editor renders as an ordered checklist.
export const workflows = sqliteTable('workflows', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id).notNull(),
  key: text('key').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  steps: text('steps', { mode: 'json' }).notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).default(true).notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').$onUpdate(() => new Date().toISOString()),
});
