import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';
import { companies } from './company.model';
import { employees } from './employee.model';

// A "Transition" is an employee lifecycle journey — onboarding a new hire or
// offboarding a departing one — tracked on the Transitions page. `stage` and
// `status` are derived from the attached tasks (see transition.service.ts)
// rather than being freely editable, so the two never drift apart.
export const transitions = sqliteTable('transitions', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id),
  employeeId: text('employee_id').notNull().references(() => employees.id),
  type: text('type').notNull(), // 'Onboarding' | 'Offboarding'
  stage: text('stage').notNull(),
  status: text('status').notNull().default('Active'), // 'Active' | 'Completed' | 'Cancelled'
  startDate: text('start_date').notNull(),
  targetDate: text('target_date'), // expected completion date / last working day
  reason: text('reason'), // offboarding only: 'Resignation' | 'Termination' | 'Contract Ended' | 'Retirement'
  handoverToId: text('handover_to_id'),
  handoverToName: text('handover_to_name'),
  exitInterviewScheduled: integer('exit_interview_scheduled', { mode: 'boolean' }).default(false),
  initiatedById: text('initiated_by_id'),
  initiatedByName: text('initiated_by_name'),
  completedAt: text('completed_at'),
  cancelledAt: text('cancelled_at'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').$onUpdate(() => new Date().toISOString()),
});

export const transitionTasks = sqliteTable('transition_tasks', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id),
  transitionId: text('transition_id').notNull().references(() => transitions.id),
  title: text('title').notNull(),
  category: text('category').notNull(), // 'HR' | 'IT' | 'Finance' | 'Admin'
  assignedTo: text('assigned_to'),
  dueDate: text('due_date'),
  status: text('status').notNull().default('pending'), // 'pending' | 'completed'
  sortOrder: integer('sort_order').notNull().default(0),
  completedAt: text('completed_at'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').$onUpdate(() => new Date().toISOString()),
});

export const transitionsRelations = relations(transitions, ({ many, one }) => ({
  tasks: many(transitionTasks),
  employee: one(employees, {
    fields: [transitions.employeeId],
    references: [employees.id],
  }),
}));

export const transitionTasksRelations = relations(transitionTasks, ({ one }) => ({
  transition: one(transitions, {
    fields: [transitionTasks.transitionId],
    references: [transitions.id],
  }),
}));
