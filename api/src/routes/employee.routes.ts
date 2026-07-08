import { Hono } from 'hono';
import { getLeaveRequests } from '../controllers/employee/leave.controller';
import { getMyProfile, updateMyProfile } from '../controllers/employee/profile.controller';
import { tenantMiddleware } from '../middlewares/tenant.middleware';

const employeeRoutes = new Hono();

employeeRoutes.use('*', tenantMiddleware);

employeeRoutes.get('/leave-requests', getLeaveRequests);

// Self-Service Profile Routes
employeeRoutes.get('/me', getMyProfile);
employeeRoutes.put('/me', updateMyProfile);

export default employeeRoutes;
