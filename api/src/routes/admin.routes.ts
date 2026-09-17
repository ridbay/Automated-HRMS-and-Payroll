import { Hono } from "hono";
import {
  getEmployees,
  getEmployee,
  getDirectReports,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  resetTemporaryPassword,
  addEmergencyContact,
  deleteEmergencyContact,
  addDocument,
  deleteDocument,
  getAuditLogs,
  getAssets,
  addAsset,
  deleteAsset
} from "../controllers/admin/employee.controller";
import { AdminAssetController } from "../controllers/admin/asset.controller";
import { AdminSurveyController } from "../controllers/admin/survey.controller";
import { AdminLearningController } from "../controllers/admin/learning.controller";
import {
  getTransitions,
  getTransition,
  createTransition,
  addTransitionTask,
  updateTransitionTaskStatus,
  cancelTransition,
} from "../controllers/admin/transition.controller";
import {
  getCycles,
  createCycle,
  updateCycle,
  activateCycle,
  closeCycle,
  deleteCycle,
  getCycleStages,
  updateCycleStage,
} from "../controllers/admin/reviewCycle.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole, requirePermission, PermissionModule } from "../middlewares/role.middleware";
import payrollRoutes from "./payroll.routes";
import leaveAdminRoutes from "./leave-admin.routes";
import requisitionRoutes from "./requisition.routes";
import atsRoutes from "./ats.routes";
import attendanceAdminRoutes from "./attendance-admin.routes";
import benefitsAdminRoutes from "./benefits-admin.routes";
import { SettingsService } from "../services/settings.service";
import { CompanyService } from "../services/company.service";
import { OrgService } from "../services/org.service";
import { RoleService } from "../services/role.service";
import { DashboardService } from "../services/dashboard.service";
import { AuditService } from "../services/audit.service";
import {
  HolidayService,
  EmailTemplateService,
  IntegrationService,
  WorkflowService,
  DataExportService,
  NotificationService,
} from "../services/controlCenter.service";
import { MailgunService } from "../services/mailgun.service";
import { WorkflowEngineService } from "../services/workflowEngine.service";
import { StorageService } from "../services/storage.service";
import {
  getOverview as getReportsOverview,
  getWorkforceReport,
  getRecruitmentReport,
  getPayrollReport,
  exportReport,
} from "../controllers/admin/reports.controller";

import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { hashPassword, generateSalt } from "../services/auth.service";

const adminRoutes = new Hono();

import { eq } from "drizzle-orm";

adminRoutes.use("*", authMiddleware);

// Only SUPER_ADMIN and HR_ADMIN reach any admin surface today (see role.middleware
// plan notes) except payroll, which additionally allows MANAGER/PAYROLL_OFFICER.
// requirePermission() layers an optional, additive narrowing on top for any
// employee who's been assigned a custom role in Settings > Roles & Permissions;
// it's a no-op for everyone else (the common case today).
const adminOnly = requireRole("SUPER_ADMIN", "HR_ADMIN");
const view = (mod: PermissionModule) => requirePermission(mod, "view");
const create = (mod: PermissionModule) => requirePermission(mod, "create");
const edit = (mod: PermissionModule) => requirePermission(mod, "edit");
const del = (mod: PermissionModule) => requirePermission(mod, "delete");

