import { Hono } from 'hono';
import { getMyProfile, updateMyProfile } from '../controllers/employee/profile.controller';
import { getMyLeaveData, applyForLeave } from '../controllers/employee/leave.controller';
import { tenantMiddleware } from '../middlewares/tenant.middleware';

const employeeRoutes = new Hono();

employeeRoutes.use('*', tenantMiddleware);

// Self-Service Profile Routes
employeeRoutes.get('/me', getMyProfile);
employeeRoutes.put('/me', updateMyProfile);

// Self-Service Leave Routes
employeeRoutes.get('/leave/me', getMyLeaveData);
employeeRoutes.post('/leave/apply', applyForLeave);

export default employeeRoutes;
