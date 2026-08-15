import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { companies } from './company.model';

// Append-only log of every question asked of the AI assistant (AiService.ask)
// — same convention as auditLogs: gives Compliance/Settings a real "AI usage"
// trail, and is useful evidence of what the assistant was actually allowed
// to see per role while debugging the scoping rules in ai.service.ts.
export const aiQueryLogs = sqliteTable('ai_query_logs', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id),
  employeeId: text('employee_id').notNull(),
  role: text('role').notNull(),
  question: text('question').notNull(),
  toolsUsed: text('tools_used', { mode: 'json' }).$type<string[]>().default(sql`'[]'`),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});
