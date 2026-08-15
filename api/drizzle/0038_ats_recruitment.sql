CREATE TABLE `candidates` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`requisition_id` text,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`location` text,
	`current_title` text,
	`current_employer` text,
	`experience_years` real,
	`education` text,
	`skills` text DEFAULT '[]',
	`source` text DEFAULT 'Career Page' NOT NULL,
	`salary_expectation` text,
	`linkedin_url` text,
	`github_url` text,
	`portfolio_url` text,
	`cover_letter` text,
	`resume_file_key` text,
	`rating` real,
	`status` text DEFAULT 'applied' NOT NULL,
	`applied_date` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`requisition_id`) REFERENCES `job_requisitions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `candidate_timeline_events` (
	`id` text PRIMARY KEY NOT NULL,
	`candidate_id` text NOT NULL,
	`company_id` text NOT NULL,
	`event` text NOT NULL,
	`note` text,
	`actor_id` text,
	`actor_name` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `interviews` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`candidate_id` text NOT NULL,
	`requisition_id` text,
	`type` text NOT NULL,
	`stage` text NOT NULL,
	`date_time` text NOT NULL,
	`duration_minutes` integer DEFAULT 60 NOT NULL,
	`interviewer_ids` text DEFAULT '[]',
	`meeting_link` text,
	`status` text DEFAULT 'Scheduled' NOT NULL,
	`created_by` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`requisition_id`) REFERENCES `job_requisitions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `interview_scorecards` (
	`id` text PRIMARY KEY NOT NULL,
	`interview_id` text NOT NULL,
	`company_id` text NOT NULL,
	`interviewer_id` text,
	`interviewer_name` text,
	`technical` integer,
	`communication` integer,
	`cultural` integer,
	`notes` text,
	`recommendation` text,
	`submitted_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`interview_id`) REFERENCES `interviews`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `offers` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`candidate_id` text NOT NULL,
	`requisition_id` text,
	`title` text NOT NULL,
	`department` text,
	`salary` integer NOT NULL,
	`currency` text DEFAULT 'NGN' NOT NULL,
	`start_date` text,
	`expiry_date` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`letter_body` text,
	`approved_by_id` text,
	`approved_at` text,
	`sent_at` text,
	`responded_at` text,
	`created_by` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`requisition_id`) REFERENCES `job_requisitions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `job_requisitions` ADD `description` text;--> statement-breakpoint
ALTER TABLE `job_requisitions` ADD `requirements` text;--> statement-breakpoint
ALTER TABLE `job_requisitions` ADD `is_publicly_listed` integer DEFAULT true NOT NULL;
