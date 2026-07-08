import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
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
  role: text('role').notNull(),
  department: text('department').notNull(),
  location: text('location'),
  employmentType: text('employment_type').notNull(), // 'Full-time' | 'Contract' | etc.
  status: text('status').notNull(), // 'active' | 'onboarding' | etc.
  salary: integer('salary').notNull(),
  avatar: text('avatar'),
  baseSalary: integer('base_salary'),
  hireDate: text('hire_date').notNull(),
  probationEnd: text('probation_end'),
  managerId: text('manager_id'),
  managerName: text('manager_name'),
  workEmail: text('work_email'),
  performanceRating: real('performance_rating'),
  
  // Tax & Statutory
  tin: text('tin'),
  pfa: text('pfa'),
  pensionId: text('pension_id'),
  
  // Banking & Payout
  bankName: text('bank_name'),
  accountNumber: text('account_number'),
  accountName: text('account_name'),
  payoutMethod: text('payout_method'),
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
});
