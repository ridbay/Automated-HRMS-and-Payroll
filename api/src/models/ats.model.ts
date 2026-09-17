import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';
import { companies } from './company.model';
import { jobRequisitions } from './misc.model';
import { employees } from './employee.model';

// A person who has applied (or been added) to a requisition's pipeline.
// `skills` is a JSON array of strings; `timeline` lives in its own table
// (candidateTimelineEvents) rather than an inline JSON blob so stage moves,
// interview scheduling, and offer events can all append to one real,
// queryable log instead of round-tripping the whole array on every write.
export const candidates = sqliteTable('candidates', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id),
  requisitionId: text('requisition_id').references(() => jobRequisitions.id),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  location: text('location'),
  currentTitle: text('current_title'),
  currentEmployer: text('current_employer'),
  experienceYears: real('experience_years'),
  education: text('education'),
  skills: text('skills', { mode: 'json' }).$type<string[]>().default(sql`'[]'`),
  // 'LinkedIn' | 'Referral' | 'Job Board' | 'Career Page'
  source: text('source').notNull().default('Career Page'),
  salaryExpectation: text('salary_expectation'),
  linkedinUrl: text('linkedin_url'),
  githubUrl: text('github_url'),
  portfolioUrl: text('portfolio_url'),
  coverLetter: text('cover_letter'),
  // R2 object key (same convention as employeeDocuments.fileKey), not a URL.
  resumeFileKey: text('resume_file_key'),
  rating: real('rating'),
  // 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected'
  status: text('status').notNull().default('applied'),
  // Set when an accepted offer creates the corresponding employee record —
  // links the ATS pipeline through to onboarding instead of dead-ending at 'hired'.
  hiredEmployeeId: text('hired_employee_id').references(() => employees.id),
  appliedDate: text('applied_date').notNull().default(sql`CURRENT_TIMESTAMP`),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').$onUpdate(() => new Date().toISOString()),
});

export const candidateTimelineEvents = sqliteTable('candidate_timeline_events', {
  id: text('id').primaryKey(),
  candidateId: text('candidate_id').notNull().references(() => candidates.id),
  companyId: text('company_id').notNull().references(() => companies.id),
  event: text('event').notNull(),
  note: text('note'),
  actorId: text('actor_id'),
  actorName: text('actor_name'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const interviews = sqliteTable('interviews', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id),
  candidateId: text('candidate_id').notNull().references(() => candidates.id),
  requisitionId: text('requisition_id').references(() => jobRequisitions.id),
  // 'Phone' | 'Video' | 'In-person' | 'Panel'
  type: text('type').notNull(),
  // 'Screening' | 'Technical' | 'Cultural' | 'Final'
  stage: text('stage').notNull(),
  dateTime: text('date_time').notNull(),
  durationMinutes: integer('duration_minutes').notNull().default(60),
  // JSON array of employeeIds
  interviewerIds: text('interviewer_ids', { mode: 'json' }).$type<string[]>().default(sql`'[]'`),
  meetingLink: text('meeting_link'),
  // 'Scheduled' | 'Completed' | 'Cancelled'
  status: text('status').notNull().default('Scheduled'),
  createdBy: text('created_by'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').$onUpdate(() => new Date().toISOString()),
});

// One row per interviewer per interview (not a single blob) so panel
// interviews capture each panelist's independent scorecard.
export const interviewScorecards = sqliteTable('interview_scorecards', {
  id: text('id').primaryKey(),
  interviewId: text('interview_id').notNull().references(() => interviews.id),
  companyId: text('company_id').notNull().references(() => companies.id),
  interviewerId: text('interviewer_id'),
  interviewerName: text('interviewer_name'),
  technical: integer('technical'),
  communication: integer('communication'),
  cultural: integer('cultural'),
  notes: text('notes'),
  // 'Hire' | 'Maybe' | 'No Hire'
  recommendation: text('recommendation'),
  submittedAt: text('submitted_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const offers = sqliteTable('offers', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id),
  candidateId: text('candidate_id').notNull().references(() => candidates.id),
  requisitionId: text('requisition_id').references(() => jobRequisitions.id),
  title: text('title').notNull(),
  department: text('department'),
  salary: integer('salary').notNull(),
  currency: text('currency').notNull().default('NGN'),
  startDate: text('start_date'),
  expiryDate: text('expiry_date'),
  // 'draft' | 'pending_approval' | 'sent' | 'accepted' | 'declined' | 'rescinded'
  status: text('status').notNull().default('draft'),
  letterBody: text('letter_body'),
  approvedById: text('approved_by_id'),
  approvedAt: text('approved_at'),
  sentAt: text('sent_at'),
  respondedAt: text('responded_at'),
  createdBy: text('created_by'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').$onUpdate(() => new Date().toISOString()),
});

export const candidatesRelations = relations(candidates, ({ one, many }) => ({
  requisition: one(jobRequisitions, {
    fields: [candidates.requisitionId],
    references: [jobRequisitions.id],
  }),
  timeline: many(candidateTimelineEvents),
  interviews: many(interviews),
  offers: many(offers),
}));

export const candidateTimelineEventsRelations = relations(candidateTimelineEvents, ({ one }) => ({
  candidate: one(candidates, {
    fields: [candidateTimelineEvents.candidateId],
    references: [candidates.id],
  }),
}));

export const interviewsRelations = relations(interviews, ({ one, many }) => ({
  candidate: one(candidates, {
    fields: [interviews.candidateId],
    references: [candidates.id],
  }),
  scorecards: many(interviewScorecards),
}));

export const interviewScorecardsRelations = relations(interviewScorecards, ({ one }) => ({
  interview: one(interviews, {
    fields: [interviewScorecards.interviewId],
    references: [interviews.id],
  }),
}));

export const offersRelations = relations(offers, ({ one }) => ({
  candidate: one(candidates, {
    fields: [offers.candidateId],
    references: [candidates.id],
  }),
}));
