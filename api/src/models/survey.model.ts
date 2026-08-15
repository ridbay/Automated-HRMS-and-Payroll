import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const surveys = sqliteTable('surveys', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  type: text('type').notNull(), // 'eNPS', 'pulse', 'custom'
  status: text('status').notNull().default('draft'), // 'draft', 'active', 'closed'
  targetAudience: text('target_audience').default('all'), // 'all', or specific department ID
  createdAt: text('created_at').notNull(),
  expiresAt: text('expires_at'),
});

export const surveyQuestions = sqliteTable('survey_questions', {
  id: text('id').primaryKey(),
  surveyId: text('survey_id').notNull(),
  question: text('question').notNull(),
  type: text('type').notNull(), // 'rating', 'text', 'multiple_choice'
  options: text('options'), // JSON string for multiple choice options
  orderIndex: integer('order_index').notNull().default(0),
});

export const surveyResponses = sqliteTable('survey_responses', {
  id: text('id').primaryKey(),
  surveyId: text('survey_id').notNull(),
  employeeId: text('employee_id'), // Optional for anonymity
  submittedAt: text('submitted_at').notNull(),
});

export const surveyAnswers = sqliteTable('survey_answers', {
  id: text('id').primaryKey(),
  responseId: text('response_id').notNull(),
  questionId: text('question_id').notNull(),
  answer: text('answer').notNull(), // Numeric rating (as string) or text
});
