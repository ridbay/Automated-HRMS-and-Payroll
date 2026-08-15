import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { companies } from './company.model';
import { employees } from './employee.model';

export const supportTickets = sqliteTable('support_tickets', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id),
  employeeId: text('employee_id').notNull().references(() => employees.id),
  subject: text('subject').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(), // 'IT', 'HR', 'Payroll', 'General'
  priority: text('priority').notNull(), // 'Low', 'Medium', 'High', 'Urgent'
  status: text('status').notNull().default('Open'), // 'Open', 'In Progress', 'Resolved'
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').$onUpdate(() => new Date().toISOString()),
});

export const supportTicketMessages = sqliteTable('support_ticket_messages', {
  id: text('id').primaryKey(),
  ticketId: text('ticket_id').notNull().references(() => supportTickets.id),
  senderId: text('sender_id').notNull().references(() => employees.id), // Can be the employee or the admin
  message: text('message').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});
