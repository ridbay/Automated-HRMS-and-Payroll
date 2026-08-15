import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as benefitsController from './benefits.controller';
import { BenefitsService } from '../../services/benefits.service';

vi.mock('../../services/benefits.service');

describe('Employee Benefits Controller', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    BenefitsService.prototype.getMySummary = vi.fn();
    BenefitsService.prototype.listAvailablePlans = vi.fn();
    BenefitsService.prototype.listEnrollments = vi.fn();
    BenefitsService.prototype.enroll = vi.fn();
    BenefitsService.prototype.setEnrollmentStatus = vi.fn();

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

  it('getMySummary should fetch summary', async () => {
    mockContext.get.mockImplementation((k: string) => {
      if (k === 'companyId') return 'comp-1';
      if (k === 'employeeId') return 'emp-1';
    });
    (BenefitsService.prototype.getMySummary as any).mockResolvedValue({ total: 1 });

    await benefitsController.getMySummary(mockContext);
    expect(BenefitsService.prototype.getMySummary).toHaveBeenCalled();
  });

  it('enrollInPlan should enroll', async () => {
    mockContext.get.mockImplementation((k: string) => {
      if (k === 'companyId') return 'comp-1';
      if (k === 'employeeId') return 'emp-1';
    });
    mockContext.req.json.mockResolvedValue({ planId: 'plan-1' });
    (BenefitsService.prototype.enroll as any).mockResolvedValue({ id: 'enr-1' });

    const res = await benefitsController.enrollInPlan(mockContext);
    expect(BenefitsService.prototype.enroll).toHaveBeenCalled();
    expect(res.status).toBe(201);
  });
});
