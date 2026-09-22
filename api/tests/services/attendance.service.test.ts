import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AttendanceService } from '../../src/services/attendance.service';

describe('Attendance Service', () => {
  let mockDb: any;
  let service: AttendanceService;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    // Set fixed time to 10:00 AM
    vi.setSystemTime(new Date('2023-10-15T10:00:00'));

    mockDb = {
      query: {
        companySettings: {
          findFirst: vi.fn().mockResolvedValue({
            attendanceStartTime: '09:00',
            attendanceEndTime: '17:00',
            attendanceGraceMinutes: 15,
          }),
        },
        attendanceRecords: {
          findMany: vi.fn(),
          findFirst: vi.fn(),
        },
      },
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      all: vi.fn().mockReturnThis(),
    };

    service = new AttendanceService({} as any);
    (service as any).db = mockDb;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Attendance Policy', () => {
    it('should fallback to default policy if settings not found', async () => {
      mockDb.query.companySettings.findFirst.mockResolvedValueOnce(undefined);
      const policy = await service.getAttendancePolicy('comp-1');
      expect(policy.attendanceStartTime).toBe('09:00');
      expect(policy.attendanceGraceMinutes).toBe(15);
    });

    it('should return configured policy', async () => {
      mockDb.query.companySettings.findFirst.mockResolvedValueOnce({
        attendanceStartTime: '08:00',
        attendanceEndTime: '16:00',
        attendanceGraceMinutes: 30,
      });
      const policy = await service.getAttendancePolicy('comp-1');
      expect(policy.attendanceStartTime).toBe('08:00');
      expect(policy.attendanceGraceMinutes).toBe(30);
    });
  });

  describe('Clock In / Clock Out', () => {
    it('should clock in and mark as late if past grace period', async () => {
      // 10:00 AM is past 09:15 AM (09:00 + 15m grace)
      mockDb.returning.mockResolvedValueOnce([{ id: 'ATT-123', status: 'late' }]);
      
      const result = await service.clockIn('comp-1', 'emp-1', { location: 'Office' });
      
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalled();
      const insertArgs = mockDb.values.mock.calls[0][0];
      expect(insertArgs.status).toBe('late');
      expect(result.status).toBe('late');
    });

    it('should clock in and mark as present if within grace period', async () => {
      vi.setSystemTime(new Date('2023-10-15T09:10:00')); // 9:10 AM is within 9:15 AM grace
      mockDb.returning.mockResolvedValueOnce([{ id: 'ATT-124', status: 'present' }]);
      
      const result = await service.clockIn('comp-1', 'emp-1', { location: 'Office' });
      
      const insertArgs = mockDb.values.mock.calls[0][0];
      expect(insertArgs.status).toBe('present');
    });

    it('should throw error on clock out if no active session', async () => {
      mockDb.query.attendanceRecords.findMany.mockResolvedValueOnce([]); // No active session
      await expect(service.clockOut('comp-1', 'emp-1', {})).rejects.toThrow('No active clock in record found for today');
    });

    it('should clock out and calculate work hours correctly', async () => {
      // Mock clocking in at 09:00 AM
      const clockInTime = new Date('2023-10-15T09:00:00').toISOString();
      mockDb.query.attendanceRecords.findMany.mockResolvedValueOnce([
        { id: 'ATT-1', clockIn: clockInTime }
      ]);
      
      // Clocking out at 17:00 (8 hours later)
      vi.setSystemTime(new Date('2023-10-15T17:00:00'));
      mockDb.returning.mockResolvedValueOnce([{ id: 'ATT-1', workHours: 8, overtime: 0 }]);

      const result = await service.clockOut('comp-1', 'emp-1', {});
      
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalled();
      const setArgs = mockDb.set.mock.calls[0][0];
      expect(setArgs.workHours).toBe(8);
      expect(setArgs.overtime).toBe(0);
    });

    it('should calculate overtime if work hours exceed shift hours', async () => {
      // Mock clocking in at 08:00 AM
      const clockInTime = new Date('2023-10-15T08:00:00').toISOString();
      mockDb.query.attendanceRecords.findMany.mockResolvedValueOnce([
        { id: 'ATT-1', clockIn: clockInTime }
      ]);
      
      // Clocking out at 18:00 (10 hours later)
      vi.setSystemTime(new Date('2023-10-15T18:00:00'));
      
      await service.clockOut('comp-1', 'emp-1', {});
      
      const setArgs = mockDb.set.mock.calls[0][0];
      expect(setArgs.workHours).toBe(10);
      expect(setArgs.overtime).toBe(2); // (10 hours - 8 hour shift = 2 hrs overtime)
    });
  });

  describe('Timezone & Date Handling (Africa/Lagos WAT)', () => {
    it('correctly handles clock in evaluation using Africa/Lagos time', async () => {
      // 08:10:00Z UTC is 09:10:00 WAT (within 09:15 grace period)
      vi.setSystemTime(new Date('2023-10-15T08:10:00.000Z'));
      mockDb.returning.mockResolvedValueOnce([{ id: 'ATT-WAT-1', status: 'present' }]);
      
      await service.clockIn('comp-1', 'emp-1', { location: 'Lagos HQ' });
      let insertArgs = mockDb.values.mock.calls[0][0];
      expect(insertArgs.status).toBe('present');

      // 08:20:00Z UTC is 09:20:00 WAT (after 09:15 grace period -> late)
      vi.setSystemTime(new Date('2023-10-15T08:20:00.000Z'));
      mockDb.returning.mockResolvedValueOnce([{ id: 'ATT-WAT-2', status: 'late' }]);
      
      await service.clockIn('comp-1', 'emp-1', { location: 'Lagos HQ' });
      insertArgs = mockDb.values.mock.calls[1][0];
      expect(insertArgs.status).toBe('late');
    });

    it('correctly rolls over the calendar date in Africa/Lagos ahead of UTC', () => {
      // At 23:30 UTC on Oct 15, it is already 00:30 on Oct 16 in Lagos (UTC+1)
      const lateUtc = new Date('2023-10-15T23:30:00.000Z');
      const lagosDate = service.getTodayDate(lateUtc);
      expect(lagosDate).toBe('2023-10-16');
    });
  });
});
