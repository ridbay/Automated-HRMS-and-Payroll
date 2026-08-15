import { Context } from 'hono';
import { AttendanceService } from '../../services/attendance.service';
import { AppEnv } from '../../types';

// GET / and GET /summary also admit MANAGER (see attendance-admin.routes.ts) — in
// that case results are narrowed to the caller's own direct reports, same as the
// employee-scoped /employee/attendance/team* routes narrow by managerId.
export const getAllAttendance = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId') as string;
  const role = c.get('role');
  const employeeId = c.get('employeeId');
  const attendanceService = new AttendanceService(c.env.DB);

  const records = await attendanceService.getCompanyAttendance(companyId, {
    date: c.req.query('date'),
    from: c.req.query('from'),
    to: c.req.query('to'),
    employeeId: c.req.query('employeeId'),
    managerId: role === 'MANAGER' ? employeeId : undefined,
  });
  return c.json(records);
};

export const getAttendanceSummary = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId') as string;
  const role = c.get('role');
  const employeeId = c.get('employeeId');
  const date = c.req.query('date') || new Date().toISOString().split('T')[0];
  const attendanceService = new AttendanceService(c.env.DB);
  const summary = await attendanceService.getAttendanceSummary(companyId, date, role === 'MANAGER' ? employeeId : undefined);
  return c.json(summary);
};

export const createAttendanceRecord = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId') as string;
  const payload = await c.req.json();
  const attendanceService = new AttendanceService(c.env.DB);
  const record = await attendanceService.createManualAttendanceRecord(companyId, payload);
  return c.json(record, 201);
};

export const updateAttendanceRecord = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId') as string;
  const id = c.req.param('id') as string;
  const payload = await c.req.json();
  const attendanceService = new AttendanceService(c.env.DB);
  const updated = await attendanceService.updateAttendanceRecord(companyId, id, payload);
  if (!updated) return c.json({ error: 'Attendance record not found' }, 404);
  return c.json(updated);
};

export const deleteAttendanceRecord = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId') as string;
  const id = c.req.param('id') as string;
  const attendanceService = new AttendanceService(c.env.DB);
  const deleted = await attendanceService.deleteAttendanceRecord(companyId, id);
  if (!deleted) return c.json({ error: 'Attendance record not found' }, 404);
  return c.json(deleted);
};

export const getOvertimeRequests = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId') as string;
  const attendanceService = new AttendanceService(c.env.DB);
  const requests = await attendanceService.getAllOvertimeRequests(companyId, {
    status: c.req.query('status'),
  });
  return c.json(requests);
};

export const updateOvertimeStatus = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId') as string;
  const requestId = c.req.param('id') as string;
  const payload = await c.req.json();
  const managerId = c.get('employeeId') as string; // Admin who is approving

  const attendanceService = new AttendanceService(c.env.DB);
  const updated = await attendanceService.updateOvertimeRequestStatus(companyId, requestId, {
    status: payload.status,
    managerComment: payload.managerComment,
    hours: payload.hours,
    managerId,
  });
  if (!updated) return c.json({ error: 'Overtime request not found' }, 404);
  return c.json(updated);
};

export const getAttendancePolicy = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId') as string;
  const attendanceService = new AttendanceService(c.env.DB);
  const policy = await attendanceService.getAttendancePolicy(companyId);
  return c.json(policy);
};

export const updateAttendancePolicy = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId') as string;
  const payload = await c.req.json();
  const attendanceService = new AttendanceService(c.env.DB);
  const updated = await attendanceService.updateAttendancePolicy(companyId, payload);
  return c.json(updated);
};
