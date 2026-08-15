import { Hono } from "hono";
import {
  getEmployees,
  getEmployee,
  getDirectReports,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  addEmergencyContact,
  deleteEmergencyContact,
  addDocument,
  deleteDocument,
  getAuditLogs,
  getAssets,
  addAsset,
  deleteAsset
} from "../controllers/admin/employee.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole, requirePermission } from "../middlewares/role.middleware";
import payrollRoutes from "./payroll.routes";
import leaveAdminRoutes from "./leave-admin.routes";
import requisitionRoutes from "./requisition.routes";
import attendanceAdminRoutes from "./attendance-admin.routes";
import { SettingsService } from "../services/settings.service";
import { CompanyService } from "../services/company.service";
import { OrgService } from "../services/org.service";
import { RoleService } from "../services/role.service";
import { DashboardService } from "../services/dashboard.service";

import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { hashPassword, generateSalt } from "../services/auth.service";

const adminRoutes = new Hono();

import { eq } from "drizzle-orm";

// Only SUPER_ADMIN and HR_ADMIN reach any admin surface today (see role.middleware
// plan notes) except payroll, which additionally allows MANAGER/PAYROLL_OFFICER.
// requirePermission() layers an optional, additive narrowing on top for any
// employee who's been assigned a custom role in Settings > Roles & Permissions;
// it's a no-op for everyone else (the common case today).
const adminOnly = requireRole("SUPER_ADMIN", "HR_ADMIN");
const view = (mod: "workforce" | "payroll" | "performance" | "settings" | "leave") => requirePermission(mod, "view");
const create = (mod: "workforce" | "performance") => requirePermission(mod, "create");
const edit = (mod: "workforce" | "performance" | "settings") => requirePermission(mod, "edit");
const del = (mod: "workforce") => requirePermission(mod, "delete");

// Development-only seed route to create default users with known passwords
adminRoutes.get("/dev/seed", async (c: any) => {
  try {
    const db = drizzle(c.env.DB, { schema });

    const companyId = "comp-1234";

    const existingCompany = await db.query.companies.findFirst({
      where: eq(schema.companies.id, companyId)
    });

    if (!existingCompany) {
      await db.insert(schema.companies).values({
        id: companyId,
        name: "ZenHR Demo Company",
      });
    }

    const users = [
      { email: "admin@zenhr.com", role: "SUPER_ADMIN", name: "Super Admin" },
      { email: "hr@zenhr.com", role: "HR_ADMIN", name: "HR Admin" },
      { email: "manager@zenhr.com", role: "MANAGER", name: "Manager" },
      { email: "recruiter@zenhr.com", role: "RECRUITER", name: "Recruiter" },
      { email: "employee@zenhr.com", role: "EMPLOYEE", name: "Employee" },
    ];

    for (const u of users) {
      const existingUser = await db.query.employees.findFirst({
        where: eq(schema.employees.email, u.email)
      });

      if (!existingUser) {
        const salt = generateSalt();
        const hash = await hashPassword("password123", salt);
        const parts = u.name.split(" ");
        const firstName = parts[0];
        const lastName = parts.slice(1).join(" ");

        await db
          .insert(schema.employees)
          .values({
            id: `EMP-${crypto.randomUUID().split("-")[0].toUpperCase()}`,
            companyId,
            email: u.email,
            name: firstName,
            lastName: lastName,
            role: u.role,
            passwordHash: hash,
            passwordSalt: salt,
            isPasswordChanged: true,
            department: "Engineering",
            employmentType: "Full-time",
            status: "active",
          });
      }
    }
    return c.json({ message: "Dev users seeded" });
  } catch (err: any) {
    return c.json({ error: err.message, stack: err.stack }, 500);
  }
});

adminRoutes.use("*", authMiddleware);

adminRoutes.get("/employees", adminOnly, view("workforce"), getEmployees);
adminRoutes.get("/employees/:id", adminOnly, view("workforce"), getEmployee);
adminRoutes.get("/employees/:id/direct-reports", adminOnly, view("workforce"), getDirectReports);
adminRoutes.get("/employees/:id/audit-logs", adminOnly, view("workforce"), getAuditLogs);
adminRoutes.post("/employees", adminOnly, create("workforce"), createEmployee);
adminRoutes.put("/employees/:id", adminOnly, edit("workforce"), updateEmployee);
adminRoutes.delete("/employees/:id", adminOnly, del("workforce"), deleteEmployee);

