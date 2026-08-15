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
import { requireRole, requirePermission } from '../middlewares/role.middleware';

export const attendanceAdminRoutes = new Hono();

const adminOnly = requireRole('SUPER_ADMIN', 'HR_ADMIN');
// Read-only records/summary also admit MANAGER: the controller narrows the
// result set to the caller's own direct reports in that case (see
// getAllAttendance/getAttendanceSummary), the same least-privilege-via-data-
// scoping approach used by /employee/attendance/team*. Corrections, manual
// entries and policy stay admin-only; managers approve overtime through the
// employee-scoped /employee/attendance/team-requests route instead.
const readable = requireRole('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER');
const view = requirePermission('attendance', 'view');
const edit = requirePermission('attendance', 'edit');
const approve = requirePermission('attendance', 'approve');

// Static paths are registered before the generic `/:id` routes so they can
// never be shadowed by the param match.
attendanceAdminRoutes.get('/summary', readable, view, getAttendanceSummary);
attendanceAdminRoutes.get('/overtime', adminOnly, view, getOvertimeRequests);
attendanceAdminRoutes.patch('/overtime/:id/status', adminOnly, approve, updateOvertimeStatus);
attendanceAdminRoutes.get('/policy', adminOnly, view, getAttendancePolicy);
attendanceAdminRoutes.put('/policy', adminOnly, edit, updateAttendancePolicy);

attendanceAdminRoutes.get('/', readable, view, getAllAttendance);
attendanceAdminRoutes.post('/', adminOnly, edit, createAttendanceRecord);
attendanceAdminRoutes.put('/:id', adminOnly, edit, updateAttendanceRecord);
attendanceAdminRoutes.delete('/:id', adminOnly, edit, deleteAttendanceRecord);

export default attendanceAdminRoutes;
