import { Hono } from 'hono';
import { getEmployees, createEmployee } from '../controllers/admin/employee.controller';
import { tenantMiddleware } from '../middlewares/tenant.middleware';
import payrollRoutes from './payroll.routes';
import { SettingsService } from '../services/settings.service';

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

export default adminRoutes;
