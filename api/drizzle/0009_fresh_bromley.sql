PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_companies` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`subdomain` text,
	`registration_number` text,
	`industry` text,
	`fiscal_year_start` text,
	`address` text,
	`support_email` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text
);
--> statement-breakpoint
INSERT INTO `__new_companies`("id", "name", "subdomain", "registration_number", "industry", "fiscal_year_start", "address", "support_email", "created_at", "updated_at") SELECT "id", "name", "subdomain", "registration_number", "industry", "fiscal_year_start", "address", "support_email", "created_at", "updated_at" FROM `companies`;--> statement-breakpoint
DROP TABLE `companies`;--> statement-breakpoint
ALTER TABLE `__new_companies` RENAME TO `companies`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `companies_subdomain_unique` ON `companies` (`subdomain`);--> statement-breakpoint
CREATE TABLE `__new_emergency_contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`employee_id` text NOT NULL,
	`name` text NOT NULL,
	`relationship` text NOT NULL,
	`phone` text NOT NULL,
	`email` text,
	`is_primary` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_emergency_contacts`("id", "company_id", "employee_id", "name", "relationship", "phone", "email", "is_primary", "created_at", "updated_at") SELECT "id", "company_id", "employee_id", "name", "relationship", "phone", "email", "is_primary", "created_at", "updated_at" FROM `emergency_contacts`;--> statement-breakpoint
DROP TABLE `emergency_contacts`;--> statement-breakpoint
ALTER TABLE `__new_emergency_contacts` RENAME TO `emergency_contacts`;--> statement-breakpoint
CREATE TABLE `__new_employees` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`middle_name` text,
	`last_name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`dob` text,
	`gender` text,
	`nationality` text,
	`marital_status` text,
	`role` text,
	`department` text,
	`location` text,
	`employment_type` text,
	`status` text DEFAULT 'onboarding' NOT NULL,
	`salary` integer,
	`avatar` text,
	`base_salary` integer,
	`hire_date` text,
	`probation_end` text,
	`manager_id` text,
	`manager_name` text,
	`work_email` text,
	`performance_rating` real,
	`tin` text,
	`pfa` text,
	`pension_id` text,
	`bank_name` text,
	`account_number` text,
	`account_name` text,
	`payout_method` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_employees`("id", "company_id", "name", "middle_name", "last_name", "email", "phone", "dob", "gender", "nationality", "marital_status", "role", "department", "location", "employment_type", "status", "salary", "avatar", "base_salary", "hire_date", "probation_end", "manager_id", "manager_name", "work_email", "performance_rating", "tin", "pfa", "pension_id", "bank_name", "account_number", "account_name", "payout_method", "created_at", "updated_at") SELECT "id", "company_id", "name", "middle_name", "last_name", "email", "phone", "dob", "gender", "nationality", "marital_status", "role", "department", "location", "employment_type", "status", "salary", "avatar", "base_salary", "hire_date", "probation_end", "manager_id", "manager_name", "work_email", "performance_rating", "tin", "pfa", "pension_id", "bank_name", "account_number", "account_name", "payout_method", "created_at", "updated_at" FROM `employees`;--> statement-breakpoint
DROP TABLE `employees`;--> statement-breakpoint
ALTER TABLE `__new_employees` RENAME TO `employees`;--> statement-breakpoint
CREATE UNIQUE INDEX `employees_email_unique` ON `employees` (`email`);--> statement-breakpoint
CREATE TABLE `__new_attendance_records` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`employee_id` text NOT NULL,
	`date` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`clock_in` text NOT NULL,
	`clock_out` text,
	`status` text NOT NULL,
	`location_in` text,
	`location_out` text,
	`work_hours` real NOT NULL,
	`overtime` real NOT NULL,
	`notes` text,
	`updated_at` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_attendance_records`("id", "company_id", "employee_id", "date", "created_at", "clock_in", "clock_out", "status", "location_in", "location_out", "work_hours", "overtime", "notes", "updated_at") SELECT "id", "company_id", "employee_id", "date", "created_at", "clock_in", "clock_out", "status", "location_in", "location_out", "work_hours", "overtime", "notes", "updated_at" FROM `attendance_records`;--> statement-breakpoint
DROP TABLE `attendance_records`;--> statement-breakpoint
ALTER TABLE `__new_attendance_records` RENAME TO `attendance_records`;--> statement-breakpoint
CREATE TABLE `__new_leave_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`employee_id` text NOT NULL,
	`type` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`days` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`reason` text NOT NULL,
	`manager_id` text,
	`manager_comment` text,
	`status` text NOT NULL,
	`attachment` text,
	`applied_on` text NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_leave_requests`("id", "company_id", "employee_id", "type", "start_date", "end_date", "days", "created_at", "reason", "manager_id", "manager_comment", "status", "attachment", "applied_on", "updated_at") SELECT "id", "company_id", "employee_id", "type", "start_date", "end_date", "days", "created_at", "reason", "manager_id", "manager_comment", "status", "attachment", "applied_on", "updated_at" FROM `leave_requests`;--> statement-breakpoint
