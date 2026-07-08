PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_employees` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`middle_name` text,
	`last_name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`dob` text,
	`gender` text,
	`nationality` text,
	`marital_status` text,
	`role` text,
	`department` text,
	`location` text,
	`employment_type` text,
	`status` text DEFAULT 'onboarding' NOT NULL,
	`salary` integer,
	`avatar` text,
	`base_salary` integer,
	`hire_date` text,
	`probation_end` text,
	`manager_id` text,
	`manager_name` text,
	`work_email` text,
	`performance_rating` real,
	`tin` text,
	`pfa` text,
	`pension_id` text,
	`bank_name` text,
	`account_number` text,
	`account_name` text,
	`payout_method` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_employees`("id", "company_id", "name", "middle_name", "last_name", "email", "phone", "dob", "gender", "nationality", "marital_status", "role", "department", "location", "employment_type", "status", "salary", "avatar", "base_salary", "hire_date", "probation_end", "manager_id", "manager_name", "work_email", "performance_rating", "tin", "pfa", "pension_id", "bank_name", "account_number", "account_name", "payout_method") SELECT "id", "company_id", "name", "middle_name", "last_name", "email", "phone", "dob", "gender", "nationality", "marital_status", "role", "department", "location", "employment_type", "status", "salary", "avatar", "base_salary", "hire_date", "probation_end", "manager_id", "manager_name", "work_email", "performance_rating", "tin", "pfa", "pension_id", "bank_name", "account_number", "account_name", "payout_method" FROM `employees`;--> statement-breakpoint
DROP TABLE `employees`;--> statement-breakpoint
ALTER TABLE `__new_employees` RENAME TO `employees`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `employees_email_unique` ON `employees` (`email`);