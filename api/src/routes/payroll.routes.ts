import { Hono } from 'hono';
import { previewPayroll, lockPayroll, getEmployeePayslips } from '../controllers/admin/payroll.controller';
import { tenantMiddleware } from '../middlewares/tenant.middleware';
import { requireRole } from '../middlewares/role.middleware';

const payrollRoutes = new Hono();

// Apply tenant middleware for all payroll routes to ensure x-company-id is present
payrollRoutes.use('*', tenantMiddleware);

// Previewing budget is also useful to line managers and payroll staff; locking a
// run and viewing an individual employee's payslips is reserved for admin/payroll staff.
payrollRoutes.get('/preview', requireRole('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'PAYROLL_OFFICER'), previewPayroll);
payrollRoutes.post('/lock', requireRole('SUPER_ADMIN', 'HR_ADMIN', 'PAYROLL_OFFICER'), lockPayroll);
payrollRoutes.get('/employee/:id/payslips', requireRole('SUPER_ADMIN', 'HR_ADMIN', 'PAYROLL_OFFICER'), getEmployeePayslips);

export default payrollRoutes;
