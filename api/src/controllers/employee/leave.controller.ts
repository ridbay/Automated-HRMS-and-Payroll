import { Context } from 'hono';
import { LeaveService } from '../../services/leave.service';
import { EmployeeService } from '../../services/employee.service';
import { AppEnv } from '../../types';

export const getMyLeaveData = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  let employeeId = c.req.header('x-employee-id');
  
  const leaveService = new LeaveService(c.env.DB);
  const employeeService = new EmployeeService(c.env.DB);

  // Mock Auth: Auto-pick if missing
  if (!employeeId) {
    const defaultId = await employeeService.getFirstEmployeeId(companyId);
    if (!defaultId) return c.json({ error: 'No employee found' }, 404);
    employeeId = defaultId;
  }

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
  let employeeId = c.req.header('x-employee-id');
  
  const leaveService = new LeaveService(c.env.DB);
  const employeeService = new EmployeeService(c.env.DB);

  // Mock Auth: Auto-pick if missing
  if (!employeeId) {
    const defaultId = await employeeService.getFirstEmployeeId(companyId);
    if (!defaultId) return c.json({ error: 'No employee found' }, 404);
    employeeId = defaultId;
  }

  const data = await c.req.json();
  const request = await leaveService.createLeaveRequest(companyId, employeeId, data);
  
  return c.json(request);
};