adminRoutes.post("/employees/:id/emergency-contacts", adminOnly, edit("workforce"), addEmergencyContact);
adminRoutes.delete("/employees/:id/emergency-contacts/:contactId", adminOnly, edit("workforce"), deleteEmergencyContact);

import { getEmployeeAssessments, addEmployeeAssessment } from "../controllers/admin/performance.controller";
import { getEmployeeBenefits, updateEmployeeBenefits } from "../controllers/admin/benefits.controller";
import { getEmployeeTrainings, addEmployeeTraining } from "../controllers/admin/training.controller";

// Documents
adminRoutes.post("/employees/:id/documents", adminOnly, edit("workforce"), addDocument);
adminRoutes.delete("/employees/:id/documents/:documentId", adminOnly, edit("workforce"), deleteDocument);

// Assets
adminRoutes.get("/employees/:id/assets", adminOnly, view("workforce"), getAssets);
adminRoutes.post("/employees/:id/assets", adminOnly, edit("workforce"), addAsset);
adminRoutes.delete("/employees/:id/assets/:assetId", adminOnly, edit("workforce"), deleteAsset);

adminRoutes.get("/performance/employee/:id", adminOnly, view("performance"), getEmployeeAssessments);
adminRoutes.post("/performance/employee/:id", adminOnly, create("performance"), addEmployeeAssessment);

// Benefits has no matrix module (dropped "Wallet" as decorative, see role.middleware
// plan notes) — stays gated on the fixed role only.
adminRoutes.get("/benefits/employee/:id", adminOnly, getEmployeeBenefits);
adminRoutes.put("/benefits/employee/:id", adminOnly, updateEmployeeBenefits);

adminRoutes.get("/training/employee/:id", adminOnly, view("performance"), getEmployeeTrainings);
adminRoutes.post("/training/employee/:id", adminOnly, create("performance"), addEmployeeTraining);

adminRoutes.route("/payroll", payrollRoutes);
adminRoutes.route("/leaves", leaveAdminRoutes);
adminRoutes.route("/job-requisitions", requisitionRoutes);
adminRoutes.route("/attendance", attendanceAdminRoutes);

