import { Context } from 'hono';
import { LeaveService } from '../../services/leave.service';
import { AppEnv } from '../../types';

export const getMyLeaveData = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.get('employeeId');

  if (!employeeId) {
    return c.json({ error: 'Unauthorized: No employee ID found' }, 401);
  }

  const leaveService = new LeaveService(c.env.DB);
  const balances = await leaveService.calculateLeaveBalances(companyId, employeeId);
  const requests = await leaveService.getEmployeeLeaveRequests(companyId, employeeId);

  return c.json({ balances, requests });
};

export const getTeamLeaves = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const leaveService = new LeaveService(c.env.DB);
  const teamLeaves = await leaveService.getTeamLeaves(companyId);
  return c.json(teamLeaves);
};

export const applyForLeave = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.get('employeeId');

  if (!employeeId) {
    return c.json({ error: 'Unauthorized: No employee ID found' }, 401);
  }

  const leaveService = new LeaveService(c.env.DB);
  const data = await c.req.json();
  const request = await leaveService.createLeaveRequest(companyId, employeeId, data);

  return c.json(request);
};
