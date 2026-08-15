import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as leaveController from '../../../src/controllers/admin/leave.controller';
import { LeaveService } from '../../../src/services/leave.service';

vi.mock('../../../src/services/leave.service');

describe('Admin Leave Controller', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    LeaveService.prototype.getAllByCompany = vi.fn();
    LeaveService.prototype.updateLeaveRequestStatus = vi.fn();
    LeaveService.prototype.calculateLeaveBalances = vi.fn();
    LeaveService.prototype.updateEmployeeLeaveBalances = vi.fn();
    LeaveService.prototype.getEmployeeLeaveRequests = vi.fn();

    mockContext = {
      req: {
        param: vi.fn(),
        json: vi.fn(),
        header: vi.fn(),
      },
      env: { DB: {} },
      get: vi.fn(),
      json: vi.fn((data, status) => ({ data, status })),
    };
  });

  it('getAllLeaves should return leaves', async () => {
    mockContext.get.mockReturnValue('comp-1');
    (LeaveService.prototype.getAllByCompany as any).mockResolvedValue([{ id: 'req-1' }]);

    await leaveController.getAllLeaves(mockContext);
    expect(LeaveService.prototype.getAllByCompany).toHaveBeenCalledWith('comp-1');
    expect(mockContext.json).toHaveBeenCalledWith([{ id: 'req-1' }]);
  });

  it('updateLeaveStatus should update status', async () => {
    mockContext.get.mockReturnValue('comp-1');
    mockContext.req.param.mockReturnValue('req-1');
    mockContext.req.header.mockReturnValue('mgr-1');
    mockContext.req.json.mockResolvedValue({ status: 'approved', days: 2, managerComment: 'ok' });
    
    await leaveController.updateLeaveStatus(mockContext);
    expect(LeaveService.prototype.updateLeaveRequestStatus).toHaveBeenCalledWith(
      'comp-1', 'req-1', { status: 'approved', days: 2, managerComment: 'ok', managerId: 'mgr-1' }
    );
  });

  it('updateEmployeeLeaveBalances should update balances', async () => {
    mockContext.get.mockReturnValue('comp-1');
    mockContext.req.param.mockReturnValue('emp-1');
    mockContext.req.json.mockResolvedValue({ balances: [{ id: 'b-1' }] });

    await leaveController.updateEmployeeLeaveBalances(mockContext);
    expect(LeaveService.prototype.updateEmployeeLeaveBalances).toHaveBeenCalledWith('comp-1', 'emp-1', [{ id: 'b-1' }]);
  });
});
