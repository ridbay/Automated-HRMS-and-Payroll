-- Hand-written migration (drizzle-kit's snapshot chain has been broken since
-- 0027 — several concurrent hand-written patches since then, following the
-- same convention already used for 0028/0029: .sql only, no snapshot).
--
-- Performance & Growth: adds the admin-managed review cycle table, links
-- assessments to a cycle by id (not just free-text name), adds goal
-- scope/alignment/assignment columns for manager & company-wide OKRs, and
-- lets a shoutout resolve its recipient by id when picked from search.
--
-- Already applied to the local D1 instance directly (this file is the
-- deploy-time record for `wrangler d1 migrations apply --remote`).
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
