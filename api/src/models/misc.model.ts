import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { companies } from './company.model';

export const walletTransactions = sqliteTable('wallet_transactions', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id),
  type: text('type').notNull(), // 'credit' | 'debit'
  amount: integer('amount').notNull(),
  description: text('description').notNull(),
  timestamp: text('timestamp').notNull(),
  status: text('status').notNull(), // 'completed' | 'pending' | 'failed'
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').$onUpdate(() => new Date().toISOString()),
});

export const jobRequisitions = sqliteTable('job_requisitions', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id),
  title: text('title').notNull(),
  department: text('department').notNull(),
  location: text('location').notNull(),
  employmentType: text('employment_type'), // 'Full-time' | 'Contract' | 'Intern' | 'Consultant'
  hiringManager: text('hiring_manager').notNull(),
  managerAvatar: text('manager_avatar'),
  priority: text('priority').notNull(),
  // 'Pending Approval' | 'Open' | 'On Hold' | 'Filled' | 'Cancelled' | 'Rejected'
  status: text('status').notNull(),
  dateOpened: text('date_opened').notNull(),
  targetHireDate: text('target_hire_date').notNull(),
  daysOpen: integer('days_open').notNull(),
  justification: text('justification'),
  budgetRange: text('budget_range'),
  // Who requested this requisition (audit trail for the approval workflow)
  requestedById: text('requested_by_id'),
  requestedByName: text('requested_by_name'),
  // Who reviewed it (approved or rejected) and when
  reviewedById: text('reviewed_by_id'),
  reviewedByName: text('reviewed_by_name'),
  reviewedAt: text('reviewed_at'),
  rejectionReason: text('rejection_reason'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').$onUpdate(() => new Date().toISOString()),
});

export const employeeTrainings = sqliteTable('employee_trainings', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id),
  employeeId: text('employee_id').notNull(),
  courseName: text('course_name').notNull(),
  provider: text('provider').notNull(),
  status: text('status').notNull().default('in_progress'), // 'in_progress' | 'completed' | 'assigned'
  date: text('date').notNull(), // Started/Completed date
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').$onUpdate(() => new Date().toISOString()),
});

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id),
  employeeId: text('employee_id').notNull(),
  action: text('action').notNull(),
  actorName: text('actor_name').notNull(),
  details: text('details').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});
