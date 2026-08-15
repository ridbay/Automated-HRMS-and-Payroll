import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';
import { companies } from './company.model';
import { employees } from './employee.model';

// ---------------------------------------------------------------------------
// Legacy per-employee financial snapshot (health premium, retirement balance,
// equity, wellness budget). Predates the plan/enrollment model below and is
// still the source of truth for the numbers shown on payslips/compensation
// (see BenefitsService.getEmployeeCompensation) — kept as-is.
// ---------------------------------------------------------------------------
export const employeeBenefits = sqliteTable('employee_benefits', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id),
  employeeId: text('employee_id').notNull().references(() => employees.id).unique(),

  // Health
  healthProvider: text('health_provider'),
  healthPlan: text('health_plan'),
  healthCoverage: text('health_coverage'), // e.g. 'Family', 'Individual'
  healthPremium: integer('health_premium').default(0),

  // Retirement
  retirementPlan: text('retirement_plan'), // e.g. '401(k)'
  retirementBalance: integer('retirement_balance').default(0),
  retirementContributionRate: real('retirement_contribution_rate').default(0), // percentage e.g. 6.0
  employerMatchRate: real('employer_match_rate').default(0), // percentage

  // Equity
  equityGranted: integer('equity_granted').default(0),
  equityVested: integer('equity_vested').default(0),
  equityValue: integer('equity_value').default(0),

  // Wellness
  wellnessBudget: integer('wellness_budget').default(0),
  wellnessUsed: integer('wellness_used').default(0),

  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').$onUpdate(() => new Date().toISOString()),
});

export const employeeBenefitsRelations = relations(employeeBenefits, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeBenefits.employeeId],
    references: [employees.id],
  }),
  company: one(companies, {
    fields: [employeeBenefits.companyId],
    references: [companies.id],
  }),
}));

// ---------------------------------------------------------------------------
// Benefits & Wellbeing module: a company-managed catalog of benefit plans
// (HMO/health, retirement, life, wellness, perks, FSA, equity) that employees
// enroll into, plus a wellness program/claims layer.
// ---------------------------------------------------------------------------

// Admin-managed catalog of plans a company offers.
export const benefitPlans = sqliteTable('benefit_plans', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'health' | 'life' | 'retirement' | 'equity' | 'perk' | 'wellness' | 'fsa'
  provider: text('provider'), // e.g. 'AXA Mansard', 'Stanbic IBTC'
  planTier: text('plan_tier'), // e.g. 'Gold PPO', 'Standard'
  description: text('description'),
  highlights: text('highlights'), // JSON-stringified array of bullet points
  coverageLimit: integer('coverage_limit').default(0), // e.g. annual health cover limit, in kobo/naira
  employerCost: integer('employer_cost').default(0), // employer-paid monthly cost
  employeeCost: integer('employee_cost').default(0), // employee-paid monthly cost (premium/deduction)
  currency: text('currency').notNull().default('NGN'),
  eligibility: text('eligibility').default('All Employees'),
  icon: text('icon').default('Shield'),
  color: text('color').default('indigo'),
  status: text('status').notNull().default('active'), // 'active' | 'inactive'
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').$onUpdate(() => new Date().toISOString()),
});

export const benefitPlansRelations = relations(benefitPlans, ({ one, many }) => ({
  company: one(companies, {
    fields: [benefitPlans.companyId],
    references: [companies.id],
  }),
  enrollments: many(benefitEnrollments),
}));

// Employee <-> plan enrollment.
export const benefitEnrollments = sqliteTable('benefit_enrollments', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id),
  employeeId: text('employee_id').notNull().references(() => employees.id),
  planId: text('plan_id').notNull().references(() => benefitPlans.id),
  coverageLevel: text('coverage_level').default('Individual'), // 'Individual' | 'Family'
  status: text('status').notNull().default('enrolled'), // 'enrolled' | 'waived' | 'cancelled'
  enrolledAt: text('enrolled_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  cancelledAt: text('cancelled_at'),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').$onUpdate(() => new Date().toISOString()),
});

