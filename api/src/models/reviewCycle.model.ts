import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Admin/HR-managed performance review cycles (e.g. "H2 2024", "Q1 2025").
// Exactly one cycle per company is normally 'active' at a time — that's the
// cycle self-assessments and manager reviews are created against. Employees
// never type a cycle name themselves; it's always resolved server-side from
// whichever cycle here is currently active.
export const reviewCycles = sqliteTable('review_cycles', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  name: text('name').notNull(),
  status: text('status').notNull().default('upcoming'), // 'upcoming' | 'active' | 'closed'
  startDate: text('start_date'),
  endDate: text('end_date'),
  selfReviewDueDate: text('self_review_due_date'),
  managerReviewDueDate: text('manager_review_due_date'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});
