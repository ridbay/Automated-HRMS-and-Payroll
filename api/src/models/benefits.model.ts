import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';
import { companies } from './company.model';
import { employees } from './employee.model';

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