export const benefitEnrollmentsRelations = relations(benefitEnrollments, ({ one }) => ({
  employee: one(employees, {
    fields: [benefitEnrollments.employeeId],
    references: [employees.id],
  }),
  plan: one(benefitPlans, {
    fields: [benefitEnrollments.planId],
    references: [benefitPlans.id],
  }),
}));

// Dependents an employee has added for family health/life coverage.
export const benefitDependents = sqliteTable('benefit_dependents', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id),
  employeeId: text('employee_id').notNull().references(() => employees.id),
  name: text('name').notNull(),
  relationship: text('relationship').notNull(), // 'Spouse' | 'Child' | 'Parent' | 'Other'
  dateOfBirth: text('date_of_birth'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const benefitDependentsRelations = relations(benefitDependents, ({ one }) => ({
  employee: one(employees, {
    fields: [benefitDependents.employeeId],
    references: [employees.id],
  }),
}));

// Admin-managed wellness programs / challenges.
export const wellnessPrograms = sqliteTable('wellness_programs', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category').notNull().default('fitness'), // 'fitness' | 'mental-health' | 'financial' | 'nutrition' | 'other'
  goalLabel: text('goal_label').default('Steps'), // unit label shown next to progress, e.g. 'Steps'
  goalTarget: integer('goal_target').default(0),
  startDate: text('start_date'),
  endDate: text('end_date'),
  status: text('status').notNull().default('active'), // 'active' | 'upcoming' | 'completed'
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').$onUpdate(() => new Date().toISOString()),
});

export const wellnessProgramsRelations = relations(wellnessPrograms, ({ one, many }) => ({
  company: one(companies, {
    fields: [wellnessPrograms.companyId],
    references: [companies.id],
  }),
  participants: many(wellnessParticipants),
}));

// Employees who joined a wellness program.
export const wellnessParticipants = sqliteTable('wellness_participants', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id),
  programId: text('program_id').notNull().references(() => wellnessPrograms.id),
  employeeId: text('employee_id').notNull().references(() => employees.id),
  progress: integer('progress').default(0),
  status: text('status').notNull().default('joined'), // 'joined' | 'completed' | 'dropped'
  joinedAt: text('joined_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').$onUpdate(() => new Date().toISOString()),
});

export const wellnessParticipantsRelations = relations(wellnessParticipants, ({ one }) => ({
  program: one(wellnessPrograms, {
    fields: [wellnessParticipants.programId],
    references: [wellnessPrograms.id],
  }),
  employee: one(employees, {
    fields: [wellnessParticipants.employeeId],
    references: [employees.id],
  }),
}));

// Health insurance reimbursement claims AND wellness-budget reimbursement
// requests share one review workflow (submit -> pending -> approved/rejected),
// distinguished by `kind`. Approved wellness claims post their amount to
// employeeBenefits.wellnessUsed (see BenefitsService.reviewClaim).
export const benefitClaims = sqliteTable('benefit_claims', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id),
  employeeId: text('employee_id').notNull().references(() => employees.id),
  kind: text('kind').notNull(), // 'health' | 'wellness'
  category: text('category').notNull(), // e.g. 'Consultation', 'Pharmacy', 'Gym Membership'
  provider: text('provider'), // hospital/vendor name
  amount: integer('amount').notNull(),
  description: text('description'),
  status: text('status').notNull().default('pending'), // 'pending' | 'approved' | 'rejected'
  submittedAt: text('submitted_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  reviewedById: text('reviewed_by_id'),
  reviewedByName: text('reviewed_by_name'),
  reviewedAt: text('reviewed_at'),
  reviewNotes: text('review_notes'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const benefitClaimsRelations = relations(benefitClaims, ({ one }) => ({
  employee: one(employees, {
    fields: [benefitClaims.employeeId],
    references: [employees.id],
  }),
}));
