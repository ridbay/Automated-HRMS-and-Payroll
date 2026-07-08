import { Hono } from 'hono';
import { getLeaveRequests } from '../controllers/employee/leave.controller';

const employeeRoutes = new Hono();

employeeRoutes.get('/leave-requests', getLeaveRequests);

export default employeeRoutes;
