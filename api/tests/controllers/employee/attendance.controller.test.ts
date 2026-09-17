import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as attendanceController from '../../../src/controllers/employee/attendance.controller';
import { AttendanceService } from '../../../src/services/attendance.service';

vi.mock('../../../src/services/attendance.service');

describe('Employee Attendance Controller', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    AttendanceService.prototype.getEmployeeAttendance = vi.fn();
    AttendanceService.prototype.clockIn = vi.fn();
    AttendanceService.prototype.clockOut = vi.fn();

    mockContext = {
      req: {
        query: vi.fn(),
        param: vi.fn(),
        json: vi.fn(),
        header: vi.fn(),
      },
      env: { DB: {} },
      get: vi.fn(),
      json: vi.fn((data, status) => ({ data, status })),
    };
  });

  it('clockIn should clock in', async () => {
    mockContext.get.mockImplementation((k: string) => {
      if (k === 'companyId') return 'comp-1';
      if (k === 'employeeId') return 'emp-1';
    });
    mockContext.req.json.mockResolvedValue({ device: 'web' });
    mockContext.req.header.mockReturnValue('127.0.0.1');
    (AttendanceService.prototype.clockIn as any).mockResolvedValue({ id: 'att-1' });

    await attendanceController.clockIn(mockContext);
    expect(AttendanceService.prototype.clockIn).toHaveBeenCalled();
  });

  it('clockOut should clock out', async () => {
    mockContext.get.mockImplementation((k: string) => {
      if (k === 'companyId') return 'comp-1';
      if (k === 'employeeId') return 'emp-1';
    });
    mockContext.req.json.mockResolvedValue({ device: 'web' });
    mockContext.req.header.mockReturnValue('127.0.0.1');
    (AttendanceService.prototype.clockOut as any).mockResolvedValue({ id: 'att-1' });

    await attendanceController.clockOut(mockContext);
    expect(AttendanceService.prototype.clockOut).toHaveBeenCalled();
  });
});