// Development-only seed route to create default users with known passwords
adminRoutes.get("/dev/seed", adminOnly, async (c: any) => {
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
      { email: "admin@zenhr.com", role: "SUPER_ADMIN", name: "Super Admin", salary: 12000000 },
      { email: "hr@zenhr.com", role: "HR_ADMIN", name: "HR Admin", salary: 9600000 },
      { email: "manager@zenhr.com", role: "MANAGER", name: "Manager", salary: 8400000 },
      { email: "recruiter@zenhr.com", role: "RECRUITER", name: "Recruiter", salary: 6000000 },
      { email: "employee@zenhr.com", role: "EMPLOYEE", name: "Employee", salary: 4800000 },
      { email: "payroll@zenhr.com", role: "PAYROLL_OFFICER", name: "Payroll Officer", salary: 7200000 },
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
            // Seeded so the Payroll module has something real to compute on
            // demo data instead of showing ₦0 for every employee.
            salary: u.salary,
            baseSalary: u.salary,
            bankName: "GTBank",
            accountNumber: `00${Math.floor(1000000 + Math.random() * 8999999)}`,
            accountName: `${firstName} ${lastName}`.trim(),
            pfa: "ARM Pension Managers",
            pensionId: `PEN${Math.floor(100000 + Math.random() * 899999)}`,
            tin: `TIN${Math.floor(1000000 + Math.random() * 8999999)}`,
            hireDate: "2023-01-15",
          });
      }
    }
    return c.json({ message: "Dev users seeded" });
  } catch (err: any) {
    return c.json({ error: err.message, stack: err.stack }, 500);
  }
});

adminRoutes.get("/employees", adminOnly, view("workforce"), getEmployees);
adminRoutes.get("/employees/:id", adminOnly, view("workforce"), getEmployee);
adminRoutes.get("/employees/:id/direct-reports", adminOnly, view("workforce"), getDirectReports);
adminRoutes.get("/employees/:id/audit-logs", adminOnly, view("workforce"), getAuditLogs);
adminRoutes.post("/employees", adminOnly, create("workforce"), createEmployee);
adminRoutes.put("/employees/:id", adminOnly, edit("workforce"), updateEmployee);
adminRoutes.delete("/employees/:id", adminOnly, del("workforce"), deleteEmployee);
adminRoutes.post("/employees/:id/reset-temporary-password", adminOnly, edit("workforce"), resetTemporaryPassword);

adminRoutes.post("/employees/:id/emergency-contacts", adminOnly, edit("workforce"), addEmergencyContact);
adminRoutes.delete("/employees/:id/emergency-contacts/:contactId", adminOnly, edit("workforce"), deleteEmergencyContact);

import {
  getEmployeeAssessments,
  addEmployeeAssessment,
  getCompanyAssessments,
  getCompanyAnalytics,
  getCompanyGoals,
  createCompanyGoal,
  getCompanyPeerReviews,
} from "../controllers/admin/performance.controller";
import { getEmployeeTrainings, addEmployeeTraining } from "../controllers/admin/training.controller";

// Documents
adminRoutes.post("/employees/:id/documents", adminOnly, edit("workforce"), addDocument);
adminRoutes.delete("/employees/:id/documents/:documentId", adminOnly, edit("workforce"), deleteDocument);

// Assets
adminRoutes.get("/employees/:id/assets", adminOnly, view("workforce"), getAssets);
adminRoutes.post("/employees/:id/assets", adminOnly, edit("workforce"), addAsset);
adminRoutes.delete("/employees/:id/assets/:assetId", adminOnly, edit("workforce"), deleteAsset);

// Global Company Assets
adminRoutes.get("/assets", adminOnly, view("workforce"), AdminAssetController.getAllAssets);
adminRoutes.post("/assets", adminOnly, edit("workforce"), AdminAssetController.createAsset);
adminRoutes.get("/assets/:id", adminOnly, view("workforce"), AdminAssetController.getAssetById);
adminRoutes.put("/assets/:id", adminOnly, edit("workforce"), AdminAssetController.updateAsset);
adminRoutes.delete("/assets/:id", adminOnly, edit("workforce"), AdminAssetController.deleteAsset);

// --- Surveys ---
adminRoutes.get("/surveys", adminOnly, view("company"), AdminSurveyController.getAllSurveys);
adminRoutes.post("/surveys", adminOnly, edit("company"), AdminSurveyController.createSurvey);
adminRoutes.get("/surveys/:id", adminOnly, view("company"), AdminSurveyController.getSurveyById);
adminRoutes.get("/surveys/:id/results", adminOnly, view("company"), AdminSurveyController.getSurveyResults);
adminRoutes.delete("/surveys/:id", adminOnly, edit("company"), AdminSurveyController.deleteSurvey);

