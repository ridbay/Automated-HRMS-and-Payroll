import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { employees } from "./employee.model";
import { companies } from "./company.model";

export const leaveRequests = sqliteTable("leave_requests", {
  id: text("id").primaryKey(),
  companyId: text("company_id")
    .notNull()
    .references(() => companies.id),
  employeeId: text("employee_id")
    .notNull()
    .references(() => employees.id),
  type: text("type").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  days: integer("days").notNull(),

  reason: text("reason").notNull(),
  managerId: text("manager_id"),
  managerComment: text("manager_comment"),
  status: text("status").notNull(),
  attachment: text("attachment"),
  appliedOn: text("applied_on").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").$onUpdate(() => new Date().toISOString()),
});
