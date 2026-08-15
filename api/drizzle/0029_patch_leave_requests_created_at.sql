-- Hand-written patch: `leave_requests.created_at` has been declared in
-- src/models/leave.model.ts since the very first migration, but the
-- original 0000 migration's CREATE TABLE never actually included it (and no
-- later migration added it either) — every `drizzle-kit generate` since has
-- silently agreed with that gap because the tracked snapshot already listed
-- the column. Same class of drift as 0028's attendance_records fix. This
-- just brings the real table in line with the schema/snapshot.
ALTER TABLE `leave_requests` ADD `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL;--> statement-breakpoint
