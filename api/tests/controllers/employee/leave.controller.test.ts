import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as leaveController from '../../../src/controllers/employee/leave.controller';
import { LeaveService } from '../../../src/services/leave.service';

vi.mock('../../../src/services/leave.service');

describe('Employee Leave Controller', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    LeaveService.prototype.getEmployeeLeaveRequests = vi.fn();
    LeaveService.prototype.calculateLeaveBalances = vi.fn();
    LeaveService.prototype.createLeaveRequest = vi.fn();
    LeaveService.prototype.getTeamLeaves = vi.fn();
    LeaveService.prototype.getPendingTeamLeaveRequests = vi.fn();
    LeaveService.prototype.updateLeaveRequestStatus = vi.fn();

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

  it('getMyLeaveData should return requests and balances', async () => {
    mockContext.get.mockImplementation((k: string) => {
      if (k === 'companyId') return 'comp-1';
      if (k === 'employeeId') return 'emp-1';
    });
    (LeaveService.prototype.getEmployeeLeaveRequests as any).mockResolvedValue([{ id: 'req-1' }]);
    (LeaveService.prototype.calculateLeaveBalances as any).mockResolvedValue([{ id: 'bal-1' }]);

    await leaveController.getMyLeaveData(mockContext);
    expect(LeaveService.prototype.getEmployeeLeaveRequests).toHaveBeenCalledWith('comp-1', 'emp-1');
    expect(LeaveService.prototype.calculateLeaveBalances).toHaveBeenCalledWith('comp-1', 'emp-1');
  });

  it('applyForLeave should apply', async () => {
    mockContext.get.mockImplementation((k: string) => {
      if (k === 'companyId') return 'comp-1';
      if (k === 'employeeId') return 'emp-1';
    });
    mockContext.req.json.mockResolvedValue({ typeId: 't-1' });
    (LeaveService.prototype.createLeaveRequest as any).mockResolvedValue({ id: 'req-1' });

    const res = await leaveController.applyForLeave(mockContext);
    expect(LeaveService.prototype.createLeaveRequest).toHaveBeenCalled();
  });

  describe('getTeamLeaves', () => {
    it('returns 401 when there is no authenticated employee', async () => {
      mockContext.get.mockImplementation((k: string) => (k === 'companyId' ? 'comp-1' : undefined));

      const res = await leaveController.getTeamLeaves(mockContext);

      expect(res.status).toBe(401);
      expect(LeaveService.prototype.getTeamLeaves).not.toHaveBeenCalled();
    });

    it('scopes the call to the caller\'s own companyId and employeeId', async () => {
      mockContext.get.mockImplementation((k: string) => {
        if (k === 'companyId') return 'comp-1';
        if (k === 'employeeId') return 'emp-1';
      });
      (LeaveService.prototype.getTeamLeaves as any).mockResolvedValue([{ id: 'lr-1' }]);

      await leaveController.getTeamLeaves(mockContext);

      expect(LeaveService.prototype.getTeamLeaves).toHaveBeenCalledWith('comp-1', 'emp-1');
    });
  });
});
