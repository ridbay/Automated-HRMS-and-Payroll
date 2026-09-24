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
    PayrollService.prototype.updateSettings = vi.fn();
    PayrollService.prototype.getLoans = vi.fn();
    PayrollService.prototype.createLoan = vi.fn();
    PayrollService.prototype.updateLoan = vi.fn();
    PayrollService.prototype.deleteLoan = vi.fn();
    PayrollService.prototype.recordLoanRepayment = vi.fn();
    PayrollService.prototype.getSalaryComponents = vi.fn();
    PayrollService.prototype.createSalaryComponent = vi.fn();
    PayrollService.prototype.updateSalaryComponent = vi.fn();
    PayrollService.prototype.deleteSalaryComponent = vi.fn();
    PayrollService.prototype.getPayGrades = vi.fn();
    PayrollService.prototype.createPayGrade = vi.fn();
    PayrollService.prototype.updatePayGrade = vi.fn();
    PayrollService.prototype.deletePayGrade = vi.fn();
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
      json: vi.fn((data, status = 200) => ({ data, status })),
      header: vi.fn(),
    };
  });

  it('getPayrollSettings should fetch settings', async () => {
    mockContext.get.mockReturnValue('comp-1');
    (PayrollService.prototype.getSettings as any).mockResolvedValue({ id: 'set-1' });

    await payrollController.getPayrollSettings(mockContext);
    expect(PayrollService.prototype.getSettings).toHaveBeenCalledWith('comp-1');
  });

  it('updatePayrollSettings should update settings', async () => {
    mockContext.get.mockReturnValue('comp-1');
    mockContext.req.json.mockResolvedValue({ paymentDay: 28, pensionEmployerRate: 10 });
    (PayrollService.prototype.updateSettings as any).mockResolvedValue({ id: 'set-1', paymentDay: 28 });

    const res = await payrollController.updatePayrollSettings(mockContext);
    expect(PayrollService.prototype.updateSettings).toHaveBeenCalledWith('comp-1', { paymentDay: 28, pensionEmployerRate: 10 });
    expect(res.status).toBe(200);
  });

  describe('Salary Components', () => {
    it('getSalaryComponents fetches components', async () => {
      mockContext.get.mockReturnValue('comp-1');
      (PayrollService.prototype.getSalaryComponents as any).mockResolvedValue([{ id: 'c-1', name: 'Transport' }]);

      const res: any = await payrollController.getSalaryComponents(mockContext);
      expect(PayrollService.prototype.getSalaryComponents).toHaveBeenCalledWith('comp-1');
      expect(res.data.data).toEqual([{ id: 'c-1', name: 'Transport' }]);
    });

    it('createSalaryComponent creates component', async () => {
      mockContext.get.mockReturnValue('comp-1');
      mockContext.req.json.mockResolvedValue({ name: 'Housing', type: 'earning' });
      (PayrollService.prototype.createSalaryComponent as any).mockResolvedValue({ id: 'c-2', name: 'Housing' });

      const res = await payrollController.createSalaryComponent(mockContext);
      expect(PayrollService.prototype.createSalaryComponent).toHaveBeenCalledWith('comp-1', { name: 'Housing', type: 'earning' });
      expect(res.status).toBe(201);
    });

    it('updateSalaryComponent updates component', async () => {
      mockContext.get.mockReturnValue('comp-1');
      mockContext.req.param.mockReturnValue('c-1');
      mockContext.req.json.mockResolvedValue({ name: 'Updated Transport' });
      (PayrollService.prototype.updateSalaryComponent as any).mockResolvedValue({ id: 'c-1', name: 'Updated Transport' });

      const res = await payrollController.updateSalaryComponent(mockContext);
      expect(PayrollService.prototype.updateSalaryComponent).toHaveBeenCalledWith('comp-1', 'c-1', { name: 'Updated Transport' });
      expect(res.status).toBe(200);
    });

    it('deleteSalaryComponent deletes component', async () => {
      mockContext.get.mockReturnValue('comp-1');
      mockContext.req.param.mockReturnValue('c-1');
      (PayrollService.prototype.deleteSalaryComponent as any).mockResolvedValue(true);

      const res = await payrollController.deleteSalaryComponent(mockContext);
      expect(PayrollService.prototype.deleteSalaryComponent).toHaveBeenCalledWith('comp-1', 'c-1');
      expect(res.status).toBe(200);
    });
  });

  describe('Pay Grades', () => {
    it('getPayGrades fetches pay grades', async () => {
      mockContext.get.mockReturnValue('comp-1');
      (PayrollService.prototype.getPayGrades as any).mockResolvedValue([{ id: 'pg-1', name: 'Grade 1' }]);

      const res: any = await payrollController.getPayGrades(mockContext);
      expect(PayrollService.prototype.getPayGrades).toHaveBeenCalledWith('comp-1');
      expect(res.data.data).toEqual([{ id: 'pg-1', name: 'Grade 1' }]);
    });

    it('createPayGrade creates pay grade', async () => {
      mockContext.get.mockReturnValue('comp-1');
      mockContext.req.json.mockResolvedValue({ name: 'Grade 2', level: 2 });
      (PayrollService.prototype.createPayGrade as any).mockResolvedValue({ id: 'pg-2', name: 'Grade 2' });

      const res = await payrollController.createPayGrade(mockContext);
      expect(PayrollService.prototype.createPayGrade).toHaveBeenCalledWith('comp-1', { name: 'Grade 2', level: 2 });
      expect(res.status).toBe(201);
    });

    it('updatePayGrade updates pay grade', async () => {
      mockContext.get.mockReturnValue('comp-1');
      mockContext.req.param.mockReturnValue('pg-1');
      mockContext.req.json.mockResolvedValue({ name: 'Senior Grade 1' });
      (PayrollService.prototype.updatePayGrade as any).mockResolvedValue({ id: 'pg-1', name: 'Senior Grade 1' });

      const res = await payrollController.updatePayGrade(mockContext);
      expect(PayrollService.prototype.updatePayGrade).toHaveBeenCalledWith('comp-1', 'pg-1', { name: 'Senior Grade 1' });
      expect(res.status).toBe(200);
    });

    it('deletePayGrade deletes pay grade', async () => {
      mockContext.get.mockReturnValue('comp-1');
      mockContext.req.param.mockReturnValue('pg-1');
      (PayrollService.prototype.deletePayGrade as any).mockResolvedValue(true);

      const res = await payrollController.deletePayGrade(mockContext);
      expect(PayrollService.prototype.deletePayGrade).toHaveBeenCalledWith('comp-1', 'pg-1');
      expect(res.status).toBe(200);
    });
  });

  describe('Loans & Advances', () => {
    it('getLoans fetches loans', async () => {
      mockContext.get.mockReturnValue('comp-1');
      mockContext.req.query.mockReturnValue(undefined);
      (PayrollService.prototype.getLoans as any).mockResolvedValue([{ id: 'loan-1', principal: 1000 }]);

      const res: any = await payrollController.getLoans(mockContext);
      expect(PayrollService.prototype.getLoans).toHaveBeenCalledWith('comp-1');
      expect(res.data.data).toEqual([{ id: 'loan-1', principal: 1000 }]);
    });

    it('createLoan should create loan', async () => {
      mockContext.get.mockReturnValue('comp-1');
      mockContext.req.json.mockResolvedValue({ employeeId: 'emp-1', principal: 1000 });
      (PayrollService.prototype.createLoan as any).mockResolvedValue({ id: 'loan-1' });

      const res = await payrollController.createLoan(mockContext);
      expect(PayrollService.prototype.createLoan).toHaveBeenCalledWith('comp-1', { employeeId: 'emp-1', principal: 1000 });
      expect(res.status).toBe(201);
    });

    it('updateLoan should update loan', async () => {
      mockContext.get.mockReturnValue('comp-1');
      mockContext.req.param.mockReturnValue('loan-1');
      mockContext.req.json.mockResolvedValue({ status: 'paused' });
      (PayrollService.prototype.updateLoan as any).mockResolvedValue({ id: 'loan-1', status: 'paused' });

      const res = await payrollController.updateLoan(mockContext);
      expect(PayrollService.prototype.updateLoan).toHaveBeenCalledWith('comp-1', 'loan-1', { status: 'paused' });
      expect(res.status).toBe(200);
    });

    it('deleteLoan should delete loan', async () => {
      mockContext.get.mockReturnValue('comp-1');
      mockContext.req.param.mockReturnValue('loan-1');
      (PayrollService.prototype.deleteLoan as any).mockResolvedValue(true);

      const res = await payrollController.deleteLoan(mockContext);
      expect(PayrollService.prototype.deleteLoan).toHaveBeenCalledWith('comp-1', 'loan-1');
      expect(res.status).toBe(200);
    });

    it('recordLoanRepayment records manual repayment', async () => {
      mockContext.get.mockReturnValue('comp-1');
      mockContext.req.param.mockReturnValue('loan-1');
      mockContext.req.json.mockResolvedValue({ amount: 50000 });
      (PayrollService.prototype.recordLoanRepayment as any).mockResolvedValue({ id: 'rep-1', amount: 50000 });

      const res = await payrollController.recordLoanRepayment(mockContext);
      expect(PayrollService.prototype.recordLoanRepayment).toHaveBeenCalledWith('comp-1', 'loan-1', 50000, undefined);
      expect(res.status).toBe(201);
    });
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

      const res: any = await payrollController.getMonnifyBanks(mockContext);

      expect(MonnifyService.prototype.getBankList).not.toHaveBeenCalled();
      expect(res.data.data.length).toBeGreaterThan(0);
      expect(res.data.data[0]).toEqual(expect.objectContaining({ name: expect.any(String), code: expect.any(String) }));
    });

    it('getMonnifyBanks fetches the live bank list when configured', async () => {
      (MonnifyService.prototype.isConfigured as any).mockReturnValue(true);
      (MonnifyService.prototype.getBankList as any).mockResolvedValue([{ name: 'GTBank', code: '058' }]);

      const res: any = await payrollController.getMonnifyBanks(mockContext);

      expect(MonnifyService.prototype.getBankList).toHaveBeenCalled();
      expect(res.data.data).toEqual([{ name: 'GTBank', code: '058' }]);
    });
  });
});
