import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as payrollController from '../../../src/controllers/admin/payroll.controller';
import { PayrollService } from '../../../src/services/payroll.service';

vi.mock('../../../src/services/payroll.service');

describe('Admin Payroll Controller', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    PayrollService.prototype.getSettings = vi.fn();
    PayrollService.prototype.getLoans = vi.fn();
    PayrollService.prototype.createLoan = vi.fn();
    PayrollService.prototype.previewRun = vi.fn();
    PayrollService.prototype.submitRun = vi.fn();
    PayrollService.prototype.getBankFile = vi.fn();

    mockContext = {
      req: {
        query: vi.fn(),
        param: vi.fn(),
        json: vi.fn(),
      },
      env: { DB: {} },
      get: vi.fn(),
      json: vi.fn((data, status) => ({ data, status })),
      header: vi.fn(),
    };
  });

  it('getPayrollSettings should fetch settings', async () => {
    mockContext.get.mockReturnValue('comp-1');
    (PayrollService.prototype.getSettings as any).mockResolvedValue({ id: 'set-1' });

    await payrollController.getPayrollSettings(mockContext);
    expect(PayrollService.prototype.getSettings).toHaveBeenCalledWith('comp-1');
  });

  it('createLoan should create loan', async () => {
    mockContext.get.mockReturnValue('comp-1');
    mockContext.req.json.mockResolvedValue({ employeeId: 'emp-1', principal: 1000 });
    (PayrollService.prototype.createLoan as any).mockResolvedValue({ id: 'loan-1' });

    const res = await payrollController.createLoan(mockContext);
    expect(PayrollService.prototype.createLoan).toHaveBeenCalled();
    expect(res.status).toBe(201);
  });

  it('previewPayroll should generate preview', async () => {
    mockContext.get.mockReturnValue('comp-1');
    mockContext.req.query.mockImplementation((k: string) => {
      if (k === 'month') return '10';
      if (k === 'year') return '2023';
    });
    (PayrollService.prototype.previewRun as any).mockResolvedValue({ totalGross: 10000 });

    await payrollController.previewPayroll(mockContext);
    expect(PayrollService.prototype.previewRun).toHaveBeenCalled();
  });

  it('getBankFile should return csv', async () => {
    mockContext.get.mockReturnValue('comp-1');
    mockContext.req.param.mockReturnValue('run-1');
    (PayrollService.prototype.getBankFile as any).mockResolvedValue({ filename: 'test.csv', content: 'csv' });

    await payrollController.getBankFile(mockContext);
    expect(mockContext.header).toHaveBeenCalledWith('Content-Type', 'text/csv');
  });
});
