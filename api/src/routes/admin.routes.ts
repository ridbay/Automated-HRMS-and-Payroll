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
import { requireRole } from "../middlewares/role.middleware";
import payrollRoutes from "./payroll.routes";
import leaveAdminRoutes from "./leave-admin.routes";
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
const adminOnly = requireRole("SUPER_ADMIN", "HR_ADMIN");

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

adminRoutes.get("/employees", adminOnly, getEmployees);
adminRoutes.get("/employees/:id", adminOnly, getEmployee);
adminRoutes.get("/employees/:id/direct-reports", adminOnly, getDirectReports);
adminRoutes.get("/employees/:id/audit-logs", adminOnly, getAuditLogs);
adminRoutes.post("/employees", adminOnly, createEmployee);
adminRoutes.put("/employees/:id", adminOnly, updateEmployee);
adminRoutes.delete("/employees/:id", adminOnly, deleteEmployee);

adminRoutes.post("/employees/:id/emergency-contacts", adminOnly, addEmergencyContact);
adminRoutes.delete("/employees/:id/emergency-contacts/:contactId", adminOnly, deleteEmergencyContact);

import { getEmployeeAssessments, addEmployeeAssessment } from "../controllers/admin/performance.controller";
import { getEmployeeBenefits, updateEmployeeBenefits } from "../controllers/admin/benefits.controller";
import { getEmployeeTrainings, addEmployeeTraining } from "../controllers/admin/training.controller";

// Documents
adminRoutes.post("/employees/:id/documents", adminOnly, addDocument);
adminRoutes.delete("/employees/:id/documents/:documentId", adminOnly, deleteDocument);

// Assets
adminRoutes.get("/employees/:id/assets", adminOnly, getAssets);
adminRoutes.post("/employees/:id/assets", adminOnly, addAsset);
adminRoutes.delete("/employees/:id/assets/:assetId", adminOnly, deleteAsset);

adminRoutes.get("/performance/employee/:id", adminOnly, getEmployeeAssessments);
adminRoutes.post("/performance/employee/:id", adminOnly, addEmployeeAssessment);

adminRoutes.get("/benefits/employee/:id", adminOnly, getEmployeeBenefits);
adminRoutes.put("/benefits/employee/:id", adminOnly, updateEmployeeBenefits);

adminRoutes.get("/training/employee/:id", adminOnly, getEmployeeTrainings);
adminRoutes.post("/training/employee/:id", adminOnly, addEmployeeTraining);

// Further routes can be added here (e.g., requisitions, payroll)
adminRoutes.route("/payroll", payrollRoutes);
adminRoutes.route("/leaves", leaveAdminRoutes);

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

adminRoutes.get("/settings", adminOnly, async (c: any) => {
  const companyId = c.get("companyId");
  const settingsService = new SettingsService(c.env.DB);
  const settings = await settingsService.getSettings(companyId);
  return c.json(settings);
});

adminRoutes.put("/settings", adminOnly, async (c: any) => {
  const companyId = c.get("companyId");
  const payload = await c.req.json();
  const settingsService = new SettingsService(c.env.DB);
  const settings = await settingsService.updateSettings(companyId, payload);
  return c.json(settings);
});

adminRoutes.get("/api-keys", adminOnly, async (c: any) => {
  const companyId = c.get("companyId");
  const settingsService = new SettingsService(c.env.DB);
  const keys = await settingsService.getApiKeys(companyId);
  return c.json(keys);
});

// Seed route moved up

adminRoutes.post("/api-keys", adminOnly, async (c: any) => {
  const companyId = c.get("companyId");
  const { name } = await c.req.json();
  const settingsService = new SettingsService(c.env.DB);
  const key = await settingsService.createApiKey(companyId, name);
  return c.json(key);
});

adminRoutes.delete("/api-keys/:id", adminOnly, async (c: any) => {
  const companyId = c.get("companyId");
  const id = c.req.param("id");
  const settingsService = new SettingsService(c.env.DB);
  const deleted = await settingsService.deleteApiKey(companyId, id);
  if (!deleted) return c.json({ error: "Not found" }, 404);
  return c.json(deleted);
});

// Company Profile Routes
adminRoutes.get("/company", adminOnly, async (c: any) => {
  const companyId = c.get("companyId");
  const companyService = new CompanyService(c.env.DB);
  const company = await companyService.getCompany(companyId);
  return c.json(company);
});

