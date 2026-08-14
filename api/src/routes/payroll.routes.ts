import { Hono } from 'hono';
import { previewPayroll, lockPayroll, getEmployeePayslips } from '../controllers/admin/payroll.controller';
import { tenantMiddleware } from '../middlewares/tenant.middleware';

const payrollRoutes = new Hono();

// Apply tenant middleware for all payroll routes to ensure x-company-id is present
payrollRoutes.use('*', tenantMiddleware);

payrollRoutes.get('/preview', previewPayroll);
payrollRoutes.post('/lock', lockPayroll);
payrollRoutes.get('/employee/:id/payslips', getEmployeePayslips);

export default payrollRoutes;
