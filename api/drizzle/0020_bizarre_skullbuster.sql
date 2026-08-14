ALTER TABLE `employees` ADD `department_id` text REFERENCES departments(id);--> statement-breakpoint
ALTER TABLE `departments` ADD `manager_id` text;--> statement-breakpoint
ALTER TABLE `departments` ADD `team_lead_id` text;