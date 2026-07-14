import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { employees } from "./employee.model";
import { companies } from "./company.model";

export const attendanceRecords = sqliteTable("attendance_records", {
  id: text("id").primaryKey(),
  companyId: text("company_id")
    .notNull()
    .references(() => companies.id),
  employeeId: text("employee_id")
    .notNull()
    .references(() => employees.id),
  date: text("date").notNull(),

  clockIn: text("clock_in").notNull(),
  clockOut: text("clock_out"),
  status: text("status").notNull(),
  locationIn: text("location_in"),
  latitudeIn: real("latitude_in"),
  longitudeIn: real("longitude_in"),
  locationOut: text("location_out"),
  latitudeOut: real("latitude_out"),
  longitudeOut: real("longitude_out"),
  workHours: real("work_hours").notNull(),
  overtime: real("overtime").notNull(),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").$onUpdate(() => new Date().toISOString()),
});

export const overtimeRequests = sqliteTable("overtime_requests", {
  id: text("id").primaryKey(),
  companyId: text("company_id")
    .notNull()
    .references(() => companies.id),
  employeeId: text("employee_id")
    .notNull()
    .references(() => employees.id),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  hours: real("hours").notNull(),
  reason: text("reason").notNull(),
  deliverable: text("deliverable"),
  status: text("status").notNull().default("pending"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").$onUpdate(() => new Date().toISOString()),
});
