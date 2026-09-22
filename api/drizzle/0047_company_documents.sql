-- Hand-written, like the other "patch_"/manually-added migrations in this
-- history (0028, 0029, 0031, 0045) — drizzle-kit's own journal/meta snapshots
-- under drizzle/meta/ are stale (stuck at 0034) relative to the real applied
-- schema (migrations run through 0046 via `wrangler d1 migrations apply`,
-- which tracks applied files by name, not through drizzle-kit's journal), so
-- `drizzle-kit generate` cannot be trusted here until that journal is
-- reconciled. This migration only adds the one new table the model change
-- introduced.
CREATE TABLE `company_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`file_key` text,
	`file_name` text,
	`uploaded_by_id` text NOT NULL,
	`uploaded_by_name` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
