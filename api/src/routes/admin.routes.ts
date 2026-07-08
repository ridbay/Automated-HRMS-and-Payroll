import { Hono } from 'hono';
import { getEmployees, createEmployee } from '../controllers/admin/employee.controller';

const adminRoutes = new Hono();

adminRoutes.get('/employees', getEmployees);
adminRoutes.post('/employees', createEmployee);

// Further routes can be added here (e.g., requisitions, payroll)

export default adminRoutes;
