CREATE TABLE `companies` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`subdomain` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `companies_subdomain_unique` ON `companies` (`subdomain`);--> statement-breakpoint
ALTER TABLE `attendance_records` ADD `company_id` text NOT NULL REFERENCES companies(id);--> statement-breakpoint
ALTER TABLE `employees` ADD `company_id` text NOT NULL REFERENCES companies(id);--> statement-breakpoint
ALTER TABLE `job_requisitions` ADD `company_id` text NOT NULL REFERENCES companies(id);--> statement-breakpoint
ALTER TABLE `leave_requests` ADD `company_id` text NOT NULL REFERENCES companies(id);--> statement-breakpoint
ALTER TABLE `wallet_transactions` ADD `company_id` text NOT NULL REFERENCES companies(id);