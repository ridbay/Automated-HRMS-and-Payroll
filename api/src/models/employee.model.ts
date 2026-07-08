import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const employees = sqliteTable('employees', {
  id: text('id').primaryKey(),
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
});