// --- Learning Management System (LMS) ---
adminRoutes.get("/courses", adminOnly, view("company"), AdminLearningController.getAllCourses);
adminRoutes.post("/courses", adminOnly, edit("company"), AdminLearningController.createCourse);
adminRoutes.get("/courses/:id", adminOnly, view("company"), AdminLearningController.getCourseById);
adminRoutes.put("/courses/:id", adminOnly, edit("company"), AdminLearningController.updateCourse);
adminRoutes.delete("/courses/:id", adminOnly, edit("company"), AdminLearningController.deleteCourse);
adminRoutes.post("/courses/:id/assign", adminOnly, edit("company"), AdminLearningController.assignCourse);
adminRoutes.get("/courses/:id/enrollments", adminOnly, view("company"), AdminLearningController.getCourseEnrollments);

// Transitions (Onboarding / Offboarding journeys) — lives under the same
// "workforce" permission module as Employees/Assets since it's the same
// lifecycle surface.
adminRoutes.get("/transitions", adminOnly, view("workforce"), getTransitions);
adminRoutes.get("/transitions/:id", adminOnly, view("workforce"), getTransition);
adminRoutes.post("/transitions", adminOnly, create("workforce"), createTransition);
adminRoutes.post("/transitions/:id/tasks", adminOnly, edit("workforce"), addTransitionTask);
adminRoutes.patch("/transitions/:id/tasks/:taskId", adminOnly, edit("workforce"), updateTransitionTaskStatus);
adminRoutes.patch("/transitions/:id/cancel", adminOnly, del("workforce"), cancelTransition);

adminRoutes.get("/performance/employee/:id", adminOnly, view("performance"), getEmployeeAssessments);
adminRoutes.post("/performance/employee/:id", adminOnly, create("performance"), addEmployeeAssessment);

// Performance & Growth: review cycles, company-wide analytics, and browsing
// assessments/goals across the whole company.
adminRoutes.get("/performance/cycles", adminOnly, view("performance"), getCycles);
adminRoutes.post("/performance/cycles", adminOnly, create("performance"), createCycle);
adminRoutes.put("/performance/cycles/:id", adminOnly, edit("performance"), updateCycle);
adminRoutes.post("/performance/cycles/:id/activate", adminOnly, edit("performance"), activateCycle);
adminRoutes.post("/performance/cycles/:id/close", adminOnly, edit("performance"), closeCycle);
adminRoutes.delete("/performance/cycles/:id", adminOnly, edit("performance"), deleteCycle);
adminRoutes.get("/performance/cycles/:id/stages", adminOnly, view("performance"), getCycleStages);
adminRoutes.put("/performance/cycles/:id/stages/:stageId", adminOnly, edit("performance"), updateCycleStage);

adminRoutes.get("/performance/analytics", adminOnly, view("performance"), getCompanyAnalytics);
adminRoutes.get("/performance/assessments", adminOnly, view("performance"), getCompanyAssessments);
adminRoutes.get("/performance/goals", adminOnly, view("performance"), getCompanyGoals);
adminRoutes.post("/performance/goals", adminOnly, create("performance"), createCompanyGoal);
adminRoutes.get("/performance/peer-reviews", adminOnly, view("performance"), getCompanyPeerReviews);

adminRoutes.get("/training/employee/:id", adminOnly, view("performance"), getEmployeeTrainings);
adminRoutes.post("/training/employee/:id", adminOnly, create("performance"), addEmployeeTraining);

adminRoutes.route("/payroll", payrollRoutes);
adminRoutes.route("/leaves", leaveAdminRoutes);
adminRoutes.route("/job-requisitions", requisitionRoutes);
// Candidates / interviews / offers — the real ATS pipeline behind the
// requisitions above. Same role model, see ats.routes.ts.
adminRoutes.route("/ats", atsRoutes);
adminRoutes.route("/attendance", attendanceAdminRoutes);
// Benefits & Wellbeing (plan catalog, enrollments, wellness programs, claims,
// plus the legacy per-employee financial snapshot under /benefits/employee/:id)
// — no matrix module maps to this today, see benefits-admin.routes.ts.
adminRoutes.route("/benefits", benefitsAdminRoutes);

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

