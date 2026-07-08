ALTER TABLE `employees` ADD `password_hash` text;--> statement-breakpoint
ALTER TABLE `employees` ADD `password_salt` text;--> statement-breakpoint
ALTER TABLE `employees` ADD `is_password_changed` integer DEFAULT false;