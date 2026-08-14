CREATE TABLE `compliance_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`payroll_run_id` text,
	`title` text NOT NULL,
	`type` text NOT NULL,
	`due_date` text NOT NULL,
	`amount` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`reference` text,
	`completed_at` text,
	`completed_by` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `loan_repayments` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`loan_id` text NOT NULL,
	`payroll_run_id` text,
	`amount` integer NOT NULL,
	`balance_after` integer NOT NULL,
	`paid_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`loan_id`) REFERENCES `loans`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `loans` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`employee_id` text NOT NULL,
	`principal` integer NOT NULL,
	`interest_rate_percent` real DEFAULT 0 NOT NULL,
	`duration_months` integer NOT NULL,
	`monthly_installment` integer NOT NULL,
	`remaining_balance` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`purpose` text,
	`start_date` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `pay_grades` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`level` integer DEFAULT 1 NOT NULL,
	`min_salary` integer DEFAULT 0 NOT NULL,
	`max_salary` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `payroll_settings` (
	`company_id` text PRIMARY KEY NOT NULL,
	`pay_cycle` text DEFAULT 'monthly' NOT NULL,
	`cutoff_day` integer DEFAULT 20 NOT NULL,
	`payment_day` integer DEFAULT 25 NOT NULL,
	`working_days_per_month` integer DEFAULT 22 NOT NULL,
	`proration_enabled` integer DEFAULT true NOT NULL,
	`min_wage_check_enabled` integer DEFAULT true NOT NULL,
	`min_wage_annual` integer DEFAULT 360000 NOT NULL,
	`pension_employee_rate` real DEFAULT 8 NOT NULL,
	`pension_employer_rate` real DEFAULT 10 NOT NULL,
	`apply_cra` integer DEFAULT true NOT NULL,
	`currency` text DEFAULT 'NGN' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `salary_components` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`calculation_type` text DEFAULT 'fixed' NOT NULL,
	`value` real DEFAULT 0 NOT NULL,
	`taxable` integer DEFAULT true NOT NULL,
	`statutory` integer DEFAULT false NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tax_brackets` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`min_income` integer NOT NULL,
	`max_income` integer,
	`rate_percent` real NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `payroll_runs` ADD `total_pension` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `payroll_runs` ADD `total_loan_deductions` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `payroll_runs` ADD `employee_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `payroll_runs` ADD `due_date` text;--> statement-breakpoint
ALTER TABLE `payroll_runs` ADD `submitted_by` text;--> statement-breakpoint
ALTER TABLE `payroll_runs` ADD `submitted_at` text;--> statement-breakpoint
ALTER TABLE `payroll_runs` ADD `approved_by` text;--> statement-breakpoint
ALTER TABLE `payroll_runs` ADD `approved_at` text;--> statement-breakpoint
ALTER TABLE `payroll_runs` ADD `rejected_reason` text;--> statement-breakpoint
ALTER TABLE `payroll_runs` ADD `paid_at` text;--> statement-breakpoint
ALTER TABLE `payroll_runs` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `payslips` ADD `employee_name` text;--> statement-breakpoint
ALTER TABLE `payslips` ADD `department` text;--> statement-breakpoint
ALTER TABLE `payslips` ADD `bank_name` text;--> statement-breakpoint
ALTER TABLE `payslips` ADD `account_number` text;--> statement-breakpoint
ALTER TABLE `payslips` ADD `account_name` text;--> statement-breakpoint
ALTER TABLE `payslips` ADD `bonuses` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `payslips` ADD `loan_deductions` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `payslips` ADD `other_deductions` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `payslips` ADD `is_prorated` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `payslips` ADD `working_days` integer;--> statement-breakpoint
ALTER TABLE `payslips` ADD `present_days` integer;--> statement-breakpoint
ALTER TABLE `payslips` ADD `absent_days` integer;--> statement-breakpoint
ALTER TABLE `payslips` ADD `overtime_hours` real;