// Reports & Analytics — no matrix module maps to this today, so access is
// gated on fixed roles only, mirroring dashboard/stats above. Payroll/
// Recruitment get their own narrower role lists so PAYROLL_OFFICER and
// RECRUITER can reach the slice of reporting relevant to their job without
// exposing the full company-wide overview.
const reportsOverviewOnly = requireRole("SUPER_ADMIN", "HR_ADMIN", "PAYROLL_OFFICER");
const reportsRecruitmentOnly = requireRole("SUPER_ADMIN", "HR_ADMIN", "RECRUITER");
const reportsPayrollOnly = requireRole("SUPER_ADMIN", "HR_ADMIN", "PAYROLL_OFFICER");

adminRoutes.get("/reports/overview", reportsOverviewOnly, getReportsOverview);
adminRoutes.get("/reports/workforce", adminOnly, getWorkforceReport);
adminRoutes.get("/reports/recruitment", reportsRecruitmentOnly, getRecruitmentReport);
adminRoutes.get("/reports/payroll", reportsPayrollOnly, getPayrollReport);
adminRoutes.get("/reports/export", reportsOverviewOnly, exportReport);

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
  await new AuditService(c.env.DB).log(companyId, {
    actorId: c.get("employeeId"),
    action: "Updated security & system settings",
    module: "settings",
    details: `Changed: ${Object.keys(payload).join(", ")}`,
    severity: "warning",
    ip: c.req.header("cf-connecting-ip"),
  });
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
  await new AuditService(c.env.DB).log(companyId, {
    actorId: c.get("employeeId"),
    action: `Created API key "${name}"`,
    module: "api",
    severity: "warning",
    ip: c.req.header("cf-connecting-ip"),
  });
  return c.json(key);
});

adminRoutes.delete("/api-keys/:id", adminOnly, edit("settings"), async (c: any) => {
  const companyId = c.get("companyId");
  const id = c.req.param("id");
  const settingsService = new SettingsService(c.env.DB);
  const deleted = await settingsService.deleteApiKey(companyId, id);
  if (!deleted) return c.json({ error: "Not found" }, 404);
  await new AuditService(c.env.DB).log(companyId, {
    actorId: c.get("employeeId"),
    action: `Revoked API key "${deleted.name}"`,
    module: "api",
    severity: "warning",
    ip: c.req.header("cf-connecting-ip"),
  });
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
  await new AuditService(c.env.DB).log(companyId, {
    actorId: c.get("employeeId"),
    action: "Updated company profile",
    module: "company",
    details: `Changed: ${Object.keys(payload).join(", ")}`,
    ip: c.req.header("cf-connecting-ip"),
  });
  return c.json(company);
});

adminRoutes.post("/company/logo", adminOnly, edit("settings"), async (c: any) => {
  const companyId = c.get("companyId");
  const body = await c.req.parseBody();
  const file = body["file"] as File;
  if (!file) return c.json({ error: "No file provided" }, 400);

  const storage = new StorageService(c.env.BUCKET);
  const fileKey = await storage.uploadCompanyLogo(companyId, file);
  // Matches the mount in index.ts (`app.route('/public', publicRoutes)`) — there
  // is no `/api` prefix anywhere else in this API's routing.
  const logoUrl = `/public/company/${companyId}/logo`;

  const companyService = new CompanyService(c.env.DB);
  const company = await companyService.updateCompany(companyId, { logoUrl: fileKey });

  await new AuditService(c.env.DB).log(companyId, {
    actorId: c.get("employeeId"),
    action: "Updated company logo",
    module: "company",
    ip: c.req.header("cf-connecting-ip"),
  });

  return c.json({ data: { ...company, logoUrl, fileKey } });
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
  const department = await orgService.createDepartment(companyId, payload);
  await new AuditService(c.env.DB).log(companyId, {
    actorId: c.get("employeeId"),
    action: `Created department "${department.name}"`,
    module: "departments",
    ip: c.req.header("cf-connecting-ip"),
  });
  return c.json(department);
});

