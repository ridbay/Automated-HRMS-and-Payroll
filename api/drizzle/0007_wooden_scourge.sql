ALTER TABLE `companies` ADD `updated_at` text;--> statement-breakpoint
ALTER TABLE `emergency_contacts` ADD `updated_at` text;--> statement-breakpoint
ALTER TABLE `employees` ADD `updated_at` text;--> statement-breakpoint
ALTER TABLE `attendance_records` ADD `updated_at` text;--> statement-breakpoint
ALTER TABLE `leave_requests` ADD `manager_id` text;--> statement-breakpoint
ALTER TABLE `leave_requests` ADD `manager_comment` text;--> statement-breakpoint
ALTER TABLE `leave_requests` ADD `updated_at` text;--> statement-breakpoint
ALTER TABLE `job_requisitions` ADD `updated_at` text;--> statement-breakpoint
ALTER TABLE `wallet_transactions` ADD `updated_at` text;--> statement-breakpoint
ALTER TABLE `payroll_runs` ADD `updated_at` text DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `payslips` ADD `updated_at` text;--> statement-breakpoint
ALTER TABLE `api_keys` ADD `updated_at` text;--> statement-breakpoint
ALTER TABLE `departments` ADD `updated_at` text;--> statement-breakpoint
ALTER TABLE `locations` ADD `updated_at` text;--> statement-breakpoint
ALTER TABLE `roles` ADD `updated_at` text;