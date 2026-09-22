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

// Company knowledge base the AI assistant can search (handbook pages, policy
// text, FAQs — anything HR/Admin wants every employee's questions answered
// against). `content` is plain text: there's no PDF/DOCX text-extraction
// pipeline in this Worker, so the admin pastes/types the searchable text
// directly; `fileKey` optionally keeps the original uploaded file in R2
// purely for reference/download, it is never itself parsed or searched.
export const companyDocuments = sqliteTable('company_documents', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id),
  title: text('title').notNull(),
  content: text('content').notNull(),
  fileKey: text('file_key'),
  fileName: text('file_name'),
  uploadedById: text('uploaded_by_id').notNull(),
  uploadedByName: text('uploaded_by_name'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').$onUpdate(() => new Date().toISOString()),
});
