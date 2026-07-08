CREATE TABLE `employee_benefits` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`employee_id` text NOT NULL,
	`health_provider` text,
	`health_plan` text,
	`health_coverage` text,
	`health_premium` integer DEFAULT 0,
	`retirement_plan` text,
	`retirement_balance` integer DEFAULT 0,
	`retirement_contribution_rate` real DEFAULT 0,
	`employer_match_rate` real DEFAULT 0,
	`equity_granted` integer DEFAULT 0,
	`equity_vested` integer DEFAULT 0,
	`equity_value` integer DEFAULT 0,
	`wellness_budget` integer DEFAULT 0,
	`wellness_used` integer DEFAULT 0,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `employee_benefits_employee_id_unique` ON `employee_benefits` (`employee_id`);