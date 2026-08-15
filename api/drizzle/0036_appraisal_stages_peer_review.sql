-- Stage-gated cycle timeline, 360 (peer + upward) reviews, and KPI evidence
-- attachments for the appraisal workflow.
CREATE TABLE `cycle_stages` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`cycle_id` text NOT NULL,
	`key` text NOT NULL,
	`name` text NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`start_date` text,
	`due_date` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `peer_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`cycle_id` text NOT NULL,
	`reviewee_id` text NOT NULL,
	`reviewer_id` text NOT NULL,
	`direction` text NOT NULL,
	`status` text DEFAULT 'nominated' NOT NULL,
	`rating` text,
	`strengths` text,
	`improvements` text,
	`comment` text,
	`nominated_by_id` text,
	`approved_by_id` text,
	`approved_at` text,
	`submitted_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE `employee_documents` ADD `linked_assessment_id` text;
