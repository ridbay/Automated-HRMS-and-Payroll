-- Hand-written patch: `payslips.created_at` has been declared in
-- src/models/payroll.model.ts since the very first migration, but the
-- original CREATE TABLE never actually included it (and no later migration
-- added it either) — every `drizzle-kit generate` since has silently agreed
-- with that gap because the tracked snapshot already listed the column.
-- Same class of drift as 0028/0029 for attendance_records/leave_requests;
-- this just brings the real table in line with the schema/snapshot.
ALTER TABLE `payslips` ADD `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL;--> statement-breakpoint
