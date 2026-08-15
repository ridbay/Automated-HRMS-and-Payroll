-- Lets 'department'-scoped objectives target a specific department, since
-- each department may carry its own strategic goals distinct from the
-- company-wide ones set on the same Goals surface.
ALTER TABLE `goals` ADD `department_id` text;
--> statement-breakpoint
ALTER TABLE `goals` ADD `department_name` text;
