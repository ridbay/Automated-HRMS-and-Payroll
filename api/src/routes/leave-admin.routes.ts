import { Hono } from 'hono';
import {
  getAllLeaves,
  updateLeaveStatus,
  getEmployeeLeaveBalances,
  updateEmployeeLeaveBalances,
  getEmployeeLeaveRequests
} from '../controllers/admin/leave.controller';
import { requireRole, requirePermission } from '../middlewares/role.middleware';

export const leaveAdminRoutes = new Hono();

const adminOnly = requireRole('SUPER_ADMIN', 'HR_ADMIN');
const view = requirePermission('leave', 'view');
const approve = requirePermission('leave', 'approve');

leaveAdminRoutes.get('/', adminOnly, view, getAllLeaves);
leaveAdminRoutes.put('/:id/status', adminOnly, approve, updateLeaveStatus);

// Employee-specific admin overrides
leaveAdminRoutes.get('/employee/:id/balances', adminOnly, view, getEmployeeLeaveBalances);
leaveAdminRoutes.put('/employee/:id/balances', adminOnly, approve, updateEmployeeLeaveBalances);
leaveAdminRoutes.get('/employee/:id/requests', adminOnly, view, getEmployeeLeaveRequests);

export default leaveAdminRoutes;
