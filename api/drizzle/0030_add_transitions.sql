-- Hand-written migration (drizzle-kit generate is currently blocked by a
-- pre-existing meta/snapshot collision between 0027 and 0028 — see those
-- migrations' comments — so this follows the same hand-written convention).
-- Adds the Transitions feature: onboarding/offboarding journeys per employee
-- plus their checklist tasks.
CREATE TABLE `transitions` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`employee_id` text NOT NULL,
	`type` text NOT NULL,
	`stage` text NOT NULL,
	`status` text DEFAULT 'Active' NOT NULL,
	`start_date` text NOT NULL,
	`target_date` text,
	`reason` text,
	`handover_to_id` text,
	`handover_to_name` text,
	`exit_interview_scheduled` integer DEFAULT false,
	`initiated_by_id` text,
	`initiated_by_name` text,
	`completed_at` text,
	`cancelled_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `transition_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`transition_id` text NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`assigned_to` text,
	`due_date` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`completed_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`transition_id`) REFERENCES `transitions`(`id`) ON UPDATE no action ON DELETE no action
);
