CREATE TABLE `emergency_contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`employee_id` text NOT NULL,
	`name` text NOT NULL,
	`relationship` text NOT NULL,
	`phone` text NOT NULL,
	`email` text,
	`is_primary` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `employees` ADD `tin` text;--> statement-breakpoint
ALTER TABLE `employees` ADD `pfa` text;--> statement-breakpoint
ALTER TABLE `employees` ADD `pension_id` text;--> statement-breakpoint
ALTER TABLE `employees` ADD `bank_name` text;--> statement-breakpoint
ALTER TABLE `employees` ADD `account_number` text;--> statement-breakpoint
ALTER TABLE `employees` ADD `account_name` text;--> statement-breakpoint
ALTER TABLE `employees` ADD `payout_method` text;