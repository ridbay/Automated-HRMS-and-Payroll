import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as requisitionController from './requisition.controller';
import { RequisitionService } from '../../services/requisition.service';

vi.mock('../../services/requisition.service');
vi.mock('drizzle-orm/d1', () => ({
  drizzle: vi.fn(() => ({
    query: {
      employees: { findFirst: vi.fn().mockResolvedValue({ name: 'Admin', lastName: 'User' }) }
    }
  }))
}));

describe('Admin Requisition Controller', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    RequisitionService.prototype.getAllByCompany = vi.fn();
    RequisitionService.prototype.create = vi.fn();
    RequisitionService.prototype.updateStatus = vi.fn();
    RequisitionService.prototype.approve = vi.fn();

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

  it('getAllRequisitions should fetch requisitions', async () => {
    mockContext.get.mockReturnValue('comp-1');
    (RequisitionService.prototype.getAllByCompany as any).mockResolvedValue([{ id: 'req-1' }]);

    await requisitionController.getAllRequisitions(mockContext);
    expect(RequisitionService.prototype.getAllByCompany).toHaveBeenCalled();
  });

  it('approveRequisition should approve', async () => {
    mockContext.get.mockImplementation((k: string) => {
      if (k === 'companyId') return 'comp-1';
      if (k === 'employeeId') return 'emp-1';
    });
    mockContext.req.param.mockReturnValue('req-1');
    mockContext.req.json.mockResolvedValue({ notes: 'ok' });
    (RequisitionService.prototype.approve as any).mockResolvedValue({ id: 'req-1', status: 'Approved' });

    await requisitionController.approveRequisition(mockContext);
    expect(RequisitionService.prototype.approve).toHaveBeenCalled();
  });
});
