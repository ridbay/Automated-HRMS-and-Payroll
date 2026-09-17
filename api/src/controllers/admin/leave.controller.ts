import { Context } from 'hono';
import { LeaveService } from '../../services/leave.service';
import { EmployeeService } from '../../services/employee.service';
import { MailgunService } from '../../services/mailgun.service';
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
  const managerId = c.get('employeeId') as string; // Admin who is approving — from the verified JWT, never a client header

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

  if (!updated) {
    return c.json({ error: 'Leave request not found, or it has already been decided' }, 409);
  }

  if (updated && (payload.status === 'approved' || payload.status === 'rejected')) {
    new EmployeeService(c.env.DB)
      .getEmployeeProfile(companyId, updated.employeeId)
      .then((emp) => {
        if (emp?.email) {
          return new MailgunService(c.env.DB, c.env).sendLeaveStatusEmail(companyId, {
            email: emp.email,
            firstName: emp.name,
            leaveType: updated.type,
            startDate: updated.startDate,
            endDate: updated.endDate,
            approverName: 'HR / Manager',
            status: payload.status as 'approved' | 'rejected',
            rejectionReason: payload.managerComment,
          });
        }
      })
      .catch(() => {});
  }
  
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

export const getEmployeeLeaveRequests = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId') as string;
  const employeeId = c.req.param('id') as string;
  const leaveService = new LeaveService(c.env.DB);
  
  const requests = await leaveService.getEmployeeLeaveRequests(companyId, employeeId);
  return c.json(requests);
};
