import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LeaveService } from '../../src/services/leave.service';

describe('Leave Service — team requests', () => {
  let mockDb: any;
  let service: LeaveService;

  beforeEach(() => {
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      all: vi.fn().mockResolvedValue([
        { id: 'lr-1', employeeId: 'emp-1', name: 'Jane', lastName: 'Doe', status: 'pending' },
      ]),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: 'lr-1', status: 'approved' }]),
      query: {
        leaveRequests: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
        leaveBalances: { findMany: vi.fn().mockResolvedValue([]) },
        employees: { findFirst: vi.fn() },
      },
    };

    service = new LeaveService({} as any);
    (service as any).db = mockDb;
  });

  describe('calculateLeaveBalances', () => {
    // Regression guard: `used` used to be hardcoded to Annual/Sick/Maternity
    // only, so any other type (including a custom one HR adds) always read as
    // 0 used no matter how many days were approved against it.
    it('tracks used days per type generically, including a custom leave type', async () => {
      mockDb.query.leaveRequests.findMany.mockResolvedValue([
        { type: 'Annual Leave', days: 3 },
        { type: 'Annual Leave', days: 2 },
        { type: 'Custom Leave', days: 4 },
      ]);
      mockDb.query.leaveBalances.findMany.mockResolvedValue([
        { type: 'Annual Leave', total: 20, color: 'indigo' },
        { type: 'Custom Leave', total: 10, color: 'slate' },
        { type: 'Sick Leave', total: 10, color: 'rose' },
      ]);

      const result = await service.calculateLeaveBalances('comp-1', 'emp-1');

      expect(result).toEqual([
        { type: 'Annual Leave', total: 20, color: 'indigo', used: 5 },
        { type: 'Custom Leave', total: 10, color: 'slate', used: 4 },
        { type: 'Sick Leave', total: 10, color: 'rose', used: 0 },
      ]);
    });

    it('falls back to the three default balances when none exist yet', async () => {
      mockDb.query.leaveRequests.findMany.mockResolvedValue([]);
      mockDb.query.leaveBalances.findMany.mockResolvedValue([]);

      const result = await service.calculateLeaveBalances('comp-1', 'emp-1');

      expect(result.map((b: any) => b.type)).toEqual(['Annual Leave', 'Sick Leave', 'Maternity Leave']);
      expect(result.every((b: any) => b.used === 0)).toBe(true);
    });
  });

  describe('createLeaveRequest', () => {
    beforeEach(() => {
      // calculateLeaveBalances() dependencies
      mockDb.query.leaveBalances.findMany.mockResolvedValue([
        { type: 'Annual Leave', total: 20, color: 'indigo' },
      ]);
    });

    it('rejects a request that exceeds the remaining balance for that type', async () => {
      mockDb.query.leaveRequests.findMany.mockResolvedValue([
        { type: 'Annual Leave', days: 18, startDate: '2024-01-01', endDate: '2024-01-18' }, // approved/pending already
      ]);

      await expect(
        service.createLeaveRequest('comp-1', 'emp-1', { type: 'Annual Leave', days: 5, startDate: '2024-06-01', endDate: '2024-06-05' })
      ).rejects.toThrow(/Insufficient Annual Leave balance/);
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('rejects a request that overlaps an existing pending/approved request', async () => {
      mockDb.query.leaveRequests.findMany.mockResolvedValue([
        { type: 'Sick Leave', days: 2, startDate: '2024-06-03', endDate: '2024-06-04' },
      ]);

      await expect(
        service.createLeaveRequest('comp-1', 'emp-1', { type: 'Annual Leave', days: 3, startDate: '2024-06-01', endDate: '2024-06-05' })
      ).rejects.toThrow(/overlaps these dates/);
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('creates the request when within balance and non-overlapping', async () => {
      mockDb.query.leaveRequests.findMany.mockResolvedValue([]);
      mockDb.returning.mockResolvedValueOnce([{ id: 'lr-new', status: 'pending' }]);

      const result = await service.createLeaveRequest('comp-1', 'emp-1', { type: 'Annual Leave', days: 3, startDate: '2024-06-01', endDate: '2024-06-03' });

      expect(mockDb.insert).toHaveBeenCalled();
      expect(result).toEqual({ id: 'lr-new', status: 'pending' });
    });
  });

  describe('updateLeaveRequestStatus — state-transition guard', () => {
    it('does not re-decide a request that is no longer pending (compare-and-swap)', async () => {
      // Scoped UPDATE...WHERE status='pending' affects 0 rows once already decided.
      mockDb.returning.mockResolvedValueOnce([]);

      const result = await service.updateLeaveRequestStatus('comp-1', 'lr-1', { status: 'approved', managerId: 'mgr-1' });

      expect(result).toBeUndefined();
    });
  });

  it('should fetch pending leave requests for a manager\'s direct reports', async () => {
    const result = await service.getPendingTeamLeaveRequests('comp-1', 'mgr-1');
    expect(mockDb.innerJoin).toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0].employeeId).toBe('emp-1');
  });

  it('should return null when the leave request does not exist', async () => {
    mockDb.query.leaveRequests.findFirst.mockResolvedValue(undefined);

    const result = await service.updateTeamLeaveRequestStatus('comp-1', 'mgr-1', 'lr-404', { status: 'approved' });

    expect(result).toBeNull();
    expect(mockDb.query.employees.findFirst).not.toHaveBeenCalled();
  });

  it('should return null when the caller is not the requester\'s manager', async () => {
    mockDb.query.leaveRequests.findFirst.mockResolvedValue({ id: 'lr-1', employeeId: 'emp-1' });
    mockDb.query.employees.findFirst.mockResolvedValue({ id: 'emp-1', managerId: 'someone-else' });

    const result = await service.updateTeamLeaveRequestStatus('comp-1', 'mgr-1', 'lr-1', { status: 'approved' });

    expect(result).toBeNull();
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it('should update status when the caller is the requester\'s manager', async () => {
    mockDb.query.leaveRequests.findFirst.mockResolvedValue({ id: 'lr-1', employeeId: 'emp-1' });
    mockDb.query.employees.findFirst.mockResolvedValue({ id: 'emp-1', managerId: 'mgr-1' });

    const result = await service.updateTeamLeaveRequestStatus('comp-1', 'mgr-1', 'lr-1', { status: 'approved', managerComment: 'Enjoy!' });

    expect(mockDb.update).toHaveBeenCalled();
    expect(result).toEqual({ id: 'lr-1', status: 'approved' });
  });

  describe('getTeamLeaves — "Team Calendar" scoped to the caller\'s own department', () => {
    // Regression guard: this used to have no scoping at all and returned every
    // approved leave request company-wide to any authenticated user.
    it('returns [] without querying leave data when the caller cannot be resolved', async () => {
      mockDb.query.employees.findFirst.mockResolvedValue(undefined);

      const result = await service.getTeamLeaves('comp-1', 'emp-404');

      expect(result).toEqual([]);
      expect(mockDb.select).not.toHaveBeenCalled();
    });

    it('looks up the caller and scopes the query, not returning company-wide data unconditionally', async () => {
      mockDb.query.employees.findFirst.mockResolvedValue({ id: 'emp-1', department: 'Engineering' });

      const result = await service.getTeamLeaves('comp-1', 'emp-1');

      expect(mockDb.query.employees.findFirst).toHaveBeenCalled();
      expect(mockDb.innerJoin).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });
});
