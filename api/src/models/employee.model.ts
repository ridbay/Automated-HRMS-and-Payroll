import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';
import { companies } from './company.model';

export const employees = sqliteTable('employees', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id),
  name: text('name').notNull(),
  middleName: text('middle_name'),
  lastName: text('last_name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  dob: text('dob'),
  gender: text('gender'),
  nationality: text('nationality'),
  maritalStatus: text('marital_status'),
  role: text('role'),
  department: text('department'),
  location: text('location'),
  employmentType: text('employment_type'), // 'Full-time' | 'Contract' | etc.
  status: text('status').notNull().default('onboarding'), // 'active' | 'onboarding' | etc.
  salary: integer('salary'),
  avatar: text('avatar'),
  baseSalary: integer('base_salary'),
  hireDate: text('hire_date'),
  probationEnd: text('probation_end'),
  managerId: text('manager_id'),
  managerName: text('manager_name'),
  workEmail: text('work_email'),
  performanceRating: real('performance_rating'),
  
  // Tax & Statutory
  tin: text('tin'),
  pfa: text('pfa'),
  pensionId: text('pension_id'),
  nin: text('nin'),
  nhf: text('nhf'),
  taxState: text('tax_state'),
  
  // Banking & Payout
  bankName: text('bank_name'),
  accountNumber: text('account_number'),
  accountName: text('account_name'),
  secondaryBankName: text('secondary_bank_name'),
  secondaryAccountNumber: text('secondary_account_number'),
  secondaryAccountName: text('secondary_account_name'),
  payoutMethod: text('payout_method'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').$onUpdate(() => new Date().toISOString()),
});

export const emergencyContacts = sqliteTable('emergency_contacts', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id),
  employeeId: text('employee_id').notNull().references(() => employees.id),
  name: text('name').notNull(),
  relationship: text('relationship').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  isPrimary: integer('is_primary', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').$onUpdate(() => new Date().toISOString()),
});

export const employeesRelations = relations(employees, ({ many }) => ({
  emergencyContacts: many(emergencyContacts),
  employeeDocuments: many(employeeDocuments),
}));

export const emergencyContactsRelations = relations(emergencyContacts, ({ one }) => ({
  employee: one(employees, {
    fields: [emergencyContacts.employeeId],
    references: [employees.id],
  }),
}));

export const employeeDocuments = sqliteTable('employee_documents', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id),
  employeeId: text('employee_id').notNull().references(() => employees.id),
  name: text('name').notNull(),
  type: text('type').notNull(),
  fileKey: text('file_key').notNull(),
  status: text('status').notNull().default('Active'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').$onUpdate(() => new Date().toISOString()),
});

export const employeeDocumentsRelations = relations(employeeDocuments, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeDocuments.employeeId],
    references: [employees.id],
  }),
}));
