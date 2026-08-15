CREATE TABLE `benefit_claims` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`employee_id` text NOT NULL,
	`kind` text NOT NULL,
	`category` text NOT NULL,
	`provider` text,
	`amount` integer NOT NULL,
	`description` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`submitted_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`reviewed_by_id` text,
	`reviewed_by_name` text,
	`reviewed_at` text,
	`review_notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `benefit_dependents` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`employee_id` text NOT NULL,
	`name` text NOT NULL,
	`relationship` text NOT NULL,
	`date_of_birth` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `benefit_enrollments` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`employee_id` text NOT NULL,
	`plan_id` text NOT NULL,
	`coverage_level` text DEFAULT 'Individual',
	`status` text DEFAULT 'enrolled' NOT NULL,
	`enrolled_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`cancelled_at` text,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`plan_id`) REFERENCES `benefit_plans`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `benefit_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`provider` text,
	`plan_tier` text,
	`description` text,
	`highlights` text,
	`coverage_limit` integer DEFAULT 0,
	`employer_cost` integer DEFAULT 0,
	`employee_cost` integer DEFAULT 0,
	`currency` text DEFAULT 'NGN' NOT NULL,
	`eligibility` text DEFAULT 'All Employees',
	`icon` text DEFAULT 'Shield',
	`color` text DEFAULT 'indigo',
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `wellness_participants` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`program_id` text NOT NULL,
	`employee_id` text NOT NULL,
	`progress` integer DEFAULT 0,
	`status` text DEFAULT 'joined' NOT NULL,
	`joined_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`program_id`) REFERENCES `wellness_programs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `wellness_programs` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`category` text DEFAULT 'fitness' NOT NULL,
	`goal_label` text DEFAULT 'Steps',
	`goal_target` integer DEFAULT 0,
	`start_date` text,
	`end_date` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `review_cycles` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'upcoming' NOT NULL,
	`start_date` text,
	`end_date` text,
	`self_review_due_date` text,
	`manager_review_due_date` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
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
--> statement-breakpoint
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
ALTER TABLE `feedbacks` ADD `to_employee_id` text;--> statement-breakpoint
ALTER TABLE `goals` ADD `scope` text DEFAULT 'individual' NOT NULL;--> statement-breakpoint
ALTER TABLE `goals` ADD `assigned_by_id` text;--> statement-breakpoint
ALTER TABLE `goals` ADD `parent_goal_id` text;--> statement-breakpoint
ALTER TABLE `assessments` ADD `cycle_id` text;