PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_payroll_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`period_month` integer NOT NULL,
	`period_year` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`total_gross` integer DEFAULT 0 NOT NULL,
	`total_net` integer DEFAULT 0 NOT NULL,
	`total_taxes` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_payroll_runs`("id", "company_id", "period_month", "period_year", "status", "total_gross", "total_net", "total_taxes", "created_at", "updated_at") SELECT "id", "company_id", "period_month", "period_year", "status", "total_gross", "total_net", "total_taxes", "created_at", "updated_at" FROM `payroll_runs`;--> statement-breakpoint
DROP TABLE `payroll_runs`;--> statement-breakpoint
ALTER TABLE `__new_payroll_runs` RENAME TO `payroll_runs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `emergency_contacts` ADD `created_at` text NOT NULL;--> statement-breakpoint
ALTER TABLE `employees` ADD `created_at` text NOT NULL;--> statement-breakpoint
ALTER TABLE `attendance_records` ADD `created_at` text NOT NULL;--> statement-breakpoint
ALTER TABLE `leave_requests` ADD `created_at` text NOT NULL;--> statement-breakpoint
ALTER TABLE `job_requisitions` ADD `created_at` text NOT NULL;--> statement-breakpoint
ALTER TABLE `wallet_transactions` ADD `created_at` text NOT NULL;--> statement-breakpoint
ALTER TABLE `payslips` ADD `created_at` text NOT NULL;