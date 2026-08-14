import { Hono } from 'hono';
import {
  getAllAttendance,
  getAttendanceSummary,
  createAttendanceRecord,
  updateAttendanceRecord,
  deleteAttendanceRecord,
  getOvertimeRequests,
  updateOvertimeStatus,
  getAttendancePolicy,
  updateAttendancePolicy
} from '../controllers/admin/attendance.controller';
import { requireRole } from '../middlewares/role.middleware';

export const attendanceAdminRoutes = new Hono();

const adminOnly = requireRole('SUPER_ADMIN', 'HR_ADMIN');

// Company-wide oversight. Managers get their own scoped view via
// /employee/attendance/team and /employee/attendance/team-requests instead.
attendanceAdminRoutes.get('/', adminOnly, getAllAttendance);
attendanceAdminRoutes.get('/summary', adminOnly, getAttendanceSummary);
attendanceAdminRoutes.post('/', adminOnly, createAttendanceRecord);
attendanceAdminRoutes.put('/:id', adminOnly, updateAttendanceRecord);
attendanceAdminRoutes.delete('/:id', adminOnly, deleteAttendanceRecord);

attendanceAdminRoutes.get('/overtime', adminOnly, getOvertimeRequests);
attendanceAdminRoutes.patch('/overtime/:id/status', adminOnly, updateOvertimeStatus);

attendanceAdminRoutes.get('/policy', adminOnly, getAttendancePolicy);
attendanceAdminRoutes.put('/policy', adminOnly, updateAttendancePolicy);

export default attendanceAdminRoutes;