adminRoutes.put("/company", adminOnly, async (c: any) => {
  const companyId = c.get("companyId");
  const payload = await c.req.json();
  const companyService = new CompanyService(c.env.DB);
  const company = await companyService.updateCompany(companyId, payload);
  return c.json(company);
});

// Org Routes (Departments & Locations)
adminRoutes.get("/departments", adminOnly, async (c: any) => {
  const companyId = c.get("companyId");
  const orgService = new OrgService(c.env.DB);
  return c.json(await orgService.getDepartments(companyId));
});

adminRoutes.post("/departments", adminOnly, async (c: any) => {
  const companyId = c.get("companyId");
  const payload = await c.req.json();
  const orgService = new OrgService(c.env.DB);
  return c.json(await orgService.createDepartment(companyId, payload));
});

adminRoutes.put("/departments/:id", adminOnly, async (c: any) => {
  const companyId = c.get("companyId");
  const payload = await c.req.json();
  const orgService = new OrgService(c.env.DB);
  const updated = await orgService.updateDepartment(companyId, c.req.param("id"), payload);
  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json(updated);
});

adminRoutes.delete("/departments/:id", adminOnly, async (c: any) => {
  const companyId = c.get("companyId");
  const orgService = new OrgService(c.env.DB);
  return c.json(
    await orgService.deleteDepartment(companyId, c.req.param("id")),
  );
});

adminRoutes.get("/departments/:id/members", adminOnly, async (c: any) => {
  const companyId = c.get("companyId");
  const orgService = new OrgService(c.env.DB);
  return c.json(await orgService.getDepartmentMembers(companyId, c.req.param("id")));
});

adminRoutes.post("/departments/:id/members", adminOnly, async (c: any) => {
  const companyId = c.get("companyId");
  const { employeeId } = await c.req.json();
  const orgService = new OrgService(c.env.DB);
  const member = await orgService.assignEmployeeToDepartment(companyId, c.req.param("id"), employeeId);
  if (!member) return c.json({ error: "Department or employee not found" }, 404);
  return c.json(member);
});

adminRoutes.delete("/departments/:id/members/:employeeId", adminOnly, async (c: any) => {
  const companyId = c.get("companyId");
  const orgService = new OrgService(c.env.DB);
  const member = await orgService.removeEmployeeFromDepartment(companyId, c.req.param("id"), c.req.param("employeeId"));
  if (!member) return c.json({ error: "Employee is not a member of this department" }, 404);
  return c.json(member);
});

adminRoutes.get("/locations", adminOnly, async (c: any) => {
  const companyId = c.get("companyId");
  const orgService = new OrgService(c.env.DB);
  return c.json(await orgService.getLocations(companyId));
});

adminRoutes.post("/locations", adminOnly, async (c: any) => {
  const companyId = c.get("companyId");
  const payload = await c.req.json();
  const orgService = new OrgService(c.env.DB);
  return c.json(await orgService.createLocation(companyId, payload));
});

adminRoutes.delete("/locations/:id", adminOnly, async (c: any) => {
  const companyId = c.get("companyId");
  const orgService = new OrgService(c.env.DB);
  return c.json(await orgService.deleteLocation(companyId, c.req.param("id")));
});

// Roles Routes
adminRoutes.get("/roles", adminOnly, async (c: any) => {
  const companyId = c.get("companyId");
  const roleService = new RoleService(c.env.DB);
  return c.json(await roleService.getRoles(companyId));
});

adminRoutes.post("/roles", adminOnly, async (c: any) => {
  const companyId = c.get("companyId");
  const payload = await c.req.json();
  const roleService = new RoleService(c.env.DB);
  return c.json(await roleService.createRole(companyId, payload));
});

adminRoutes.put("/roles/:id", adminOnly, async (c: any) => {
  const companyId = c.get("companyId");
  const payload = await c.req.json();
  const roleService = new RoleService(c.env.DB);
  return c.json(
    await roleService.updateRole(companyId, c.req.param("id"), payload),
  );
});

adminRoutes.delete("/roles/:id", adminOnly, async (c: any) => {
  const companyId = c.get("companyId");
  const roleService = new RoleService(c.env.DB);
  return c.json(await roleService.deleteRole(companyId, c.req.param("id")));
});

export default adminRoutes;
