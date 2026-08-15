import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
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
  // Legacy flat deadlines — superseded by cycleStages below, kept so old
  // reads/writes against these two columns keep working.
  selfReviewDueDate: text('self_review_due_date'),
  managerReviewDueDate: text('manager_review_due_date'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// The granular, named-stage timeline within a cycle (kickoff, peer
// selection, self-review, manager review, etc.), each with its own
// start/due window. A cycle gets the standard stage set created for it
// automatically (see ReviewCycleService.createDefaultStages); admin edits
// the dates per stage. Absent dates mean "no window configured" — treated
// as always-open/always-released for backward compatibility with cycles
// that never set up a granular timeline.
export const cycleStages = sqliteTable('cycle_stages', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  cycleId: text('cycle_id').notNull(),
  key: text('key').notNull(), // one of STAGE_DEFS keys — see reviewCycle.service.ts
  name: text('name').notNull(),
  order: integer('order').notNull().default(0),
  startDate: text('start_date'),
  dueDate: text('due_date'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});
