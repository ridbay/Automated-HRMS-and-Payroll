import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as attendanceController from './attendance.controller';
import { AttendanceService } from '../../services/attendance.service';

vi.mock('../../services/attendance.service');

describe('Admin Attendance Controller', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    AttendanceService.prototype.getCompanyAttendance = vi.fn();
    AttendanceService.prototype.getAttendanceSummary = vi.fn();
    AttendanceService.prototype.createManualAttendanceRecord = vi.fn();
    AttendanceService.prototype.updateAttendanceRecord = vi.fn();
    AttendanceService.prototype.deleteAttendanceRecord = vi.fn();
    AttendanceService.prototype.getAllOvertimeRequests = vi.fn();
    AttendanceService.prototype.updateOvertimeRequestStatus = vi.fn();
    AttendanceService.prototype.getAttendancePolicy = vi.fn();
    AttendanceService.prototype.updateAttendancePolicy = vi.fn();

    mockContext = {
      req: {
        query: vi.fn(),
        param: vi.fn(),
        json: vi.fn(),
      },
      env: { DB: {} },
      get: vi.fn(),
      json: vi.fn((data, status) => ({ data, status })),
    };
  });

  it('getAllAttendance should fetch company attendance', async () => {
    mockContext.get.mockImplementation((k: string) => {
      if (k === 'companyId') return 'comp-1';
      if (k === 'role') return 'SUPER_ADMIN';
    });
    (AttendanceService.prototype.getCompanyAttendance as any).mockResolvedValue([{ id: 'att-1' }]);

    await attendanceController.getAllAttendance(mockContext);
    expect(AttendanceService.prototype.getCompanyAttendance).toHaveBeenCalledWith('comp-1', expect.any(Object));
    expect(mockContext.json).toHaveBeenCalledWith([{ id: 'att-1' }]);
  });

  it('getAttendanceSummary should fetch summary', async () => {
    mockContext.get.mockReturnValue('comp-1');
    mockContext.req.query.mockReturnValue('2023-10-10');
    (AttendanceService.prototype.getAttendanceSummary as any).mockResolvedValue({ total: 10 });

    await attendanceController.getAttendanceSummary(mockContext);
    expect(AttendanceService.prototype.getAttendanceSummary).toHaveBeenCalledWith('comp-1', '2023-10-10', undefined);
  });

  it('createAttendanceRecord should create record', async () => {
    mockContext.get.mockReturnValue('comp-1');
    mockContext.req.json.mockResolvedValue({ status: 'present' });
    (AttendanceService.prototype.createManualAttendanceRecord as any).mockResolvedValue({ id: 'att-1' });

    const res = await attendanceController.createAttendanceRecord(mockContext);
    expect(AttendanceService.prototype.createManualAttendanceRecord).toHaveBeenCalledWith('comp-1', { status: 'present' });
    expect(res.status).toBe(201);
  });
});
