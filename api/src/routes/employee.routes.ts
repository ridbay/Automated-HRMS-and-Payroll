import { Hono } from 'hono';
import { getMyProfile, updateMyProfile } from '../controllers/employee/profile.controller';
import { getMyLeaveData, applyForLeave } from '../controllers/employee/leave.controller';
import { getAttendanceData, clockIn, clockOut } from '../controllers/employee/attendance.controller';
import { tenantMiddleware } from '../middlewares/tenant.middleware';

const employeeRoutes = new Hono();

employeeRoutes.use('*', tenantMiddleware);

// Self-Service Profile Routes
employeeRoutes.get('/me', getMyProfile);
employeeRoutes.put('/me', updateMyProfile);

// Self-Service Leave Routes
employeeRoutes.get('/leave/me', getMyLeaveData);
employeeRoutes.post('/leave/apply', applyForLeave);

// Self-Service Attendance Routes
employeeRoutes.get('/attendance/me', getAttendanceData);
employeeRoutes.post('/attendance/clock-in', clockIn);
employeeRoutes.post('/attendance/clock-out', clockOut);

export default employeeRoutes;
