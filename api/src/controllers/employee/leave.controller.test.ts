import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as leaveController from './leave.controller';
import { LeaveService } from '../../services/leave.service';

vi.mock('../../services/leave.service');

describe('Employee Leave Controller', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    LeaveService.prototype.getEmployeeLeaveRequests = vi.fn();
    LeaveService.prototype.calculateLeaveBalances = vi.fn();
    LeaveService.prototype.createLeaveRequest = vi.fn();
    LeaveService.prototype.getTeamLeaves = vi.fn();
    LeaveService.prototype.getTeamPendingLeaves = vi.fn();
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
});
