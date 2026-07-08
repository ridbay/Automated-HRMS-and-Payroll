import { Hono } from 'hono';
import { 
  getMyProfile, 
  updateMyProfile, 
  addEmergencyContact, 
  deleteEmergencyContact,
  uploadDocument,
  deleteDocument,
  downloadDocument
} from '../controllers/employee/profile.controller';
import { getMyLeaveData, applyForLeave } from '../controllers/employee/leave.controller';
import { getAttendanceData, clockIn, clockOut } from '../controllers/employee/attendance.controller';
import { tenantMiddleware } from '../middlewares/tenant.middleware';

const employeeRoutes = new Hono();

employeeRoutes.use('*', tenantMiddleware);

// Self-Service Profile Routes
employeeRoutes.get('/me', getMyProfile);
employeeRoutes.put('/me', updateMyProfile);
employeeRoutes.post('/me/emergency-contacts', addEmergencyContact);
employeeRoutes.delete('/me/emergency-contacts/:id', deleteEmergencyContact);

// Document Management
employeeRoutes.post('/me/documents', uploadDocument);
employeeRoutes.delete('/me/documents/:id', deleteDocument);
employeeRoutes.get('/me/documents/:id/download', downloadDocument);

// Self-Service Leave Routes
employeeRoutes.get('/leave/me', getMyLeaveData);
employeeRoutes.post('/leave/apply', applyForLeave);

// Self-Service Attendance Routes
employeeRoutes.get('/attendance/me', getAttendanceData);
employeeRoutes.post('/attendance/clock-in', clockIn);
employeeRoutes.post('/attendance/clock-out', clockOut);

export default employeeRoutes;
