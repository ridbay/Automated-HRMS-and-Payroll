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
  const employeeId = c.get('employeeId');

  if (!employeeId) {
    return c.json({ error: 'Unauthorized: No employee ID found' }, 401);
  }

  const leaveService = new LeaveService(c.env.DB);
  const teamLeaves = await leaveService.getTeamLeaves(companyId, employeeId);
  return c.json(teamLeaves);
};

export const getMyTeamPendingLeaves = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.get('employeeId');

  if (!employeeId) {
    return c.json({ error: 'Unauthorized: No employee ID found' }, 401);
  }

  const leaveService = new LeaveService(c.env.DB);
  // Scoped entirely by the caller's own id: a non-manager simply has no direct reports.
  const requests = await leaveService.getPendingTeamLeaveRequests(companyId, employeeId);
  return c.json(requests);
};

export const updateTeamLeaveStatus = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.get('employeeId');
  const requestId = c.req.param('id') as string;

  if (!employeeId) {
    return c.json({ error: 'Unauthorized: No employee ID found' }, 401);
  }

  const payload = await c.req.json();
  const leaveService = new LeaveService(c.env.DB);
  const updated = await leaveService.updateTeamLeaveRequestStatus(companyId, employeeId, requestId, {
    status: payload.status,
    managerComment: payload.managerComment,
  });

  if (!updated) {
    return c.json({ error: 'Leave request not found, or you are not this employee\'s manager' }, 404);
  }
  return c.json(updated);
};

export const applyForLeave = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.get('employeeId');

  if (!employeeId) {
    return c.json({ error: 'Unauthorized: No employee ID found' }, 401);
  }

  try {
    const leaveService = new LeaveService(c.env.DB);
    const data = await c.req.json();
    const request = await leaveService.createLeaveRequest(companyId, employeeId, data);
    return c.json(request);
  } catch (error: any) {
    // e.g. insufficient balance or overlapping dates — a validation error, not a server fault.
    return c.json({ error: error.message || 'Failed to apply for leave' }, 400);
  }
};