DROP TABLE `leave_requests`;--> statement-breakpoint
ALTER TABLE `__new_leave_requests` RENAME TO `leave_requests`;--> statement-breakpoint
CREATE TABLE `__new_job_requisitions` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`title` text NOT NULL,
	`department` text NOT NULL,
	`location` text NOT NULL,
	`hiring_manager` text NOT NULL,
	`manager_avatar` text,
	`priority` text NOT NULL,
	`status` text NOT NULL,
	`date_opened` text NOT NULL,
	`target_hire_date` text NOT NULL,
	`days_open` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_job_requisitions`("id", "company_id", "title", "department", "location", "hiring_manager", "manager_avatar", "priority", "status", "date_opened", "target_hire_date", "days_open", "created_at", "updated_at") SELECT "id", "company_id", "title", "department", "location", "hiring_manager", "manager_avatar", "priority", "status", "date_opened", "target_hire_date", "days_open", "created_at", "updated_at" FROM `job_requisitions`;--> statement-breakpoint
DROP TABLE `job_requisitions`;--> statement-breakpoint
ALTER TABLE `__new_job_requisitions` RENAME TO `job_requisitions`;--> statement-breakpoint
CREATE TABLE `__new_wallet_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`type` text NOT NULL,
	`amount` integer NOT NULL,
	`description` text NOT NULL,
	`timestamp` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_wallet_transactions`("id", "company_id", "type", "amount", "description", "timestamp", "status", "created_at", "updated_at") SELECT "id", "company_id", "type", "amount", "description", "timestamp", "status", "created_at", "updated_at" FROM `wallet_transactions`;--> statement-breakpoint
DROP TABLE `wallet_transactions`;--> statement-breakpoint
ALTER TABLE `__new_wallet_transactions` RENAME TO `wallet_transactions`;--> statement-breakpoint
CREATE TABLE `__new_payroll_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`period_month` integer NOT NULL,
	`period_year` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`total_gross` integer DEFAULT 0 NOT NULL,
	`total_net` integer DEFAULT 0 NOT NULL,
	`total_taxes` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_payroll_runs`("id", "company_id", "period_month", "period_year", "status", "total_gross", "total_net", "total_taxes", "created_at", "updated_at") SELECT "id", "company_id", "period_month", "period_year", "status", "total_gross", "total_net", "total_taxes", "created_at", "updated_at" FROM `payroll_runs`;--> statement-breakpoint
DROP TABLE `payroll_runs`;--> statement-breakpoint
ALTER TABLE `__new_payroll_runs` RENAME TO `payroll_runs`;--> statement-breakpoint
CREATE TABLE `__new_payslips` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`employee_id` text NOT NULL,
	`basic_salary` integer DEFAULT 0 NOT NULL,
	`allowances` integer DEFAULT 0 NOT NULL,
	`gross_pay` integer DEFAULT 0 NOT NULL,
	`tax_deductions` integer DEFAULT 0 NOT NULL,
	`pension_deductions` integer DEFAULT 0 NOT NULL,
	`net_pay` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`run_id`) REFERENCES `payroll_runs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_payslips`("id", "run_id", "employee_id", "basic_salary", "allowances", "gross_pay", "tax_deductions", "pension_deductions", "net_pay", "created_at", "updated_at") SELECT "id", "run_id", "employee_id", "basic_salary", "allowances", "gross_pay", "tax_deductions", "pension_deductions", "net_pay", "created_at", "updated_at" FROM `payslips`;--> statement-breakpoint
DROP TABLE `payslips`;--> statement-breakpoint
ALTER TABLE `__new_payslips` RENAME TO `payslips`;--> statement-breakpoint
CREATE TABLE `__new_api_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`key` text NOT NULL,
	`last_used_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_api_keys`("id", "company_id", "name", "key", "last_used_at", "created_at", "updated_at") SELECT "id", "company_id", "name", "key", "last_used_at", "created_at", "updated_at" FROM `api_keys`;--> statement-breakpoint
DROP TABLE `api_keys`;--> statement-breakpoint
ALTER TABLE `__new_api_keys` RENAME TO `api_keys`;--> statement-breakpoint
CREATE TABLE `__new_departments` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`head_count` integer DEFAULT 0,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_departments`("id", "company_id", "name", "description", "head_count", "created_at", "updated_at") SELECT "id", "company_id", "name", "description", "head_count", "created_at", "updated_at" FROM `departments`;--> statement-breakpoint
DROP TABLE `departments`;--> statement-breakpoint
ALTER TABLE `__new_departments` RENAME TO `departments`;--> statement-breakpoint
CREATE TABLE `__new_locations` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`address` text NOT NULL,
	`city` text,
	`country` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_locations`("id", "company_id", "name", "address", "city", "country", "created_at", "updated_at") SELECT "id", "company_id", "name", "address", "city", "country", "created_at", "updated_at" FROM `locations`;--> statement-breakpoint
DROP TABLE `locations`;--> statement-breakpoint
ALTER TABLE `__new_locations` RENAME TO `locations`;--> statement-breakpoint
CREATE TABLE `__new_roles` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`permissions` text NOT NULL,
	`users_count` integer DEFAULT 0,
	`color` text DEFAULT 'slate',
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_roles`("id", "company_id", "name", "description", "permissions", "users_count", "color", "created_at", "updated_at") SELECT "id", "company_id", "name", "description", "permissions", "users_count", "color", "created_at", "updated_at" FROM `roles`;--> statement-breakpoint
DROP TABLE `roles`;--> statement-breakpoint
ALTER TABLE `__new_roles` RENAME TO `roles`;