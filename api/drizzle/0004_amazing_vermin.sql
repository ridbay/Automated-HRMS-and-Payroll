CREATE TABLE `payroll_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`period_month` integer NOT NULL,
	`period_year` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`total_gross` integer DEFAULT 0 NOT NULL,
	`total_net` integer DEFAULT 0 NOT NULL,
	`total_taxes` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `payslips` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`employee_id` text NOT NULL,
	`basic_salary` integer DEFAULT 0 NOT NULL,
	`allowances` integer DEFAULT 0 NOT NULL,
	`gross_pay` integer DEFAULT 0 NOT NULL,
	`tax_deductions` integer DEFAULT 0 NOT NULL,
	`pension_deductions` integer DEFAULT 0 NOT NULL,
	`net_pay` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`run_id`) REFERENCES `payroll_runs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
