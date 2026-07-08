import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema';

export class PayrollService {
  constructor(private db: any) {}

  async previewRun(companyId: string, month: number, year: number) {
    // 1. Fetch all active employees for the company
    const activeEmployees = await this.db.query.employees.findMany({
      where: and(
        eq(schema.employees.companyId, companyId),
        eq(schema.employees.status, 'active')
      ),
    });

    let totalGross = 0;
    let totalNet = 0;
    let totalTaxes = 0;

    const payslips = activeEmployees.map((emp: any) => {
      // Annual salary, default to 0 if not set
      const annualSalary = emp.salary || 0;
      
      // Calculate monthly gross
      const grossPay = Math.round(annualSalary / 12);
      const basicSalary = Math.round(grossPay * 0.4); // Assume 40% basic
      const allowances = grossPay - basicSalary;

      // Deductions
      const pensionDeductions = Math.round(basicSalary * 0.08); // 8% of basic
      
      // Simplified PAYE (e.g., 10% flat for this demo on taxable income)
      // Taxable income = gross - pension
      const taxableIncome = Math.max(0, grossPay - pensionDeductions);
      const taxDeductions = Math.round(taxableIncome * 0.1); 

      const netPay = grossPay - taxDeductions - pensionDeductions;

      totalGross += grossPay;
      totalNet += netPay;
      totalTaxes += taxDeductions;

      return {
        id: crypto.randomUUID(),
        employeeId: emp.id,
        employeeName: `${emp.name} ${emp.lastName || ''}`.trim(),
        department: emp.department || 'Unassigned',
        basicSalary,
        allowances,
        grossPay,
        taxDeductions,
        pensionDeductions,
        netPay,
      };
    });

    return {
      periodMonth: month,
      periodYear: year,
      status: 'preview',
      totalGross,
      totalNet,
      totalTaxes,
      employeeCount: activeEmployees.length,
      payslips,
    };
  }

  async lockRun(companyId: string, payload: any) {
    // payload should contain the preview data structure
    const runId = crypto.randomUUID();

    // 1. Insert Payroll Run
    await this.db.insert(schema.payrollRuns).values({
      id: runId,
      companyId,
      periodMonth: payload.periodMonth,
      periodYear: payload.periodYear,
      status: 'locked',
      totalGross: payload.totalGross,
      totalNet: payload.totalNet,
      totalTaxes: payload.totalTaxes,
    });

    // 2. Insert Payslips
    if (payload.payslips && payload.payslips.length > 0) {
      const payslipsToInsert = payload.payslips.map((ps: any) => ({
        id: ps.id || crypto.randomUUID(),
        runId,
        employeeId: ps.employeeId,
        basicSalary: ps.basicSalary,
        allowances: ps.allowances,
        grossPay: ps.grossPay,
        taxDeductions: ps.taxDeductions,
        pensionDeductions: ps.pensionDeductions,
        netPay: ps.netPay,
      }));

      // Insert in chunks or all at once (assuming SQLite limit is okay for MVP)
      await this.db.insert(schema.payslips).values(payslipsToInsert);
    }

    return { runId, status: 'locked' };
  }
}
