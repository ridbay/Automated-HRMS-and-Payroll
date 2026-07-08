import { Hono } from 'hono';
import { getEmployees, createEmployee } from '../controllers/admin/employee.controller';
import { tenantMiddleware } from '../middlewares/tenant.middleware';
import payrollRoutes from './payroll.routes';

const adminRoutes = new Hono();

adminRoutes.use('*', tenantMiddleware);

adminRoutes.get('/employees', getEmployees);
adminRoutes.post('/employees', createEmployee);

// Further routes can be added here (e.g., requisitions, payroll)
adminRoutes.route('/payroll', payrollRoutes);

export default adminRoutes;
