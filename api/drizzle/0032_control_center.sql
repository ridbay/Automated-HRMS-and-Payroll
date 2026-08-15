-- Hand-written migration (same convention as 0029-0031 — drizzle-kit generate
-- is blocked by the pre-existing meta/snapshot collision noted in those
-- migrations' comments). Builds out the Org Setup / Control Center feature:
-- a real system-wide audit trail, company branding + working calendar,
-- notification preferences, public holidays, email templates, integrations,
-- and automation workflows.

-- Audit trail: who did what, in which module, from where. Previously the
-- table only carried action/details/actorName with no way to filter by
-- module or surface severity in the UI.
ALTER TABLE `audit_logs` ADD `module` text;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD `severity` text DEFAULT 'info' NOT NULL;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD `ip_address` text;--> statement-breakpoint

-- Company branding
ALTER TABLE `companies` ADD `logo_url` text;--> statement-breakpoint

-- Working calendar + notification preferences, alongside the existing
-- security/attendance policy fields on this same settings row.
ALTER TABLE `company_settings` ADD `working_days` text DEFAULT '[1,2,3,4,5]' NOT NULL;--> statement-breakpoint
ALTER TABLE `company_settings` ADD `notify_leave_requests` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `company_settings` ADD `notify_payroll_runs` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `company_settings` ADD `notify_new_hires` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `company_settings` ADD `notify_compliance_alerts` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `company_settings` ADD `notify_weekly_digest` integer DEFAULT 0 NOT NULL;--> statement-breakpoint

CREATE TABLE `public_holidays` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`date` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

CREATE TABLE `email_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`key` text NOT NULL,
	`name` text NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

CREATE TABLE `integrations` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`key` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`status` text DEFAULT 'available' NOT NULL,
	`connected_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

CREATE TABLE `workflows` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`key` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`steps` text NOT NULL,
	`enabled` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
