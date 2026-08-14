CREATE TABLE `employee_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`employee_id` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`serial_number` text,
	`status` text DEFAULT 'Assigned' NOT NULL,
	`condition` text DEFAULT 'Good' NOT NULL,
	`purchase_date` text,
	`value` integer,
	`image` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `employees` ADD `private_notes` text;