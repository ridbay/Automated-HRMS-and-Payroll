import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const courses = sqliteTable('courses', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  url: text('url'), // External video or SCORM link
  duration: integer('duration').notNull().default(0), // Duration in minutes
  status: text('status').notNull().default('active'), // 'draft', 'active', 'archived'
  createdAt: text('created_at').notNull(),
});

export const courseEnrollments = sqliteTable('course_enrollments', {
  id: text('id').primaryKey(),
  courseId: text('course_id').notNull(),
  employeeId: text('employee_id').notNull(),
  status: text('status').notNull().default('assigned'), // 'assigned', 'in_progress', 'completed'
  enrolledAt: text('enrolled_at').notNull(),
  completedAt: text('completed_at'),
  progress: integer('progress').notNull().default(0), // Percentage 0-100
});
