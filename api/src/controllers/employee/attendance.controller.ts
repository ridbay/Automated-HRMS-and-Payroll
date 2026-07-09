import { Context } from 'hono';
import { AttendanceService } from '../../services/attendance.service';
import { AppEnv } from '../../types';

export const getAttendanceData = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.get('employeeId');

  if (!employeeId) {
    return c.json({ error: 'Unauthorized: No employee ID found' }, 401);
  }

  const attendanceService = new AttendanceService(c.env.DB);
  const todaySessions = await attendanceService.getTodaySessions(companyId, employeeId);
  const activeSession = await attendanceService.getActiveSession(companyId, employeeId);
  const history = await attendanceService.getEmployeeAttendance(companyId, employeeId);

  const totalWorkHours = todaySessions.reduce((sum: number, s: any) => sum + (s.workHours || 0), 0);

  return c.json({ activeSession, todaySessions, totalWorkHours, history });
};

export const clockIn = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.get('employeeId');

  if (!employeeId) {
    return c.json({ error: 'Unauthorized: No employee ID found' }, 401);
  }

  const attendanceService = new AttendanceService(c.env.DB);
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
  const employeeId = c.get('employeeId');

  if (!employeeId) {
    return c.json({ error: 'Unauthorized: No employee ID found' }, 401);
  }

  const attendanceService = new AttendanceService(c.env.DB);
  const data = await c.req.json();
  const request = await attendanceService.clockOut(companyId, employeeId, data);

  return c.json(request);
};

export const getOvertimeRequests = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.get('employeeId');

  if (!employeeId) {
    return c.json({ error: 'Unauthorized: No employee ID found' }, 401);
  }

  const attendanceService = new AttendanceService(c.env.DB);
  const overtimeRequests = await attendanceService.getOvertimeRequests(companyId, employeeId);
  return c.json(overtimeRequests);
};

export const submitOvertimeRequest = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.get('employeeId');

  if (!employeeId) {
    return c.json({ error: 'Unauthorized: No employee ID found' }, 401);
  }

  const attendanceService = new AttendanceService(c.env.DB);
  const data = await c.req.json();
  const result = await attendanceService.createOvertimeRequest({
    ...data,
    companyId,
    employeeId
  });

  return c.json(result);
};
