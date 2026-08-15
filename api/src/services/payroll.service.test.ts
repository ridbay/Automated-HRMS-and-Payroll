import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PayrollService } from './payroll.service';

describe('Payroll Service', () => {
  let mockDb: any;
  let service: PayrollService;

  beforeEach(() => {
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      batch: vi.fn().mockResolvedValue([]),
      then: function(resolve: any) { resolve([]); },
      query: {
        payrollSettings: { findFirst: vi.fn() },
        taxBrackets: { findMany: vi.fn().mockResolvedValue([]) },
        salaryComponents: { findMany: vi.fn().mockResolvedValue([]), findFirst: vi.fn() },
        payGrades: { findMany: vi.fn().mockResolvedValue([]) },
        loans: { findMany: vi.fn().mockResolvedValue([]), findFirst: vi.fn() },
        employees: { findMany: vi.fn().mockResolvedValue([]) },
        payrollRuns: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
        payslips: { findMany: vi.fn().mockResolvedValue([]) },
        complianceTasks: { findMany: vi.fn().mockResolvedValue([]) },
      }
    };

    service = new PayrollService({} as any);
    (service as any).db = mockDb;
  });

  describe('Salary Components', () => {
    it('should throw error when deleting a statutory component', async () => {
      mockDb.query.salaryComponents.findFirst.mockResolvedValueOnce({ id: 'SC-1', statutory: true });
      await expect(service.deleteSalaryComponent('comp-1', 'SC-1')).rejects.toThrow('Statutory components cannot be deleted');
    });

    it('should delete a non-statutory component', async () => {
      mockDb.query.salaryComponents.findFirst.mockResolvedValueOnce({ id: 'SC-2', statutory: false });
      const result = await service.deleteSalaryComponent('comp-1', 'SC-2');
      expect(mockDb.delete).toHaveBeenCalled();
      expect(result?.id).toBe('SC-2');
    });
  });

  describe('Loans', () => {
    it('should create a loan and compute monthly installment correctly', async () => {
      const payload = { employeeId: 'emp-1', principal: 100000, durationMonths: 10, interestRatePercent: 10 }; // 10% of 100,000 = 10,000. Total = 110,000. Monthly = 11,000
      const result = await service.createLoan('comp-1', payload);
      
      expect(mockDb.insert).toHaveBeenCalled();
      expect(result.remainingBalance).toBe(110000);
      expect(result.monthlyInstallment).toBe(11000);
    });
  });

  describe('Runs', () => {
    it('should transition run status through lifecycle', async () => {
      // Approve
      mockDb.query.payrollRuns.findFirst.mockResolvedValueOnce({ id: 'RUN-1', status: 'pending_approval' });
      const runApprove = await service.approveRun('comp-1', 'RUN-1', 'hr-1');
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({ status: 'approved' }));

      // Reject (should fail because we mock next state as approved)
      mockDb.query.payrollRuns.findFirst.mockResolvedValueOnce({ id: 'RUN-1', status: 'approved' });
      await expect(service.rejectRun('comp-1', 'RUN-1')).rejects.toThrow('Cannot reject a run in "approved" status');

      // Paid
      mockDb.query.payrollRuns.findFirst.mockResolvedValueOnce({ id: 'RUN-1', status: 'approved', payslips: [] });
      const runPaid = await service.markRunPaid('comp-1', 'RUN-1');
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({ status: 'paid' }));
    });
  });

  describe('Preview & Exceptions', () => {
    it('should generate exceptions for missing bank or salary details', async () => {
      // Mock active employees
      mockDb.query.employees.findMany.mockResolvedValueOnce([
        { id: 'emp-1', name: 'John', status: 'active' }, // No salary, no bank
        { id: 'emp-2', name: 'Jane', status: 'active', salary: 1200000, bankName: 'Bank', accountNumber: '1234567890' } // Good, but missing PFA/TIN
      ]);

      mockDb.query.payrollSettings.findFirst.mockResolvedValueOnce({ companyId: 'comp-1', prorationEnabled: false });

      const preview = await service.previewRun('comp-1', 10, 2023);
      
      expect(preview.exceptions.length).toBeGreaterThan(0);
      expect(preview.exceptions).toContainEqual(expect.objectContaining({ employeeId: 'emp-1', issue: 'Missing Bank Details' }));
      expect(preview.exceptions).toContainEqual(expect.objectContaining({ employeeId: 'emp-1', issue: 'Salary Not Configured' }));
      expect(preview.exceptions).toContainEqual(expect.objectContaining({ employeeId: 'emp-2', issue: 'Missing PFA / Pension ID' }));
      expect(preview.exceptions).toContainEqual(expect.objectContaining({ employeeId: 'emp-2', issue: 'Missing TIN' }));
    });
  });

  describe('Bank File', () => {
    it('should generate a CSV bank file', async () => {
      mockDb.query.payrollRuns.findFirst.mockResolvedValueOnce({ 
        id: 'RUN-1', periodMonth: 10, periodYear: 2023 
      });
      mockDb.query.payslips.findMany.mockResolvedValueOnce([
        { employeeId: 'emp-1', employeeName: 'John', bankName: 'GTB', accountNumber: '123', accountName: 'John Doe', netPay: 10000 }
      ]);

      const file = await service.getBankFile('comp-1', 'RUN-1');
      expect(file?.filename).toBe('bank-file-2023-10.csv');
      expect(file?.content).toContain('emp-1,John,GTB,123,John Doe,10000');
    });
  });
});
