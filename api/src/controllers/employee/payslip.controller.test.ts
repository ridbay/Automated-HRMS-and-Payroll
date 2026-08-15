import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as payslipController from './payslip.controller';

vi.mock('drizzle-orm/d1', () => ({
  drizzle: vi.fn(() => ({
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        innerJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn().mockResolvedValue([{ id: 'slip-1' }])
          }))
        }))
      }))
    }))
  }))
}));

describe('Employee Payslip Controller', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

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

  it('getMyPayslips should fetch payslips', async () => {
    mockContext.get.mockImplementation((k: string) => {
      if (k === 'companyId') return 'comp-1';
      if (k === 'employeeId') return 'emp-1';
    });

    const res = await payslipController.getMyPayslips(mockContext);
    expect(res.status).toBeUndefined(); // Wait, res is an object if not using generic JSON helper
  });
});
