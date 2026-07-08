import { Hono } from 'hono';
import { 
  getAllLeaves, 
  updateLeaveStatus, 
  getEmployeeLeaveBalances, 
  updateEmployeeLeaveBalances 
} from '../controllers/admin/leave.controller';

const leaveAdminRoutes = new Hono();

leaveAdminRoutes.get('/', getAllLeaves);
leaveAdminRoutes.patch('/:id/status', updateLeaveStatus);
leaveAdminRoutes.get('/employee/:id/balances', getEmployeeLeaveBalances);
leaveAdminRoutes.put('/employee/:id/balances', updateEmployeeLeaveBalances);

export default leaveAdminRoutes;