adminRoutes.put("/departments/:id", adminOnly, edit("workforce"), async (c: any) => {
  const companyId = c.get("companyId");
  const payload = await c.req.json();
  const orgService = new OrgService(c.env.DB);
  const updated = await orgService.updateDepartment(companyId, c.req.param("id"), payload);
  if (!updated) return c.json({ error: "Not found" }, 404);
  await new AuditService(c.env.DB).log(companyId, {
    actorId: c.get("employeeId"),
    action: `Updated department "${updated.name}"`,
    module: "departments",
    ip: c.req.header("cf-connecting-ip"),
  });
  return c.json(updated);
});

adminRoutes.delete("/departments/:id", adminOnly, del("workforce"), async (c: any) => {
  const companyId = c.get("companyId");
  const orgService = new OrgService(c.env.DB);
  const deleted = await orgService.deleteDepartment(companyId, c.req.param("id"));
  await new AuditService(c.env.DB).log(companyId, {
    actorId: c.get("employeeId"),
    action: `Deleted department "${deleted?.name || c.req.param("id")}"`,
    module: "departments",
    severity: "warning",
    ip: c.req.header("cf-connecting-ip"),
  });
  return c.json(deleted);
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
  const location = await orgService.createLocation(companyId, payload);
  await new AuditService(c.env.DB).log(companyId, {
    actorId: c.get("employeeId"),
    action: `Added location "${location.name}"`,
    module: "locations",
    ip: c.req.header("cf-connecting-ip"),
  });
  return c.json(location);
});

adminRoutes.delete("/locations/:id", adminOnly, del("workforce"), async (c: any) => {
  const companyId = c.get("companyId");
  const orgService = new OrgService(c.env.DB);
  const deleted = await orgService.deleteLocation(companyId, c.req.param("id"));
  await new AuditService(c.env.DB).log(companyId, {
    actorId: c.get("employeeId"),
    action: `Removed location "${deleted?.name || c.req.param("id")}"`,
    module: "locations",
    severity: "warning",
    ip: c.req.header("cf-connecting-ip"),
  });
  return c.json(deleted);
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
  const role = await roleService.createRole(companyId, payload);
  await new AuditService(c.env.DB).log(companyId, {
    actorId: c.get("employeeId"),
    action: `Created role "${role.name}"`,
    module: "roles",
    severity: "warning",
    ip: c.req.header("cf-connecting-ip"),
  });
  return c.json(role);
});

adminRoutes.put("/roles/:id", adminOnly, edit("settings"), async (c: any) => {
  const companyId = c.get("companyId");
  const payload = await c.req.json();
  const roleService = new RoleService(c.env.DB);
  const role = await roleService.updateRole(companyId, c.req.param("id"), payload);
  await new AuditService(c.env.DB).log(companyId, {
    actorId: c.get("employeeId"),
    action: `Modified permissions for role "${role?.name || c.req.param("id")}"`,
    module: "roles",
    severity: "warning",
    ip: c.req.header("cf-connecting-ip"),
  });
  return c.json(role);
});

adminRoutes.delete("/roles/:id", adminOnly, edit("settings"), async (c: any) => {
  const companyId = c.get("companyId");
  const roleService = new RoleService(c.env.DB);
  const deleted = await roleService.deleteRole(companyId, c.req.param("id"));
  await new AuditService(c.env.DB).log(companyId, {
    actorId: c.get("employeeId"),
    action: `Deleted role "${deleted?.name || c.req.param("id")}"`,
    module: "roles",
    severity: "warning",
    ip: c.req.header("cf-connecting-ip"),
  });
  return c.json(deleted);
});

// ---------------- Public Holidays ----------------
adminRoutes.get("/holidays", adminOnly, view("settings"), async (c: any) => {
  const companyId = c.get("companyId");
  const service = new HolidayService(c.env.DB);
  return c.json(await service.list(companyId));
});

