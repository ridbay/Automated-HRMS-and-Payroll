import { Context } from 'hono';
import { AttendanceService } from '../../services/attendance.service';
import { EmployeeService } from '../../services/employee.service';
import { AppEnv } from '../../types';

export const getAttendanceData = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  let employeeId = c.req.header('x-employee-id');
  
  const attendanceService = new AttendanceService(c.env.DB);
  const employeeService = new EmployeeService(c.env.DB);

  if (!employeeId) {
    const defaultId = await employeeService.getFirstEmployeeId(companyId);
    if (!defaultId) return c.json({ error: 'No employee found' }, 404);
    employeeId = defaultId;
  }

  const todaySessions = await attendanceService.getTodaySessions(companyId, employeeId);
  const activeSession = await attendanceService.getActiveSession(companyId, employeeId);
  const history = await attendanceService.getEmployeeAttendance(companyId, employeeId);

  const totalWorkHours = todaySessions.reduce((sum: number, s: any) => sum + (s.workHours || 0), 0);

  return c.json({ activeSession, todaySessions, totalWorkHours, history });
};

export const clockIn = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  let employeeId = c.req.header('x-employee-id');
  
  const attendanceService = new AttendanceService(c.env.DB);
  const employeeService = new EmployeeService(c.env.DB);

  if (!employeeId) {
    const defaultId = await employeeService.getFirstEmployeeId(companyId);
    if (!defaultId) return c.json({ error: 'No employee found' }, 404);
    employeeId = defaultId;
  }

  const data = await c.req.json();
  
  // Check if already clocked in right now
  const currentActive = await attendanceService.getActiveSession(companyId, employeeId);
  if (currentActive) {
    return c.json({ error: 'You are already clocked in' }, 400);
  }

  const request = await attendanceService.clockIn(companyId, employeeId, data);
  return c.json(request);
};

export const clockOut = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  let employeeId = c.req.header('x-employee-id');
  
  const attendanceService = new AttendanceService(c.env.DB);
  const employeeService = new EmployeeService(c.env.DB);

  if (!employeeId) {
    const defaultId = await employeeService.getFirstEmployeeId(companyId);
    if (!defaultId) return c.json({ error: 'No employee found' }, 404);
    employeeId = defaultId;
  }

  const data = await c.req.json();
  const request = await attendanceService.clockOut(companyId, employeeId, data);
  
  return c.json(request);
};

export const getOvertimeRequests = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  let employeeId = c.req.header('x-employee-id');
  
  const attendanceService = new AttendanceService(c.env.DB);
  const employeeService = new EmployeeService(c.env.DB);

  if (!employeeId) {
    const defaultId = await employeeService.getFirstEmployeeId(companyId);
    if (!defaultId) return c.json({ error: 'No employee found' }, 404);
    employeeId = defaultId;
  }

  const overtimeRequests = await attendanceService.getOvertimeRequests(companyId, employeeId);
  return c.json(overtimeRequests);
};

export const submitOvertimeRequest = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  let employeeId = c.req.header('x-employee-id');
  
  const attendanceService = new AttendanceService(c.env.DB);
  const employeeService = new EmployeeService(c.env.DB);

  if (!employeeId) {
    const defaultId = await employeeService.getFirstEmployeeId(companyId);
    if (!defaultId) return c.json({ error: 'No employee found' }, 404);
    employeeId = defaultId;
  }

  const data = await c.req.json();
  const result = await attendanceService.createOvertimeRequest({
    ...data,
    companyId,
    employeeId
  });

  return c.json(result);
};
