import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LeaveService } from './leave.service';

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
      returning: vi.fn().mockResolvedValue([{ id: 'lr-1', status: 'approved' }]),
      query: {
        leaveRequests: { findFirst: vi.fn() },
        employees: { findFirst: vi.fn() },
      },
    };

    service = new LeaveService({} as any);
    (service as any).db = mockDb;
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
});
