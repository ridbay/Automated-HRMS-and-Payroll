import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as compensationController from '../../../src/controllers/employee/compensation.controller';
import { BenefitsService } from '../../../src/services/benefits.service';

vi.mock('../../../src/services/benefits.service');

describe('Employee Compensation Controller', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    BenefitsService.prototype.getEmployeeCompensation = vi.fn().mockResolvedValue({
      baseSalary: 5000000,
      benefits: { id: 'ben-1', companyId: 'comp-1', employeeId: 'emp-1' }
    });

    mockContext = {
      req: {
        param: vi.fn(),
        json: vi.fn(),
        query: vi.fn(),
      },
      env: { DB: {} },
      get: vi.fn((k: string) => {
        if (k === 'companyId') return 'comp-1';
        if (k === 'employeeId') return 'emp-1';
        return undefined;
      }),
      json: vi.fn((data, status) => ({ data, status })),
    };
  });

  it('getMyCompensation should return compensation data', async () => {
    const res: any = await compensationController.getMyCompensation(mockContext);
    expect(res.data).toBeDefined();
    expect(res.data.baseSalary).toBe(5000000);
    expect(BenefitsService.prototype.getEmployeeCompensation).toHaveBeenCalledWith('comp-1', 'emp-1');
  });
});
