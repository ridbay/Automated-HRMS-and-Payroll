import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as payrollController from '../../../src/controllers/admin/payroll.controller';
import { PayrollService } from '../../../src/services/payroll.service';
import { MonnifyService } from '../../../src/services/monnify.service';

vi.mock('../../../src/services/payroll.service');
vi.mock('../../../src/services/monnify.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/services/monnify.service')>();
  return { ...actual, MonnifyService: vi.fn() };
});

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

  describe('Monnify disbursement', () => {
    beforeEach(() => {
      MonnifyService.prototype.initiatePayrollDisbursement = vi.fn();
      MonnifyService.prototype.validateBankAccount = vi.fn();
      MonnifyService.prototype.isConfigured = vi.fn();
      MonnifyService.prototype.getBankList = vi.fn();
    });

    it('disbursePayrollRun calls MonnifyService and returns 200 on success', async () => {
      mockContext.get.mockReturnValue('comp-1');
      mockContext.req.param.mockReturnValue('run-1');
      (MonnifyService.prototype.initiatePayrollDisbursement as any).mockResolvedValue({ success: true, status: 'PAID_SIMULATED' });

      const res = await payrollController.disbursePayrollRun(mockContext);

      expect(MonnifyService.prototype.initiatePayrollDisbursement).toHaveBeenCalledWith('comp-1', 'run-1');
      expect(res.status).toBe(200);
    });

    it('disbursePayrollRun returns 400 (not 500) when the service throws, e.g. a non-approved run', async () => {
      mockContext.get.mockReturnValue('comp-1');
      mockContext.req.param.mockReturnValue('run-1');
      (MonnifyService.prototype.initiatePayrollDisbursement as any).mockRejectedValue(new Error("Cannot disburse payroll run in 'draft' state"));

      const res = await payrollController.disbursePayrollRun(mockContext);

      expect(mockContext.json).toHaveBeenCalledWith({ error: "Cannot disburse payroll run in 'draft' state" }, 400);
      expect(res.status).toBe(400);
    });

    it('validateBankAccount requires both accountNumber and bankCode', async () => {
      mockContext.req.query.mockImplementation((k: string) => (k === 'accountNumber' ? '0123456789' : undefined));

      const res = await payrollController.validateBankAccount(mockContext);

      expect(mockContext.json).toHaveBeenCalledWith({ error: 'accountNumber and bankCode are required' }, 400);
      expect(res.status).toBe(400);
      expect(MonnifyService.prototype.validateBankAccount).not.toHaveBeenCalled();
    });

    it('validateBankAccount returns the resolved account name on success', async () => {
      mockContext.req.query.mockImplementation((k: string) => ({ accountNumber: '0123456789', bankCode: '058' } as any)[k]);
      (MonnifyService.prototype.validateBankAccount as any).mockResolvedValue({ accountNumber: '0123456789', accountName: 'Ada Lovelace', bankCode: '058' });

      const res = await payrollController.validateBankAccount(mockContext);

      expect(MonnifyService.prototype.validateBankAccount).toHaveBeenCalledWith('0123456789', '058');
      expect(res.status).toBe(200);
    });

    it('getMonnifyBanks falls back to the static Nigerian bank list when Monnify credentials are not configured', async () => {
      (MonnifyService.prototype.isConfigured as any).mockReturnValue(false);

      const res = await payrollController.getMonnifyBanks(mockContext);

      expect(MonnifyService.prototype.getBankList).not.toHaveBeenCalled();
      expect(res.data.data.length).toBeGreaterThan(0);
      expect(res.data.data[0]).toEqual(expect.objectContaining({ name: expect.any(String), code: expect.any(String) }));
    });

    it('getMonnifyBanks fetches the live bank list when configured', async () => {
      (MonnifyService.prototype.isConfigured as any).mockReturnValue(true);
      (MonnifyService.prototype.getBankList as any).mockResolvedValue([{ name: 'GTBank', code: '058' }]);

      const res = await payrollController.getMonnifyBanks(mockContext);

      expect(MonnifyService.prototype.getBankList).toHaveBeenCalled();
      expect(res.data.data).toEqual([{ name: 'GTBank', code: '058' }]);
    });
  });
});
