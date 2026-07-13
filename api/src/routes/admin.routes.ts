import { Hono } from "hono";
import {
  getEmployees,
  createEmployee,
} from "../controllers/admin/employee.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import payrollRoutes from "./payroll.routes";
import leaveAdminRoutes from "./leave-admin.routes";
import { SettingsService } from "../services/settings.service";
import { CompanyService } from "../services/company.service";
import { OrgService } from "../services/org.service";
import { RoleService } from "../services/role.service";

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
adminRoutes.post("/employees", createEmployee);

// Further routes can be added here (e.g., requisitions, payroll)
adminRoutes.route("/payroll", payrollRoutes);
adminRoutes.route("/leaves", leaveAdminRoutes);

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

adminRoutes.delete("/departments/:id", async (c: any) => {
  const companyId = c.get("companyId");
  const orgService = new OrgService(c.env.DB);
  return c.json(
    await orgService.deleteDepartment(companyId, c.req.param("id")),
  );
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
