CREATE TABLE `departments` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`head_count` integer DEFAULT 0,
	`created_at` text NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `locations` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`address` text NOT NULL,
	`city` text,
	`country` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`permissions` text NOT NULL,
	`users_count` integer DEFAULT 0,
	`color` text DEFAULT 'slate',
	`created_at` text NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `companies` ADD `registration_number` text;--> statement-breakpoint
ALTER TABLE `companies` ADD `industry` text;--> statement-breakpoint
ALTER TABLE `companies` ADD `fiscal_year_start` text;--> statement-breakpoint
ALTER TABLE `companies` ADD `address` text;--> statement-breakpoint
ALTER TABLE `companies` ADD `support_email` text;