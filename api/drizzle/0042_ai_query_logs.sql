CREATE TABLE `ai_query_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`employee_id` text NOT NULL,
	`role` text NOT NULL,
	`question` text NOT NULL,
	`tools_used` text DEFAULT '[]',
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
