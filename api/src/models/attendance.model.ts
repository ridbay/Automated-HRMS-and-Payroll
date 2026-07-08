import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { employees } from './employee.model';

export const attendanceRecords = sqliteTable('attendance_records', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').notNull().references(() => employees.id),
  date: text('date').notNull(),
  clockIn: text('clock_in').notNull(),
  clockOut: text('clock_out'),
  status: text('status').notNull(),
  locationIn: text('location_in'),
  locationOut: text('location_out'),
  workHours: real('work_hours').notNull(),
  overtime: real('overtime').notNull(),
  notes: text('notes'),
});
