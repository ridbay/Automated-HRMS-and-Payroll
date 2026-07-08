CREATE TABLE `attendance_records` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text NOT NULL,
	`date` text NOT NULL,
	`clock_in` text NOT NULL,
	`clock_out` text,
	`status` text NOT NULL,
	`location_in` text,
	`location_out` text,
	`work_hours` real NOT NULL,
	`overtime` real NOT NULL,
	`notes` text,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`middle_name` text,
	`last_name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`dob` text,
	`gender` text,
	`nationality` text,
	`marital_status` text,
	`role` text NOT NULL,
	`department` text NOT NULL,
	`location` text,
	`employment_type` text NOT NULL,
	`status` text NOT NULL,
	`salary` integer NOT NULL,
	`avatar` text,
	`base_salary` integer,
	`hire_date` text NOT NULL,
	`probation_end` text,
	`manager_id` text,
	`manager_name` text,
	`work_email` text,
	`performance_rating` real
);
--> statement-breakpoint
CREATE UNIQUE INDEX `employees_email_unique` ON `employees` (`email`);--> statement-breakpoint
CREATE TABLE `job_requisitions` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`department` text NOT NULL,
	`location` text NOT NULL,
	`hiring_manager` text NOT NULL,
	`manager_avatar` text,
	`priority` text NOT NULL,
	`status` text NOT NULL,
	`date_opened` text NOT NULL,
	`target_hire_date` text NOT NULL,
	`days_open` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `leave_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text NOT NULL,
	`type` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`days` integer NOT NULL,
	`reason` text NOT NULL,
	`status` text NOT NULL,
	`attachment` text,
	`applied_on` text NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `wallet_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`amount` integer NOT NULL,
	`description` text NOT NULL,
	`timestamp` text NOT NULL,
	`status` text NOT NULL
);
