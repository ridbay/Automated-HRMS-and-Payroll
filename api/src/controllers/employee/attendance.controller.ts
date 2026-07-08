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

  const todayRecord = await attendanceService.getTodayAttendance(companyId, employeeId);
  const history = await attendanceService.getEmployeeAttendance(companyId, employeeId);

  return c.json({ today: todayRecord, history });
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
  
  // Check if already clocked in today
  const currentRecord = await attendanceService.getTodayAttendance(companyId, employeeId);
  if (currentRecord) {
    return c.json({ error: 'Already clocked in today' }, 400);
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
