import { Context } from 'hono';
import { LeaveService } from '../../services/leave.service';
import { AppEnv } from '../../types';

export const getAllLeaves = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId') as string;
  const leaveService = new LeaveService(c.env.DB);
  
  // Gets all leave requests for the company
  const requests = await leaveService.getAllByCompany(companyId);
  return c.json(requests);
};

export const updateLeaveStatus = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId') as string;
  const requestId = c.req.param('id') as string;
  const payload = await c.req.json();
  const managerId = c.req.header('x-employee-id') as string; // Admin who is approving
  
  const leaveService = new LeaveService(c.env.DB);
  
  const updated = await leaveService.updateLeaveRequestStatus(
    companyId, 
    requestId, 
    {
      status: payload.status,
      days: payload.days,
      managerComment: payload.managerComment,
      managerId
    }
  );
  
  return c.json(updated);
};

export const getEmployeeLeaveBalances = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId') as string;
  const employeeId = c.req.param('id') as string;
  const leaveService = new LeaveService(c.env.DB);
  
  // This calculates using approved requests and raw balances, 
  // ensuring defaults if none exist.
  const balances = await leaveService.calculateLeaveBalances(companyId, employeeId);
  return c.json(balances);
};

export const updateEmployeeLeaveBalances = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId') as string;
  const employeeId = c.req.param('id') as string;
  const { balances } = await c.req.json();
  const leaveService = new LeaveService(c.env.DB);
  
  const updated = await leaveService.updateEmployeeLeaveBalances(companyId, employeeId, balances);
  return c.json(updated);
};
