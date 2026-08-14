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
  deleteDocument
} from "../controllers/admin/employee.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
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

adminRoutes.get("/employees", getEmployees);
adminRoutes.get("/employees/:id", getEmployee);
adminRoutes.get("/employees/:id/direct-reports", getDirectReports);
adminRoutes.post("/employees", createEmployee);
adminRoutes.put("/employees/:id", updateEmployee);
adminRoutes.delete("/employees/:id", deleteEmployee);

adminRoutes.post("/employees/:id/emergency-contacts", addEmergencyContact);
adminRoutes.delete("/employees/:id/emergency-contacts/:contactId", deleteEmergencyContact);

import { getEmployeeAssessments, addEmployeeAssessment } from "../controllers/admin/performance.controller";
import { getEmployeeBenefits, updateEmployeeBenefits } from "../controllers/admin/benefits.controller";
import { getEmployeeTrainings, addEmployeeTraining } from "../controllers/admin/training.controller";

adminRoutes.post("/employees/:id/documents", addDocument);
adminRoutes.delete("/employees/:id/documents/:documentId", deleteDocument);

adminRoutes.get("/performance/employee/:id", getEmployeeAssessments);
adminRoutes.post("/performance/employee/:id", addEmployeeAssessment);

adminRoutes.get("/benefits/employee/:id", getEmployeeBenefits);
adminRoutes.put("/benefits/employee/:id", updateEmployeeBenefits);

adminRoutes.get("/training/employee/:id", getEmployeeTrainings);
adminRoutes.post("/training/employee/:id", addEmployeeTraining);

// Further routes can be added here (e.g., requisitions, payroll)
adminRoutes.route("/payroll", payrollRoutes);
adminRoutes.route("/leaves", leaveAdminRoutes);

adminRoutes.get("/dashboard/stats", async (c: any) => {
  try {
    const companyId = c.get("companyId");
    const dashboardService = new DashboardService(c.env.DB);
    const stats = await dashboardService.getDashboardStats(companyId);
    return c.json(stats);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

adminRoutes.get("/settings", async (c: any) => {
  const companyId = c.get("companyId");
  const settingsService = new SettingsService(c.env.DB);
  const settings = await settingsService.getSettings(companyId);
  return c.json(settings);
});

adminRoutes.put("/settings", async (c: any) => {
  const companyId = c.get("companyId");
  const payload = await c.req.json();
  const settingsService = new SettingsService(c.env.DB);
  const settings = await settingsService.updateSettings(companyId, payload);
  return c.json(settings);
});

adminRoutes.get("/api-keys", async (c: any) => {
  const companyId = c.get("companyId");
  const settingsService = new SettingsService(c.env.DB);
  const keys = await settingsService.getApiKeys(companyId);
  return c.json(keys);
});

// Seed route moved up

adminRoutes.post("/api-keys", async (c: any) => {
  const companyId = c.get("companyId");
  const { name } = await c.req.json();
  const settingsService = new SettingsService(c.env.DB);
  const key = await settingsService.createApiKey(companyId, name);
  return c.json(key);
});

adminRoutes.delete("/api-keys/:id", async (c: any) => {
  const companyId = c.get("companyId");
  const id = c.req.param("id");
  const settingsService = new SettingsService(c.env.DB);
  const deleted = await settingsService.deleteApiKey(companyId, id);
  if (!deleted) return c.json({ error: "Not found" }, 404);
  return c.json(deleted);
});

// Company Profile Routes
adminRoutes.get("/company", async (c: any) => {
  const companyId = c.get("companyId");
  const companyService = new CompanyService(c.env.DB);
  const company = await companyService.getCompany(companyId);
  return c.json(company);
});

adminRoutes.put("/company", async (c: any) => {
  const companyId = c.get("companyId");
  const payload = await c.req.json();
  const companyService = new CompanyService(c.env.DB);
  const company = await companyService.updateCompany(companyId, payload);
  return c.json(company);
});

// Org Routes (Departments & Locations)
adminRoutes.get("/departments", async (c: any) => {
  const companyId = c.get("companyId");
  const orgService = new OrgService(c.env.DB);
  return c.json(await orgService.getDepartments(companyId));
});

adminRoutes.post("/departments", async (c: any) => {
  const companyId = c.get("companyId");
  const payload = await c.req.json();
  const orgService = new OrgService(c.env.DB);
  return c.json(await orgService.createDepartment(companyId, payload));
});

adminRoutes.put("/departments/:id", async (c: any) => {
  const companyId = c.get("companyId");
  const payload = await c.req.json();
  const orgService = new OrgService(c.env.DB);
  const updated = await orgService.updateDepartment(companyId, c.req.param("id"), payload);
  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json(updated);
});

adminRoutes.delete("/departments/:id", async (c: any) => {
  const companyId = c.get("companyId");
  const orgService = new OrgService(c.env.DB);
  return c.json(
    await orgService.deleteDepartment(companyId, c.req.param("id")),
  );
});

adminRoutes.get("/departments/:id/members", async (c: any) => {
  const companyId = c.get("companyId");
  const orgService = new OrgService(c.env.DB);
  return c.json(await orgService.getDepartmentMembers(companyId, c.req.param("id")));
});

adminRoutes.post("/departments/:id/members", async (c: any) => {
  const companyId = c.get("companyId");
  const { employeeId } = await c.req.json();
  const orgService = new OrgService(c.env.DB);
  const member = await orgService.assignEmployeeToDepartment(companyId, c.req.param("id"), employeeId);
  if (!member) return c.json({ error: "Department or employee not found" }, 404);
  return c.json(member);
});

adminRoutes.delete("/departments/:id/members/:employeeId", async (c: any) => {
  const companyId = c.get("companyId");
  const orgService = new OrgService(c.env.DB);
  const member = await orgService.removeEmployeeFromDepartment(companyId, c.req.param("id"), c.req.param("employeeId"));
  if (!member) return c.json({ error: "Employee is not a member of this department" }, 404);
  return c.json(member);
});

adminRoutes.get("/locations", async (c: any) => {
  const companyId = c.get("companyId");
  const orgService = new OrgService(c.env.DB);
  return c.json(await orgService.getLocations(companyId));
});

adminRoutes.post("/locations", async (c: any) => {
  const companyId = c.get("companyId");
  const payload = await c.req.json();
  const orgService = new OrgService(c.env.DB);
  return c.json(await orgService.createLocation(companyId, payload));
});

adminRoutes.delete("/locations/:id", async (c: any) => {
  const companyId = c.get("companyId");
  const orgService = new OrgService(c.env.DB);
  return c.json(await orgService.deleteLocation(companyId, c.req.param("id")));
});

// Roles Routes
adminRoutes.get("/roles", async (c: any) => {
  const companyId = c.get("companyId");
  const roleService = new RoleService(c.env.DB);
  return c.json(await roleService.getRoles(companyId));
});

adminRoutes.post("/roles", async (c: any) => {
  const companyId = c.get("companyId");
  const payload = await c.req.json();
  const roleService = new RoleService(c.env.DB);
  return c.json(await roleService.createRole(companyId, payload));
});

adminRoutes.put("/roles/:id", async (c: any) => {
  const companyId = c.get("companyId");
  const payload = await c.req.json();
  const roleService = new RoleService(c.env.DB);
  return c.json(
    await roleService.updateRole(companyId, c.req.param("id"), payload),
  );
});

adminRoutes.delete("/roles/:id", async (c: any) => {
  const companyId = c.get("companyId");
  const roleService = new RoleService(c.env.DB);
  return c.json(await roleService.deleteRole(companyId, c.req.param("id")));
});

export default adminRoutes;
