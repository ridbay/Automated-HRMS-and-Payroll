import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { companies } from "./company.model";

export const apiKeys = sqliteTable("api_keys", {
  id: text("id").primaryKey(),
  companyId: text("company_id")
    .references(() => companies.id)
    .notNull(),
  name: text("name").notNull(),
  key: text("key").notNull(),
  lastUsedAt: text("last_used_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").$onUpdate(() => new Date().toISOString()),
});

export const companySettings = sqliteTable("company_settings", {
  companyId: text("company_id")
    .primaryKey()
    .references(() => companies.id),
  require2fa: integer("require_2fa", { mode: "boolean" })
    .default(false)
    .notNull(),
  passwordMinLength: integer("password_min_length").default(12).notNull(),
  sessionTimeoutMins: integer("session_timeout_mins").default(60).notNull(),
  // Attendance policy — drives the on-time/late tag applied at clock-in and
  // the standard shift length used to compute overtime at clock-out.
  attendanceStartTime: text("attendance_start_time").default("09:00").notNull(),
  attendanceEndTime: text("attendance_end_time").default("17:00").notNull(),
  attendanceGraceMinutes: integer("attendance_grace_minutes").default(15).notNull(),
  // Operational calendar — JSON array of ISO weekday numbers (1=Mon..7=Sun).
  workingDays: text("working_days").default('[1,2,3,4,5]').notNull(),
  // Notification preferences (Control Center > Notifications)
  notifyLeaveRequests: integer("notify_leave_requests", { mode: "boolean" }).default(true).notNull(),
  notifyPayrollRuns: integer("notify_payroll_runs", { mode: "boolean" }).default(true).notNull(),
  notifyNewHires: integer("notify_new_hires", { mode: "boolean" }).default(true).notNull(),
  notifyComplianceAlerts: integer("notify_compliance_alerts", { mode: "boolean" }).default(true).notNull(),
  notifyWeeklyDigest: integer("notify_weekly_digest", { mode: "boolean" }).default(false).notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .$onUpdate(() => new Date().toISOString()),
});

// Company-observed public holidays — feeds the attendance/leave calendar and
// is managed from Control Center > Company Profile > Operational Calendar.
export const publicHolidays = sqliteTable("public_holidays", {
  id: text("id").primaryKey(),
  companyId: text("company_id")
    .references(() => companies.id)
    .notNull(),
  name: text("name").notNull(),
  date: text("date").notNull(), // ISO yyyy-mm-dd
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});
