import { Hono } from 'hono';
import { getEmployees, createEmployee } from '../controllers/admin/employee.controller';
import { tenantMiddleware } from '../middlewares/tenant.middleware';
import payrollRoutes from './payroll.routes';
import { SettingsService } from '../services/settings.service';
import { CompanyService } from '../services/company.service';
import { OrgService } from '../services/org.service';
import { RoleService } from '../services/role.service';

const adminRoutes = new Hono();

adminRoutes.use('*', tenantMiddleware);

adminRoutes.get('/employees', getEmployees);
adminRoutes.post('/employees', createEmployee);

// Further routes can be added here (e.g., requisitions, payroll)
adminRoutes.route('/payroll', payrollRoutes);

adminRoutes.get('/settings', async (c: any) => {
  const companyId = c.get('companyId');
  const settingsService = new SettingsService(c.env.DB);
  const settings = await settingsService.getSettings(companyId);
  return c.json(settings);
});

adminRoutes.put('/settings', async (c: any) => {
  const companyId = c.get('companyId');
  const payload = await c.req.json();
  const settingsService = new SettingsService(c.env.DB);
  const settings = await settingsService.updateSettings(companyId, payload);
  return c.json(settings);
});

adminRoutes.get('/api-keys', async (c: any) => {
  const companyId = c.get('companyId');
  const settingsService = new SettingsService(c.env.DB);
  const keys = await settingsService.getApiKeys(companyId);
  return c.json(keys);
});

adminRoutes.post('/api-keys', async (c: any) => {
  const companyId = c.get('companyId');
  const { name } = await c.req.json();
  const settingsService = new SettingsService(c.env.DB);
  const key = await settingsService.createApiKey(companyId, name);
  return c.json(key);
});

adminRoutes.delete('/api-keys/:id', async (c: any) => {
  const companyId = c.get('companyId');
  const id = c.req.param('id');
  const settingsService = new SettingsService(c.env.DB);
  const deleted = await settingsService.deleteApiKey(companyId, id);
  if (!deleted) return c.json({ error: 'Not found' }, 404);
  return c.json(deleted);
});

// Company Profile Routes
adminRoutes.get('/company', async (c: any) => {
  const companyId = c.get('companyId');
  const companyService = new CompanyService(c.env.DB);
  const company = await companyService.getCompany(companyId);
  return c.json(company);
});

adminRoutes.put('/company', async (c: any) => {
  const companyId = c.get('companyId');
  const payload = await c.req.json();
  const companyService = new CompanyService(c.env.DB);
  const company = await companyService.updateCompany(companyId, payload);
  return c.json(company);
});

// Org Routes (Departments & Locations)
adminRoutes.get('/departments', async (c: any) => {
  const companyId = c.get('companyId');
  const orgService = new OrgService(c.env.DB);
  return c.json(await orgService.getDepartments(companyId));
});

adminRoutes.post('/departments', async (c: any) => {
  const companyId = c.get('companyId');
  const payload = await c.req.json();
  const orgService = new OrgService(c.env.DB);
  return c.json(await orgService.createDepartment(companyId, payload));
});

adminRoutes.delete('/departments/:id', async (c: any) => {
  const companyId = c.get('companyId');
  const orgService = new OrgService(c.env.DB);
  return c.json(await orgService.deleteDepartment(companyId, c.req.param('id')));
});

adminRoutes.get('/locations', async (c: any) => {
  const companyId = c.get('companyId');
  const orgService = new OrgService(c.env.DB);
  return c.json(await orgService.getLocations(companyId));
});

adminRoutes.post('/locations', async (c: any) => {
  const companyId = c.get('companyId');
  const payload = await c.req.json();
  const orgService = new OrgService(c.env.DB);
  return c.json(await orgService.createLocation(companyId, payload));
});

adminRoutes.delete('/locations/:id', async (c: any) => {
  const companyId = c.get('companyId');
  const orgService = new OrgService(c.env.DB);
  return c.json(await orgService.deleteLocation(companyId, c.req.param('id')));
});

// Roles Routes
adminRoutes.get('/roles', async (c: any) => {
  const companyId = c.get('companyId');
  const roleService = new RoleService(c.env.DB);
  return c.json(await roleService.getRoles(companyId));
});

adminRoutes.post('/roles', async (c: any) => {
  const companyId = c.get('companyId');
  const payload = await c.req.json();
  const roleService = new RoleService(c.env.DB);
  return c.json(await roleService.createRole(companyId, payload));
});

adminRoutes.put('/roles/:id', async (c: any) => {
  const companyId = c.get('companyId');
  const payload = await c.req.json();
  const roleService = new RoleService(c.env.DB);
  return c.json(await roleService.updateRole(companyId, c.req.param('id'), payload));
});

adminRoutes.delete('/roles/:id', async (c: any) => {
  const companyId = c.get('companyId');
  const roleService = new RoleService(c.env.DB);
  return c.json(await roleService.deleteRole(companyId, c.req.param('id')));
});

export default adminRoutes;
