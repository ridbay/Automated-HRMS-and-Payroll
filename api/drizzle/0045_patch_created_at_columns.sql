-- Hand-written patch, same class of drift as 0028/0029/0031: each of these
-- tables has declared `createdAt` in its model since early on, but the
-- original CREATE TABLE never included it and no later migration added it
-- either — every `drizzle-kit generate` since has silently agreed with the
-- gap because the tracked snapshot already listed the column. This blocks
-- any insert into these tables outright (NOT NULL column missing entirely),
-- most visibly `employees` — company registration and employee creation
-- both fail with "table employees has no column named created_at" until
-- this runs.
ALTER TABLE `employees` ADD `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL;--> statement-breakpoint
ALTER TABLE `emergency_contacts` ADD `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL;--> statement-breakpoint
ALTER TABLE `wallet_transactions` ADD `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL;--> statement-breakpoint
ALTER TABLE `job_requisitions` ADD `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL;--> statement-breakpoint
