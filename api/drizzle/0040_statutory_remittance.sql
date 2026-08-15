ALTER TABLE `payroll_settings` ADD `nhf_enabled` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `payroll_settings` ADD `nhf_rate` real DEFAULT 2.5 NOT NULL;--> statement-breakpoint
ALTER TABLE `payroll_settings` ADD `nsitf_enabled` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `payroll_settings` ADD `nsitf_rate` real DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `payroll_settings` ADD `itf_enabled` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `payroll_settings` ADD `itf_rate` real DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `payroll_runs` ADD `total_nhf` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `payroll_runs` ADD `total_nsitf` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `payroll_runs` ADD `total_itf` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `payslips` ADD `nhf_deductions` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `payslips` ADD `nsitf_contribution` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `payslips` ADD `itf_contribution` integer DEFAULT 0 NOT NULL;
