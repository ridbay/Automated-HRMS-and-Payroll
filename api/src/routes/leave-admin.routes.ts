import { Hono } from 'hono';
import { 
  getAllLeaves, 
  updateLeaveStatus,
  getEmployeeLeaveBalances,
  updateEmployeeLeaveBalances,
  getEmployeeLeaveRequests
} from '../controllers/admin/leave.controller';
import { requireRole } from '../middlewares/role.middleware';

export const leaveAdminRoutes = new Hono();

const adminOnly = requireRole('SUPER_ADMIN', 'HR_ADMIN');

leaveAdminRoutes.get('/', adminOnly, getAllLeaves);
leaveAdminRoutes.put('/:id/status', adminOnly, updateLeaveStatus);

// Employee-specific admin overrides
leaveAdminRoutes.get('/employee/:id/balances', adminOnly, getEmployeeLeaveBalances);
leaveAdminRoutes.put('/employee/:id/balances', adminOnly, updateEmployeeLeaveBalances);
leaveAdminRoutes.get('/employee/:id/requests', adminOnly, getEmployeeLeaveRequests);

export default leaveAdminRoutes;