adminRoutes.post("/holidays", adminOnly, edit("settings"), async (c: any) => {
  const companyId = c.get("companyId");
  const payload = await c.req.json();
  const service = new HolidayService(c.env.DB);
  const holiday = await service.create(companyId, payload);
  await new AuditService(c.env.DB).log(companyId, {
    actorId: c.get("employeeId"),
    action: `Added public holiday "${holiday.name}" (${holiday.date})`,
    module: "settings",
    ip: c.req.header("cf-connecting-ip"),
  });
  return c.json(holiday);
});

adminRoutes.delete("/holidays/:id", adminOnly, edit("settings"), async (c: any) => {
  const companyId = c.get("companyId");
  const service = new HolidayService(c.env.DB);
  const deleted = await service.delete(companyId, c.req.param("id"));
  if (!deleted) return c.json({ error: "Not found" }, 404);
  await new AuditService(c.env.DB).log(companyId, {
    actorId: c.get("employeeId"),
    action: `Removed public holiday "${deleted.name}"`,
    module: "settings",
    ip: c.req.header("cf-connecting-ip"),
  });
  return c.json(deleted);
});

// ---------------- Email Templates ----------------
adminRoutes.get("/email-templates", adminOnly, view("settings"), async (c: any) => {
  const companyId = c.get("companyId");
  const service = new EmailTemplateService(c.env.DB);
  return c.json(await service.list(companyId));
});

adminRoutes.put("/email-templates/:key", adminOnly, edit("settings"), async (c: any) => {
  const companyId = c.get("companyId");
  const payload = await c.req.json();
  const service = new EmailTemplateService(c.env.DB);
  const template = await service.update(companyId, c.req.param("key"), payload);
  if (!template) return c.json({ error: "Not found" }, 404);
  await new AuditService(c.env.DB).log(companyId, {
    actorId: c.get("employeeId"),
    action: `Updated email template "${template.name}"`,
    module: "email",
    ip: c.req.header("cf-connecting-ip"),
  });
  return c.json(template);
});

adminRoutes.post("/email-templates/:key/test", adminOnly, edit("settings"), async (c: any) => {
  const companyId = c.get("companyId");
  const key = c.req.param("key");
  const payload = await c.req.json().catch(() => ({}));
  const toEmail = payload.to || "employee@example.com";
  const mailgun = new MailgunService(c.env.DB, c.env);
  const result = await mailgun.sendEmail({
    companyId,
    to: toEmail,
    templateKey: key,
    variables: payload.variables || {
      employee_first_name: "Alex",
      employee_last_name: "Johnson",
      job_title: "Software Engineer",
      start_date: "Monday, Oct 6",
      manager_name: "Sarah Connor",
      company_name: "ZenHR Demo",
      leave_type: "Annual Leave",
      end_date: "Friday, Oct 17",
      approver_name: "HR Admin",
      rejection_reason: "Operational constraints",
      pay_period: "May 2024",
      net_pay: "₦450,000",
      company_domain: "example.com",
    },
    eventType: `template.test.${key}`,
  });
  if (!result.success) {
    return c.json({ error: result.error || "Failed to send test template email" }, 502);
  }
  return c.json(result);
});

// ---------------- Integrations ----------------
adminRoutes.get("/integrations", adminOnly, view("settings"), async (c: any) => {
  const companyId = c.get("companyId");
  const service = new IntegrationService(c.env.DB);
  return c.json(await service.list(companyId));
});

