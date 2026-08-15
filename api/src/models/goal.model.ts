import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const goals = sqliteTable('goals', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  employeeId: text('employee_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  priority: text('priority').notNull().default('medium'), // 'high' | 'medium' | 'low'
  status: text('status').notNull().default('on_track'),   // 'on_track' | 'at_risk' | 'completed'
  progress: integer('progress').notNull().default(0),     // 0-100
  dueDate: text('due_date'),
  keyResults: text('key_results'),                        // JSON string
  scope: text('scope').notNull().default('individual'),   // 'individual' | 'team' | 'department' | 'company'
  assignedById: text('assigned_by_id'),                    // set when a manager/admin creates it for someone else
  parentGoalId: text('parent_goal_id'),                     // links to a broader goal for alignment rollups
  // Set on 'department'-scoped objectives so each department can carry its
  // own strategic goals distinct from the company-wide ones. departmentName
  // is denormalized (same convention as employees.department/departmentId)
  // so reads don't need a join.
  departmentId: text('department_id'),
  departmentName: text('department_name'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});
