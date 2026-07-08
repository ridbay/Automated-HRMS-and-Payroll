import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const feedbacks = sqliteTable('feedbacks', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  fromEmployeeId: text('from_employee_id').notNull(),
  toEmployeeName: text('to_employee_name').notNull(),
  type: text('type').notNull(), // 'praise' | 'bravo' | 'gratitude'
  message: text('message').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});
