import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReportsService } from './reports.service';

describe('Reports Service', () => {
  let mockDb: any;
  let service: ReportsService;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2023-10-20T10:00:00'));

    mockDb = {
      query: {
        employees: { findMany: vi.fn().mockResolvedValue([]) },
        transitions: { findMany: vi.fn().mockResolvedValue([]) },
        jobRequisitions: { findMany: vi.fn().mockResolvedValue([]) },
        payrollRuns: { findMany: vi.fn().mockResolvedValue([]), findFirst: vi.fn().mockResolvedValue(null) },
        complianceTasks: { findMany: vi.fn().mockResolvedValue([]) },
        leaveRequests: { findMany: vi.fn().mockResolvedValue([]) },
        attendanceRecords: { findMany: vi.fn().mockResolvedValue([]) },
        overtimeRequests: { findMany: vi.fn().mockResolvedValue([]) },
        goals: { findMany: vi.fn().mockResolvedValue([]) },
        assessments: { findMany: vi.fn().mockResolvedValue([]) },
        payslips: { findMany: vi.fn().mockResolvedValue([]) },
      }
    };

    service = new ReportsService({} as any);
    (service as any).db = mockDb;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getWorkforceReport', () => {
    it('should aggregate employee statistics correctly', async () => {
      mockDb.query.employees.findMany.mockResolvedValueOnce([
        { id: 'emp-1', status: 'active', department: 'Engineering', gender: 'Female', hireDate: '2023-01-01' },
        { id: 'emp-2', status: 'active', department: 'Engineering', gender: 'Male', hireDate: '2023-10-05' },
        { id: 'emp-3', status: 'terminated', department: 'Sales' }, // Excluded from current
      ]);

      const result = await service.getWorkforceReport('comp-1');

      expect(result.summary.totalHeadcount).toBe(2);
      expect(result.summary.activeCount).toBe(2);
      expect(result.summary.newHiresThisMonth).toBe(1); // 2023-10
      expect(result.departmentDistribution).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: 'Engineering', value: 2 })
      ]));
    });

    it('should return empty report if employeeIds array is empty', async () => {
      const result = await service.getWorkforceReport('comp-1', { employeeIds: [] });
      expect(result.summary.totalHeadcount).toBe(0);
      expect(mockDb.query.employees.findMany).not.toHaveBeenCalled();
    });
  });

  describe('getRecruitmentReport', () => {
    it('should aggregate job requisitions correctly', async () => {
      mockDb.query.jobRequisitions.findMany.mockResolvedValueOnce([
        { id: 'req-1', status: 'Open', dateOpened: '2023-10-15' },
        { id: 'req-2', status: 'Filled', dateOpened: '2023-10-01', updatedAt: '2023-10-20' },
      ]);

      const result = await service.getRecruitmentReport('comp-1');

      expect(result.summary.totalRequisitions).toBe(2);
      expect(result.summary.openPositions).toBe(1);
      expect(result.summary.filledThisMonth).toBe(1);
      expect(result.summary.avgDaysOpen).toBe(5); // 15th to 20th
      expect(result.summary.avgTimeToFill).toBe(19); // 1st to 20th
    });
  });

  describe('exportCsv', () => {
    it('should generate employees CSV', async () => {
      mockDb.query.employees.findMany.mockResolvedValueOnce([
        { id: 'emp-1', name: 'John', lastName: 'Doe', email: 'john@example.com', salary: 10000 }
      ]);

      const result = await service.exportCsv('comp-1', 'employees');
      
      expect(result?.filename).toMatch(/^workforce-export-.*\.csv$/);
      expect(result?.content).toContain('Employee ID,First Name,Last Name');
      expect(result?.content).toContain('emp-1,John,Doe,john@example.com');
    });

    it('should handle CSV escaping', async () => {
      mockDb.query.employees.findMany.mockResolvedValueOnce([
        { id: 'emp-1', name: 'John, Jr.', lastName: '"JD" Doe' }
      ]);

      const result = await service.exportCsv('comp-1', 'employees');
      // John, Jr. -> "John, Jr."
      // "JD" Doe -> """JD"" Doe"
      expect(result?.content).toContain('"John, Jr.","""JD"" Doe"');
    });
  });
});
