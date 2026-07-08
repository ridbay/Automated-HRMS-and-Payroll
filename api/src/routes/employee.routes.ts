import { Hono } from 'hono';
import { getLeaveRequests } from '../controllers/employee/leave.controller';
import { tenantMiddleware } from '../middlewares/tenant.middleware';

const employeeRoutes = new Hono();

employeeRoutes.use('*', tenantMiddleware);

employeeRoutes.get('/leave-requests', getLeaveRequests);

export default employeeRoutes;
