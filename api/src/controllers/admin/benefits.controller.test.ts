import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as benefitsController from './benefits.controller';
import { BenefitsService } from '../../services/benefits.service';

vi.mock('../../services/benefits.service');
vi.mock('drizzle-orm/d1', () => ({
  drizzle: vi.fn(() => ({
    query: {
      employees: { findFirst: vi.fn().mockResolvedValue({ name: 'Admin', lastName: 'User' }) }
    }
  }))
}));

describe('Admin Benefits Controller', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    BenefitsService.prototype.getBenefitsRecord = vi.fn();
    BenefitsService.prototype.upsertBenefitsRecord = vi.fn();
    BenefitsService.prototype.listPlans = vi.fn();
    BenefitsService.prototype.createPlan = vi.fn();
    BenefitsService.prototype.updatePlan = vi.fn();
    BenefitsService.prototype.deletePlan = vi.fn();
    BenefitsService.prototype.listEnrollments = vi.fn();
    BenefitsService.prototype.enroll = vi.fn();
    BenefitsService.prototype.setEnrollmentStatus = vi.fn();
    BenefitsService.prototype.listPrograms = vi.fn();
    BenefitsService.prototype.createProgram = vi.fn();
    BenefitsService.prototype.updateProgram = vi.fn();
    BenefitsService.prototype.deleteProgram = vi.fn();
    BenefitsService.prototype.listProgramParticipants = vi.fn();
    BenefitsService.prototype.listClaims = vi.fn();
    BenefitsService.prototype.reviewClaim = vi.fn();
    BenefitsService.prototype.getAdminOverview = vi.fn();

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

  it('getEmployeeBenefits should return record', async () => {
    mockContext.get.mockReturnValue('comp-1');
    mockContext.req.param.mockReturnValue('emp-1');
    (BenefitsService.prototype.getBenefitsRecord as any).mockResolvedValue({ id: 'ben-1' });

    await benefitsController.getEmployeeBenefits(mockContext);
    expect(BenefitsService.prototype.getBenefitsRecord).toHaveBeenCalledWith('comp-1', 'emp-1');
  });

  it('createPlan should create plan', async () => {
    mockContext.get.mockReturnValue('comp-1');
    mockContext.req.json.mockResolvedValue({ name: 'Plan' });
    (BenefitsService.prototype.createPlan as any).mockResolvedValue({ id: 'plan-1' });

    const res = await benefitsController.createPlan(mockContext);
    expect(BenefitsService.prototype.createPlan).toHaveBeenCalledWith('comp-1', { name: 'Plan' });
    expect(res.status).toBe(201);
  });

  it('reviewClaim should review claim with actor', async () => {
    mockContext.get.mockImplementation((k: string) => {
      if (k === 'companyId') return 'comp-1';
      if (k === 'employeeId') return 'emp-1';
    });
    mockContext.req.param.mockReturnValue('claim-1');
    mockContext.req.json.mockResolvedValue({ status: 'approved', notes: 'ok' });
    (BenefitsService.prototype.reviewClaim as any).mockResolvedValue({ id: 'claim-1', status: 'approved' });

    await benefitsController.reviewClaim(mockContext);
    expect(BenefitsService.prototype.reviewClaim).toHaveBeenCalledWith(
      'comp-1', 'claim-1', 'approved', { id: 'emp-1', name: 'Admin User' }, 'ok'
    );
  });
});
