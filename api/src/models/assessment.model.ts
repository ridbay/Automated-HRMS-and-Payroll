import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const assessments = sqliteTable('assessments', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  employeeId: text('employee_id').notNull(),
  cycleName: text('cycle_name').notNull(), // e.g. "H2 2024", "Q1 2025"
  status: text('status').notNull().default('draft'), // 'draft' | 'submitted' | 'under_review' | 'completed'

  // Self-assessment data (stored as JSON strings)
  achievements: text('achievements').notNull().default('[]'), // JSON array of strings
  challenges: text('challenges').notNull().default('[]'), // JSON array of strings
  goalsProgress: text('goals_progress').notNull().default('[]'), // JSON array of goal progress objects
  skillRatings: text('skill_ratings').notNull().default('[]'), // JSON array of skill rating objects

  // Overall self-rating
  selfRating: text('self_rating'), // e.g. "exceeds_expectations"
  selfComment: text('self_comment'),

  // Development goals
  developmentGoals: text('development_goals').notNull().default('[]'), // JSON array of development goal objects

  // Manager review (filled by manager)
  managerRating: text('manager_rating'),
  managerComment: text('manager_comment'),
  managerId: text('manager_id'),
  reviewedAt: text('reviewed_at'),

  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  submittedAt: text('submitted_at'),
});