// No matrix module maps to this today — stays gated on the fixed role only.
adminRoutes.get("/dashboard/stats", adminOnly, async (c: any) => {
  try {
    const companyId = c.get("companyId");
    const dashboardService = new DashboardService(c.env.DB);
    const stats = await dashboardService.getDashboardStats(companyId);
    return c.json(stats);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

adminRoutes.get("/settings", adminOnly, view("settings"), async (c: any) => {
  const companyId = c.get("companyId");
  const settingsService = new SettingsService(c.env.DB);
  const settings = await settingsService.getSettings(companyId);
  return c.json(settings);
});

adminRoutes.put("/settings", adminOnly, edit("settings"), async (c: any) => {
  const companyId = c.get("companyId");
  const payload = await c.req.json();
  const settingsService = new SettingsService(c.env.DB);
  const settings = await settingsService.updateSettings(companyId, payload);
  return c.json(settings);
});

adminRoutes.get("/api-keys", adminOnly, view("settings"), async (c: any) => {
  const companyId = c.get("companyId");
  const settingsService = new SettingsService(c.env.DB);
  const keys = await settingsService.getApiKeys(companyId);
  return c.json(keys);
});

// Seed route moved up

adminRoutes.post("/api-keys", adminOnly, edit("settings"), async (c: any) => {
  const companyId = c.get("companyId");
  const { name } = await c.req.json();
  const settingsService = new SettingsService(c.env.DB);
  const key = await settingsService.createApiKey(companyId, name);
  return c.json(key);
});

adminRoutes.delete("/api-keys/:id", adminOnly, edit("settings"), async (c: any) => {
  const companyId = c.get("companyId");
  const id = c.req.param("id");
  const settingsService = new SettingsService(c.env.DB);
  const deleted = await settingsService.deleteApiKey(companyId, id);
  if (!deleted) return c.json({ error: "Not found" }, 404);
  return c.json(deleted);
});

// Company Profile Routes
adminRoutes.get("/company", adminOnly, view("settings"), async (c: any) => {
  const companyId = c.get("companyId");
  const companyService = new CompanyService(c.env.DB);
  const company = await companyService.getCompany(companyId);
  return c.json(company);
});

adminRoutes.put("/company", adminOnly, edit("settings"), async (c: any) => {
  const companyId = c.get("companyId");
  const payload = await c.req.json();
  const companyService = new CompanyService(c.env.DB);
  const company = await companyService.updateCompany(companyId, payload);
  return c.json(company);
});

// Org Routes (Departments & Locations)
adminRoutes.get("/departments", adminOnly, view("workforce"), async (c: any) => {
  const companyId = c.get("companyId");
  const orgService = new OrgService(c.env.DB);
  return c.json(await orgService.getDepartments(companyId));
});

adminRoutes.post("/departments", adminOnly, create("workforce"), async (c: any) => {
  const companyId = c.get("companyId");
  const payload = await c.req.json();
  const orgService = new OrgService(c.env.DB);
  return c.json(await orgService.createDepartment(companyId, payload));
});

adminRoutes.put("/departments/:id", adminOnly, edit("workforce"), async (c: any) => {
  const companyId = c.get("companyId");
  const payload = await c.req.json();
  const orgService = new OrgService(c.env.DB);
  const updated = await orgService.updateDepartment(companyId, c.req.param("id"), payload);
  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json(updated);
});

adminRoutes.delete("/departments/:id", adminOnly, del("workforce"), async (c: any) => {
  const companyId = c.get("companyId");
  const orgService = new OrgService(c.env.DB);
  return c.json(
    await orgService.deleteDepartment(companyId, c.req.param("id")),
  );
});

adminRoutes.get("/departments/:id/members", adminOnly, view("workforce"), async (c: any) => {
  const companyId = c.get("companyId");
  const orgService = new OrgService(c.env.DB);
  return c.json(await orgService.getDepartmentMembers(companyId, c.req.param("id")));
});

adminRoutes.post("/departments/:id/members", adminOnly, edit("workforce"), async (c: any) => {
  const companyId = c.get("companyId");
  const { employeeId } = await c.req.json();
  const orgService = new OrgService(c.env.DB);
  const member = await orgService.assignEmployeeToDepartment(companyId, c.req.param("id"), employeeId);
  if (!member) return c.json({ error: "Department or employee not found" }, 404);
  return c.json(member);
});

adminRoutes.delete("/departments/:id/members/:employeeId", adminOnly, edit("workforce"), async (c: any) => {
  const companyId = c.get("companyId");
  const orgService = new OrgService(c.env.DB);
  const member = await orgService.removeEmployeeFromDepartment(companyId, c.req.param("id"), c.req.param("employeeId"));
  if (!member) return c.json({ error: "Employee is not a member of this department" }, 404);
  return c.json(member);
});

adminRoutes.get("/locations", adminOnly, view("workforce"), async (c: any) => {
  const companyId = c.get("companyId");
  const orgService = new OrgService(c.env.DB);
  return c.json(await orgService.getLocations(companyId));
});

adminRoutes.post("/locations", adminOnly, create("workforce"), async (c: any) => {
  const companyId = c.get("companyId");
  const payload = await c.req.json();
  const orgService = new OrgService(c.env.DB);
  return c.json(await orgService.createLocation(companyId, payload));
});

adminRoutes.delete("/locations/:id", adminOnly, del("workforce"), async (c: any) => {
  const companyId = c.get("companyId");
  const orgService = new OrgService(c.env.DB);
  return c.json(await orgService.deleteLocation(companyId, c.req.param("id")));
});

// Roles Routes
adminRoutes.get("/roles", adminOnly, view("settings"), async (c: any) => {
  const companyId = c.get("companyId");
  const roleService = new RoleService(c.env.DB);
  return c.json(await roleService.getRoles(companyId));
});

adminRoutes.post("/roles", adminOnly, edit("settings"), async (c: any) => {
  const companyId = c.get("companyId");
  const payload = await c.req.json();
  const roleService = new RoleService(c.env.DB);
  return c.json(await roleService.createRole(companyId, payload));
});

adminRoutes.put("/roles/:id", adminOnly, edit("settings"), async (c: any) => {
  const companyId = c.get("companyId");
  const payload = await c.req.json();
  const roleService = new RoleService(c.env.DB);
  return c.json(
    await roleService.updateRole(companyId, c.req.param("id"), payload),
  );
});

adminRoutes.delete("/roles/:id", adminOnly, edit("settings"), async (c: any) => {
  const companyId = c.get("companyId");
  const roleService = new RoleService(c.env.DB);
  return c.json(await roleService.deleteRole(companyId, c.req.param("id")));
});

export default adminRoutes;
