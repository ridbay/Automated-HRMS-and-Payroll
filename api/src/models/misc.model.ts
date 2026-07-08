import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { companies } from './company.model';

export const walletTransactions = sqliteTable('wallet_transactions', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id),
  type: text('type').notNull(), // 'credit' | 'debit'
  amount: integer('amount').notNull(),
  description: text('description').notNull(),
  timestamp: text('timestamp').notNull(),
  status: text('status').notNull(), // 'completed' | 'pending' | 'failed'
});

export const jobRequisitions = sqliteTable('job_requisitions', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id),
  title: text('title').notNull(),
  department: text('department').notNull(),
  location: text('location').notNull(),
  hiringManager: text('hiring_manager').notNull(),
  managerAvatar: text('manager_avatar'),
  priority: text('priority').notNull(),
  status: text('status').notNull(),
  dateOpened: text('date_opened').notNull(),
  targetHireDate: text('target_hire_date').notNull(),
  daysOpen: integer('days_open').notNull(),
});
