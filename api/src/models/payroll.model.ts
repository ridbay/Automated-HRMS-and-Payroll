import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';
import { companies } from './company.model';
import { employees } from './employee.model';

export const payrollRuns = sqliteTable('payroll_runs', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id),
  periodMonth: integer('period_month').notNull(),
  periodYear: integer('period_year').notNull(),
  status: text('status').notNull().default('draft'), // 'draft', 'locked', 'paid'
  totalGross: integer('total_gross').notNull().default(0),
  totalNet: integer('total_net').notNull().default(0),
  totalTaxes: integer('total_taxes').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const payslips = sqliteTable('payslips', {
  id: text('id').primaryKey(),
  runId: text('run_id').notNull().references(() => payrollRuns.id),
  employeeId: text('employee_id').notNull().references(() => employees.id),
  basicSalary: integer('basic_salary').notNull().default(0),
  allowances: integer('allowances').notNull().default(0),
  grossPay: integer('gross_pay').notNull().default(0),
  taxDeductions: integer('tax_deductions').notNull().default(0),
  pensionDeductions: integer('pension_deductions').notNull().default(0),
  netPay: integer('net_pay').notNull().default(0),
});

export const payrollRunsRelations = relations(payrollRuns, ({ many }) => ({
  payslips: many(payslips),
}));

export const payslipsRelations = relations(payslips, ({ one }) => ({
  payrollRun: one(payrollRuns, {
    fields: [payslips.runId],
    references: [payrollRuns.id],
  }),
  employee: one(employees, {
    fields: [payslips.employeeId],
    references: [employees.id],
  }),
}));
