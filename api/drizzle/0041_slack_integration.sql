ALTER TABLE `integrations` ADD `config` text;--> statement-breakpoint
ALTER TABLE `integrations` ADD `last_error` text;--> statement-breakpoint
CREATE TABLE `integration_events` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`integration_key` text NOT NULL,
	`event_type` text NOT NULL,
	`payload_summary` text NOT NULL,
	`status` text NOT NULL,
	`response_code` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
