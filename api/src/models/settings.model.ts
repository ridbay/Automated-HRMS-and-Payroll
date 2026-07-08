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
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .$onUpdate(() => new Date().toISOString()),
});
