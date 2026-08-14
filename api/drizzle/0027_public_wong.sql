ALTER TABLE `overtime_requests` ADD `manager_id` text;--> statement-breakpoint
ALTER TABLE `overtime_requests` ADD `manager_comment` text;--> statement-breakpoint
ALTER TABLE `company_settings` ADD `attendance_start_time` text DEFAULT '09:00' NOT NULL;--> statement-breakpoint
ALTER TABLE `company_settings` ADD `attendance_end_time` text DEFAULT '17:00' NOT NULL;--> statement-breakpoint
ALTER TABLE `company_settings` ADD `attendance_grace_minutes` integer DEFAULT 15 NOT NULL;