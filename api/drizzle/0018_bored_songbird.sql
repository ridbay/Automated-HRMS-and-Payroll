CREATE TABLE `feedbacks` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`from_employee_id` text NOT NULL,
	`to_employee_name` text NOT NULL,
	`type` text NOT NULL,
	`message` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`employee_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`priority` text DEFAULT 'medium' NOT NULL,
	`status` text DEFAULT 'on_track' NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`due_date` text,
	`key_results` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `assessments` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`employee_id` text NOT NULL,
	`cycle_name` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`achievements` text DEFAULT '[]' NOT NULL,
	`challenges` text DEFAULT '[]' NOT NULL,
	`goals_progress` text DEFAULT '[]' NOT NULL,
	`skill_ratings` text DEFAULT '[]' NOT NULL,
	`self_rating` text,
	`self_comment` text,
	`development_goals` text DEFAULT '[]' NOT NULL,
	`manager_rating` text,
	`manager_comment` text,
	`manager_id` text,
	`reviewed_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`submitted_at` text
);
