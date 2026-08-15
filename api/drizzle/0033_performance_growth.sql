-- Hand-written migration (drizzle-kit's snapshot chain is broken from 0027
-- onward — 0027 and 0028's snapshots collide on the same `id`, so
-- `drizzle-kit generate` refuses to run. Following the same hand-written
-- convention already used for 0028/0029 until that chain is repaired.)
--
-- Performance & Growth: adds the admin-managed review cycle table, links
-- assessments to a cycle by id (not just free-text name), adds
-- goal scope/alignment/assignment columns for manager & company-wide OKRs,
-- and lets a shoutout resolve its recipient by id when picked from search.
CREATE TABLE `review_cycles` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'upcoming' NOT NULL,
	`start_date` text,
	`end_date` text,
	`self_review_due_date` text,
	`manager_review_due_date` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE `assessments` ADD `cycle_id` text;
--> statement-breakpoint
ALTER TABLE `goals` ADD `scope` text DEFAULT 'individual' NOT NULL;
--> statement-breakpoint
ALTER TABLE `goals` ADD `assigned_by_id` text;
--> statement-breakpoint
ALTER TABLE `goals` ADD `parent_goal_id` text;
--> statement-breakpoint
ALTER TABLE `feedbacks` ADD `to_employee_id` text;
--> statement-breakpoint
