import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PayrollService } from '../../src/services/payroll.service';

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

  describe('Statutory: NHF / NSITF / ITF', () => {
    it('deducts NHF from net pay but keeps NSITF/ITF as employer-only cost', async () => {
      // Annual salary 1,200,000 -> gross monthly 100,000 -> basic (40%) = 40,000.
      mockDb.query.employees.findMany.mockResolvedValueOnce([
        { id: 'emp-1', name: 'John', lastName: 'Doe', status: 'active', salary: 1200000, bankName: 'GTB', accountNumber: '123' },
      ]);
      mockDb.query.payrollSettings.findFirst.mockResolvedValueOnce({
        companyId: 'comp-1',
        prorationEnabled: false,
        nhfEnabled: true,
        nhfRate: 2.5,
        nsitfEnabled: true,
        nsitfRate: 1,
        itfEnabled: true,
        itfRate: 1,
        pensionEmployeeRate: 8,
      });

      const preview = await service.previewRun('comp-1', 10, 2023);
      const ps = preview.payslips[0];

      expect(ps.basicSalary).toBe(40000);
      expect(ps.nhfDeductions).toBe(1000); // 2.5% of 40,000
      expect(ps.nsitfContribution).toBe(1000); // 1% of gross (100,000)
      expect(ps.itfContribution).toBe(1000); // 1% of gross (100,000)
      // netPay = gross - tax - pension - nhf - loan - other; NSITF/ITF never subtracted.
      expect(ps.netPay).toBe(ps.grossPay - ps.taxDeductions - ps.pensionDeductions - ps.nhfDeductions);
      expect(preview.totalNhf).toBe(1000);
      expect(preview.totalNsitf).toBe(1000);
      expect(preview.totalItf).toBe(1000);
    });

    it('skips NHF/NSITF/ITF entirely when disabled in settings', async () => {
      mockDb.query.employees.findMany.mockResolvedValueOnce([
        { id: 'emp-1', name: 'John', lastName: 'Doe', status: 'active', salary: 1200000, bankName: 'GTB', accountNumber: '123' },
      ]);
      mockDb.query.payrollSettings.findFirst.mockResolvedValueOnce({
        companyId: 'comp-1',
        prorationEnabled: false,
        nhfEnabled: false,
        nsitfEnabled: false,
        itfEnabled: false,
      });

      const preview = await service.previewRun('comp-1', 10, 2023);
      const ps = preview.payslips[0];
      expect(ps.nhfDeductions).toBe(0);
      expect(ps.nsitfContribution).toBe(0);
      expect(ps.itfContribution).toBe(0);
    });

    it('markRunPaid generates NHF/NSITF/ITF compliance tasks alongside PAYE/Pension', async () => {
      mockDb.query.payrollRuns.findFirst.mockResolvedValueOnce({
        id: 'RUN-1',
        status: 'approved',
        periodMonth: 10,
        periodYear: 2023,
        totalTaxes: 5000,
        totalPension: 3000,
        totalNhf: 1000,
        totalNsitf: 1000,
        totalItf: 1000,
        payslips: [],
      });

      await service.markRunPaid('comp-1', 'RUN-1');

      const insertedTasks = mockDb.values.mock.calls.find((call: any) => Array.isArray(call[0]) && call[0][0]?.title?.includes('PAYE Filing'))?.[0];
      expect(insertedTasks).toBeDefined();
      const types = insertedTasks.map((t: any) => t.type);
      expect(types).toEqual(expect.arrayContaining(['tax', 'pension', 'nhf', 'nsitf', 'itf']));
      const nhfTask = insertedTasks.find((t: any) => t.type === 'nhf');
      expect(nhfTask.amount).toBe(1000);
    });
  });

  describe('Remittance Schedules', () => {
    it('generates a PAYE schedule CSV with employee TIN/tax state', async () => {
      mockDb.query.payrollRuns.findFirst.mockResolvedValueOnce({ id: 'RUN-1', periodMonth: 10, periodYear: 2023 });
      mockDb.query.payslips.findMany.mockResolvedValueOnce([
        { employeeId: 'emp-1', employeeName: 'John Doe', grossPay: 100000, taxDeductions: 8000 },
      ]);
      mockDb.query.employees.findMany.mockResolvedValueOnce([{ id: 'emp-1', tin: 'TIN123', taxState: 'Lagos' }]);
      mockDb.query.payrollSettings.findFirst.mockResolvedValueOnce({ companyId: 'comp-1' });

      const file = await service.getRemittanceSchedule('comp-1', 'RUN-1', 'paye');
      expect(file?.filename).toBe('paye-remittance-2023-10.csv');
      expect(file?.content).toContain('John Doe,TIN123,Lagos,1200000,8000');
    });

    it('generates an ITF schedule as a single company-level levy row', async () => {
      mockDb.query.payrollRuns.findFirst.mockResolvedValueOnce({ id: 'RUN-1', periodMonth: 10, periodYear: 2023, totalGross: 500000 });
      mockDb.query.payslips.findMany.mockResolvedValueOnce([
        { employeeId: 'emp-1', employeeName: 'John Doe', itfContribution: 5000 },
      ]);
      mockDb.query.employees.findMany.mockResolvedValueOnce([]);
      mockDb.query.payrollSettings.findFirst.mockResolvedValueOnce({ companyId: 'comp-1' });

      const file = await service.getRemittanceSchedule('comp-1', 'RUN-1', 'itf');
      expect(file?.content).toContain('2023-10,500000,5000');
    });
  });

  describe('Nigerian Statutory Compliance: Minimum Wage Exemption & Relief', () => {
    it('exempts minimum wage earners (<= 840,000 NGN) from PAYE under Finance Act', async () => {
      mockDb.query.employees.findMany.mockResolvedValueOnce([
        { id: 'emp-min', name: 'Musa', lastName: 'Ali', status: 'active', salary: 840000, bankName: 'Zenith', accountNumber: '123' },
      ]);
      mockDb.query.payrollSettings.findFirst.mockResolvedValueOnce({
        companyId: 'comp-1',
        prorationEnabled: false,
        minWageCheckEnabled: true,
        minWageAnnual: 840000,
        applyConsolidatedReliefAllowance: true,
        nhfEnabled: true,
      });

      const preview = await service.previewRun('comp-1', 10, 2024);
      const ps = preview.payslips[0];
      expect(ps.grossPay).toBe(70000); // 840,000 / 12
      expect(ps.taxDeductions).toBe(0); // Legally exempt from PAYE!
    });

    it('flags employees earning below statutory minimum wage in exceptions', async () => {
      mockDb.query.employees.findMany.mockResolvedValueOnce([
        { id: 'emp-low', name: 'Emeka', lastName: 'Okafor', status: 'active', salary: 500000, bankName: 'Access', accountNumber: '456' },
      ]);
      mockDb.query.payrollSettings.findFirst.mockResolvedValueOnce({
        companyId: 'comp-1',
        minWageCheckEnabled: true,
        minWageAnnual: 840000,
      });

      const preview = await service.previewRun('comp-1', 10, 2024);
      expect(preview.exceptions).toContainEqual(
        expect.objectContaining({
          employeeId: 'emp-low',
          issue: expect.stringContaining('Below Statutory Minimum Wage'),
        })
      );
    });
  });
});
