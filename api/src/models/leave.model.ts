import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { employees } from './employee.model';

export const leaveRequests = sqliteTable('leave_requests', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').notNull().references(() => employees.id),
  type: text('type').notNull(), 
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  days: integer('days').notNull(),
  reason: text('reason').notNull(),
  status: text('status').notNull(), 
  attachment: text('attachment'),
  appliedOn: text('applied_on').notNull(),
});