adminRoutes.put("/integrations/:key/toggle", adminOnly, edit("settings"), async (c: any) => {
  const companyId = c.get("companyId");
  const service = new IntegrationService(c.env.DB);
  try {
    const integration = await service.toggle(companyId, c.req.param("key"));
    if (!integration) return c.json({ error: "Not found" }, 404);
    await new AuditService(c.env.DB).log(companyId, {
      actorId: c.get("employeeId"),
      action: `${integration.status === "connected" ? "Connected" : "Disconnected"} ${integration.name}`,
      module: "integrations",
      ip: c.req.header("cf-connecting-ip"),
    });
    return c.json(integration);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// Slack is the one integration with a real connection flow — an admin
// pastes an Incoming Webhook URL (no OAuth app registration needed).
adminRoutes.put("/integrations/slack/connect", adminOnly, edit("settings"), async (c: any) => {
  const companyId = c.get("companyId");
  const { webhookUrl } = await c.req.json();
  const service = new IntegrationService(c.env.DB);
  try {
    const integration = await service.connectSlack(companyId, webhookUrl);
    await new AuditService(c.env.DB).log(companyId, {
      actorId: c.get("employeeId"),
      action: "Connected Slack Notifications",
      module: "integrations",
      ip: c.req.header("cf-connecting-ip"),
    });
    return c.json(integration);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

adminRoutes.post("/integrations/slack/disconnect", adminOnly, edit("settings"), async (c: any) => {
  const companyId = c.get("companyId");
  const service = new IntegrationService(c.env.DB);
  const integration = await service.disconnect(companyId, "slack");
  await new AuditService(c.env.DB).log(companyId, {
    actorId: c.get("employeeId"),
    action: "Disconnected Slack Notifications",
    module: "integrations",
    ip: c.req.header("cf-connecting-ip"),
  });
  return c.json(integration);
});

adminRoutes.post("/integrations/slack/test", adminOnly, edit("settings"), async (c: any) => {
  const companyId = c.get("companyId");
  const integrationService = new IntegrationService(c.env.DB);
  const integrations = await integrationService.list(companyId);
  const slack = integrations.find((i: any) => i.key === "slack");
  if (slack?.status !== "connected") return c.json({ error: "Slack isn't connected yet" }, 400);

  const beforeCount = (await integrationService.getEvents(companyId, "slack", 1))[0]?.id;
  await new NotificationService(c.env.DB).notify(companyId, "test", "👋 This is a test message from ZenHR — your Slack integration is working.");
  const events = await integrationService.getEvents(companyId, "slack", 1);
  const lastEvent = events[0];
  if (!lastEvent || lastEvent.id === beforeCount) return c.json({ error: "No delivery was recorded" }, 502);
  if (lastEvent.status === "failed") return c.json({ error: "Failed to deliver test message — check the webhook URL" }, 502);
  return c.json({ success: true });
});

// Mailgun Email Delivery integration
adminRoutes.put("/integrations/mailgun/connect", adminOnly, edit("settings"), async (c: any) => {
  const companyId = c.get("companyId");
  const payload = await c.req.json();
  const service = new IntegrationService(c.env.DB);
  try {
    const integration = await service.connectMailgun(companyId, payload);
    await new AuditService(c.env.DB).log(companyId, {
      actorId: c.get("employeeId"),
      action: "Connected Mailgun Email Delivery",
      module: "integrations",
      ip: c.req.header("cf-connecting-ip"),
    });
    return c.json(integration);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

adminRoutes.post("/integrations/mailgun/disconnect", adminOnly, edit("settings"), async (c: any) => {
  const companyId = c.get("companyId");
  const service = new IntegrationService(c.env.DB);
  const integration = await service.disconnect(companyId, "mailgun");
  await new AuditService(c.env.DB).log(companyId, {
    actorId: c.get("employeeId"),
    action: "Disconnected Mailgun Email Delivery",
    module: "integrations",
    ip: c.req.header("cf-connecting-ip"),
  });
  return c.json(integration);
});

adminRoutes.post("/integrations/mailgun/test", adminOnly, edit("settings"), async (c: any) => {
  const companyId = c.get("companyId");
  const payload = await c.req.json().catch(() => ({}));
  const toEmail = payload.to || "test@example.com";
  const mailgun = new MailgunService(c.env.DB, c.env);
  const result = await mailgun.sendEmail({
    companyId,
    to: toEmail,
    subject: "Test Email from ZenHR",
    text: "This is a test email confirming that your Mailgun email delivery integration is working correctly.",
    eventType: "mailgun.test",
  });
  if (!result.success) {
    return c.json({ error: result.error || "Failed to deliver test email" }, 502);
  }
  return c.json(result);
});

adminRoutes.get("/integrations/:key/events", adminOnly, view("settings"), async (c: any) => {
  const companyId = c.get("companyId");
  const service = new IntegrationService(c.env.DB);
  return c.json(await service.getEvents(companyId, c.req.param("key")));
});

// ---------------- Workflows ----------------
adminRoutes.get("/workflows", adminOnly, view("settings"), async (c: any) => {
  const companyId = c.get("companyId");
  const service = new WorkflowService(c.env.DB);
  return c.json(await service.list(companyId));
});

adminRoutes.put("/workflows/:key", adminOnly, edit("settings"), async (c: any) => {
  const companyId = c.get("companyId");
  const payload = await c.req.json();
  const service = new WorkflowService(c.env.DB);
  const workflow = await service.update(companyId, c.req.param("key"), payload);
  if (!workflow) return c.json({ error: "Not found" }, 404);
  await new AuditService(c.env.DB).log(companyId, {
    actorId: c.get("employeeId"),
    action: `Updated workflow "${workflow.name}"`,
    module: "workflows",
    ip: c.req.header("cf-connecting-ip"),
  });
  return c.json(workflow);
});

adminRoutes.post("/workflows/:key/trigger", adminOnly, edit("settings"), async (c: any) => {
  const companyId = c.get("companyId");
  const key = c.req.param("key");
  const payload = await c.req.json().catch(() => ({}));
  const engine = new WorkflowEngineService(c.env.DB, c.env);
  const result = await engine.trigger({
    companyId,
    workflowKey: key,
    triggerEvent: payload.triggerEvent || `manual.trigger.${key}`,
    entityId: payload.entityId,
    actorId: c.get("employeeId"),
    data: payload.data || {},
  });
  return c.json(result);
});

adminRoutes.get("/workflows/executions", adminOnly, view("settings"), async (c: any) => {
  const companyId = c.get("companyId");
  const engine = new WorkflowEngineService(c.env.DB, c.env);
  const key = c.req.query("key");
  const limit = parseInt(c.req.query("limit") || "20", 10);
  return c.json(await engine.listExecutions(companyId, key, limit));
});

// ---------------- Data & Backup ----------------
adminRoutes.get("/data/stats", adminOnly, view("settings"), async (c: any) => {
  const companyId = c.get("companyId");
  const service = new DataExportService(c.env.DB);
  return c.json(await service.getStats(companyId));
});

adminRoutes.get("/data/export", adminOnly, view("settings"), async (c: any) => {
  const companyId = c.get("companyId");
  const service = new DataExportService(c.env.DB);
  const data = await service.exportAll(companyId);
  await new AuditService(c.env.DB).log(companyId, {
    actorId: c.get("employeeId"),
    action: "Exported full company data backup",
    module: "settings",
    severity: "warning",
    ip: c.req.header("cf-connecting-ip"),
  });
  c.header("Content-Type", "application/json");
  c.header("Content-Disposition", `attachment; filename="zenhr-export-${new Date().toISOString().slice(0, 10)}.json"`);
  return c.body(JSON.stringify(data, null, 2));
});

// ---------------- Audit Logs ----------------
adminRoutes.get("/audit-logs", adminOnly, view("settings"), async (c: any) => {
  const companyId = c.get("companyId");
  const service = new AuditService(c.env.DB);
  const logs = await service.getCompanyLogs(companyId, {
    module: c.req.query("module") || undefined,
    search: c.req.query("search") || undefined,
    limit: 200,
  });
  return c.json(logs);
});

adminRoutes.get("/audit-logs/export", adminOnly, view("settings"), async (c: any) => {
  const companyId = c.get("companyId");
  const service = new AuditService(c.env.DB);
  const logs = await service.getCompanyLogs(companyId, { limit: 1000 });
  const escape = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = ["Timestamp", "Actor", "Action", "Module", "Severity", "Details", "IP Address"].map(escape).join(",");
  const rows = logs.map((l: any) =>
    [l.createdAt, l.actorName, l.action, l.module || "", l.severity, l.details, l.ipAddress || ""].map(escape).join(",")
  );
  c.header("Content-Type", "text/csv");
  c.header("Content-Disposition", `attachment; filename="audit-log-${new Date().toISOString().slice(0, 10)}.csv"`);
  return c.body([header, ...rows].join("\n"));
});

export default adminRoutes;
