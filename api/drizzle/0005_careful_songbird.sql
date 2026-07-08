CREATE TABLE `api_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`key` text NOT NULL,
	`last_used_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `company_settings` (
	`company_id` text PRIMARY KEY NOT NULL,
	`require_2fa` integer DEFAULT false NOT NULL,
	`password_min_length` integer DEFAULT 12 NOT NULL,
	`session_timeout_mins` integer DEFAULT 60 NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
