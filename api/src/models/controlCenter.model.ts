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
// between 'available' and 'connected'. Slack is real (an admin pastes an
// Incoming Webhook URL into `config`, no OAuth app needed) — the rest of
// the catalog is still just this on/off state with no live handshake behind it.
export const integrations = sqliteTable('integrations', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id).notNull(),
  key: text('key').notNull(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  status: text('status').default('available').notNull(), // 'available' | 'connected'
  connectedAt: text('connected_at'),
  // Provider-specific settings, e.g. Slack's { webhookUrl }. Nullable — most
  // catalog entries have nothing real to configure yet.
  config: text('config', { mode: 'json' }),
  lastError: text('last_error'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').$onUpdate(() => new Date().toISOString()),
});

// Delivery log for outbound integration notifications (Slack messages,
// eventually others) — gives Control Center a real activity feed instead of
// just a connected/available toggle, and a place to see why a send failed.
export const integrationEvents = sqliteTable('integration_events', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id).notNull(),
  integrationKey: text('integration_key').notNull(),
  eventType: text('event_type').notNull(), // e.g. 'requisition.approved', 'payroll.paid', 'test'
  payloadSummary: text('payload_summary').notNull(),
  status: text('status').notNull(), // 'sent' | 'failed'
  responseCode: integer('response_code'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
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

export const workflowExecutions = sqliteTable('workflow_executions', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id).notNull(),
  workflowKey: text('workflow_key').notNull(),
  triggerEvent: text('trigger_event').notNull(),
  entityId: text('entity_id'),
  status: text('status').notNull().default('completed'), // 'completed' | 'failed' | 'skipped'
  details: text('details', { mode: 'json' }),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});
