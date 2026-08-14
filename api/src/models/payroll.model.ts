import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';
import { companies } from './company.model';
import { employees } from './employee.model';

// One row per company. Governs pay cycle mechanics and the statutory rates
// used by the PAYE/pension engine in payroll.service.ts.
export const payrollSettings = sqliteTable('payroll_settings', {
  companyId: text('company_id').primaryKey().references(() => companies.id),
  payCycle: text('pay_cycle').notNull().default('monthly'), // 'monthly' | 'biweekly' | 'weekly'
  cutoffDay: integer('cutoff_day').notNull().default(20),
  paymentDay: integer('payment_day').notNull().default(25),
  workingDaysPerMonth: integer('working_days_per_month').notNull().default(22),
  prorationEnabled: integer('proration_enabled', { mode: 'boolean' }).notNull().default(true),
  minWageCheckEnabled: integer('min_wage_check_enabled', { mode: 'boolean' }).notNull().default(true),
  minWageAnnual: integer('min_wage_annual').notNull().default(360000), // Nigeria national minimum wage baseline
  pensionEmployeeRate: real('pension_employee_rate').notNull().default(8), // % of basic+housing+transport
  pensionEmployerRate: real('pension_employer_rate').notNull().default(10),
  applyConsolidatedReliefAllowance: integer('apply_cra', { mode: 'boolean' }).notNull().default(true),
  currency: text('currency').notNull().default('NGN'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').$onUpdate(() => new Date().toISOString()),
});

// Progressive PAYE bands. Seeded with Nigeria's statutory bands but fully
// editable per company from the Compliance tab.
export const taxBrackets = sqliteTable('tax_brackets', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id),
  minIncome: integer('min_income').notNull(), // annual, inclusive
  maxIncome: integer('max_income'), // annual, inclusive; null = no upper bound
  ratePercent: real('rate_percent').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').$onUpdate(() => new Date().toISOString()),
});

// Reusable earning/deduction line definitions surfaced in Salary Setup and
// used to describe the composition of `previewRun`'s computed payslips.
export const salaryComponents = sqliteTable('salary_components', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'earning' | 'deduction'
  calculationType: text('calculation_type').notNull().default('fixed'), // 'fixed' | 'percentage_of_basic' | 'percentage_of_gross'
  value: real('value').notNull().default(0), // amount (fixed) or percent (percentage_*)
  taxable: integer('taxable', { mode: 'boolean' }).notNull().default(true),
  statutory: integer('statutory', { mode: 'boolean' }).notNull().default(false), // system-managed, cannot be deleted
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').$onUpdate(() => new Date().toISOString()),
});

export const payGrades = sqliteTable('pay_grades', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id),
  name: text('name').notNull(),
  level: integer('level').notNull().default(1),
  minSalary: integer('min_salary').notNull().default(0),
  maxSalary: integer('max_salary').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').$onUpdate(() => new Date().toISOString()),
});

export const loans = sqliteTable('loans', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id),
  employeeId: text('employee_id').notNull().references(() => employees.id),
  principal: integer('principal').notNull(),
  interestRatePercent: real('interest_rate_percent').notNull().default(0),
  durationMonths: integer('duration_months').notNull(),
  monthlyInstallment: integer('monthly_installment').notNull(),
  remainingBalance: integer('remaining_balance').notNull(),
  status: text('status').notNull().default('active'), // 'active' | 'completed' | 'paused' | 'cancelled'
  purpose: text('purpose'),
  startDate: text('start_date').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').$onUpdate(() => new Date().toISOString()),
});

export const loanRepayments = sqliteTable('loan_repayments', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id),
  loanId: text('loan_id').notNull().references(() => loans.id),
  payrollRunId: text('payroll_run_id'),
  amount: integer('amount').notNull(),
  balanceAfter: integer('balance_after').notNull(),
  paidAt: text('paid_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Statutory remittances (PAYE, pension, etc.) generated automatically when a
// payroll run is marked paid, and tracked to completion from the Compliance tab.
export const complianceTasks = sqliteTable('compliance_tasks', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id),
  payrollRunId: text('payroll_run_id'),
  title: text('title').notNull(),
  type: text('type').notNull(), // 'tax' | 'pension' | 'other'
  dueDate: text('due_date').notNull(),
  amount: integer('amount').notNull().default(0),
  status: text('status').notNull().default('pending'), // 'pending' | 'completed'
  reference: text('reference'),
  completedAt: text('completed_at'),
  completedBy: text('completed_by'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').$onUpdate(() => new Date().toISOString()),
});

export const payrollRuns = sqliteTable('payroll_runs', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id),
  periodMonth: integer('period_month').notNull(),
  periodYear: integer('period_year').notNull(),
  // 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'paid'
  status: text('status').notNull().default('draft'),
  totalGross: integer('total_gross').notNull().default(0),
  totalNet: integer('total_net').notNull().default(0),
  totalTaxes: integer('total_taxes').notNull().default(0),
  totalPension: integer('total_pension').notNull().default(0),
  totalLoanDeductions: integer('total_loan_deductions').notNull().default(0),
  employeeCount: integer('employee_count').notNull().default(0),
  dueDate: text('due_date'),
  submittedBy: text('submitted_by'),
  submittedAt: text('submitted_at'),
  approvedBy: text('approved_by'),
  approvedAt: text('approved_at'),
  rejectedReason: text('rejected_reason'),
  paidAt: text('paid_at'),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).$onUpdate(() => new Date().toISOString()),
});

export const payslips = sqliteTable('payslips', {
  id: text('id').primaryKey(),
  runId: text('run_id').notNull().references(() => payrollRuns.id),
  employeeId: text('employee_id').notNull().references(() => employees.id),
  // Snapshots so historical payslips stay accurate even if the employee record changes later.
  employeeName: text('employee_name'),
  department: text('department'),
  bankName: text('bank_name'),
  accountNumber: text('account_number'),
  accountName: text('account_name'),
  basicSalary: integer('basic_salary').notNull().default(0),
  allowances: integer('allowances').notNull().default(0),
  bonuses: integer('bonuses').notNull().default(0),
  grossPay: integer('gross_pay').notNull().default(0),
  taxDeductions: integer('tax_deductions').notNull().default(0),
  pensionDeductions: integer('pension_deductions').notNull().default(0),
  loanDeductions: integer('loan_deductions').notNull().default(0),
  otherDeductions: integer('other_deductions').notNull().default(0),
  netPay: integer('net_pay').notNull().default(0),
  isProrated: integer('is_prorated', { mode: 'boolean' }).notNull().default(false),
  workingDays: integer('working_days'),
  presentDays: integer('present_days'),
  absentDays: integer('absent_days'),
  overtimeHours: real('overtime_hours'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').$onUpdate(() => new Date().toISOString()),
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

export const loansRelations = relations(loans, ({ one, many }) => ({
  employee: one(employees, {
    fields: [loans.employeeId],
    references: [employees.id],
  }),
  repayments: many(loanRepayments),
}));

export const loanRepaymentsRelations = relations(loanRepayments, ({ one }) => ({
  loan: one(loans, {
    fields: [loanRepayments.loanId],
    references: [loans.id],
  }),
}));
