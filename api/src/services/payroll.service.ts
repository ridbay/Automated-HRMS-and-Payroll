import { drizzle } from 'drizzle-orm/d1';
import { eq, and, gte, lte, asc, desc, inArray } from 'drizzle-orm';
import * as schema from '../db/schema';

const genId = (prefix: string) => `${prefix}-${crypto.randomUUID().split('-')[0].toUpperCase()}`;

// Nigeria PAYE bands (Finance Act) — used to seed a company's editable tax
// bracket table the first time it's requested.
const DEFAULT_TAX_BRACKETS = [
  { minIncome: 0, maxIncome: 300000, ratePercent: 7 },
  { minIncome: 300001, maxIncome: 600000, ratePercent: 11 },
  { minIncome: 600001, maxIncome: 1100000, ratePercent: 15 },
  { minIncome: 1100001, maxIncome: 1600000, ratePercent: 19 },
  { minIncome: 1600001, maxIncome: 3200000, ratePercent: 21 },
  { minIncome: 3200001, maxIncome: null as number | null, ratePercent: 24 },
];

const DEFAULT_SETTINGS = {
  payCycle: 'monthly',
  cutoffDay: 20,
  paymentDay: 25,
  workingDaysPerMonth: 22,
  prorationEnabled: true,
  minWageCheckEnabled: true,
  minWageAnnual: 840000,
  pensionEmployeeRate: 8,
  pensionEmployerRate: 10,
  applyConsolidatedReliefAllowance: true,
  nhfEnabled: true,
  nhfRate: 2.5,
  nsitfEnabled: true,
  nsitfRate: 1,
  itfEnabled: true,
  itfRate: 1,
  currency: 'NGN',
};

// Progressive tax over ordered, contiguous slabs. Each band's width is
// consumed from whatever taxable income remains, so bands can be edited
// freely (added/removed/re-ranged) without the math breaking.
function calculateAnnualPaye(taxableAnnualIncome: number, brackets: { minIncome: number; maxIncome: number | null; ratePercent: number }[]) {
  const sorted = [...brackets].sort((a, b) => a.minIncome - b.minIncome);
  let remaining = Math.max(0, taxableAnnualIncome);
  let tax = 0;
  for (const band of sorted) {
    if (remaining <= 0) break;
    const width = band.maxIncome != null ? Math.max(0, band.maxIncome - band.minIncome + 1) : Infinity;
    const amountInBand = Math.min(remaining, width);
    tax += amountInBand * (band.ratePercent / 100);
    remaining -= amountInBand;
  }
  return Math.round(tax);
}

const nextPeriod = (month: number, year: number) =>
  month === 12 ? { month: 1, year: year + 1 } : { month: month + 1, year };

export class PayrollService {
  private db;

  constructor(dbBinding: any) {
    this.db = drizzle(dbBinding, { schema });
  }

  // ---------------- Settings ----------------
  async getSettings(companyId: string) {
    const existing = await this.db.query.payrollSettings.findFirst({
      where: eq(schema.payrollSettings.companyId, companyId),
    });
    if (existing) return existing;

    const settings = { companyId, ...DEFAULT_SETTINGS };
    await this.db.insert(schema.payrollSettings).values(settings);
    return settings;
  }

  async updateSettings(companyId: string, payload: any) {
    await this.getSettings(companyId); // ensure a row exists to update
    const { companyId: _drop, createdAt, updatedAt, ...rest } = payload || {};
    await this.db.update(schema.payrollSettings).set(rest).where(eq(schema.payrollSettings.companyId, companyId));
    return this.getSettings(companyId);
  }

  // ---------------- Tax brackets ----------------
  async getTaxBrackets(companyId: string) {
    const existing = await this.db.query.taxBrackets.findMany({
      where: eq(schema.taxBrackets.companyId, companyId),
      orderBy: [asc(schema.taxBrackets.sortOrder)],
    });
    if (existing.length > 0) return existing;

    const rows = DEFAULT_TAX_BRACKETS.map((b, i) => ({ id: genId('TB'), companyId, ...b, sortOrder: i }));
    await this.db.insert(schema.taxBrackets).values(rows);
    return rows;
  }

  async replaceTaxBrackets(companyId: string, brackets: any[]) {
    await this.db.delete(schema.taxBrackets).where(eq(schema.taxBrackets.companyId, companyId));
    const rows = (brackets || []).map((b, i) => ({
      id: genId('TB'),
      companyId,
      minIncome: Number(b.minIncome) || 0,
      maxIncome: b.maxIncome === null || b.maxIncome === '' || b.maxIncome === undefined ? null : Number(b.maxIncome),
      ratePercent: Number(b.ratePercent) || 0,
      sortOrder: i,
    }));
    if (rows.length > 0) await this.db.insert(schema.taxBrackets).values(rows);
    return rows;
  }

  // ---------------- Salary components ----------------
  async getSalaryComponents(companyId: string) {
    const existing = await this.db.query.salaryComponents.findMany({
      where: eq(schema.salaryComponents.companyId, companyId),
    });
    if (existing.length > 0) return existing;

    const defaults = [
      { name: 'Basic Salary', type: 'earning', calculationType: 'percentage_of_gross', value: 40, taxable: true, statutory: true },
      { name: 'Housing Allowance', type: 'earning', calculationType: 'percentage_of_basic', value: 50, taxable: true, statutory: false },
      { name: 'Transport Allowance', type: 'earning', calculationType: 'percentage_of_gross', value: 10, taxable: true, statutory: false },
      { name: 'Pension Contribution', type: 'deduction', calculationType: 'percentage_of_basic', value: 8, taxable: false, statutory: true },
    ].map((c) => ({ id: genId('SC'), companyId, active: true, ...c }));
    await this.db.insert(schema.salaryComponents).values(defaults);
    return defaults;
  }

  async createSalaryComponent(companyId: string, payload: any) {
    const row = { id: genId('SC'), companyId, active: true, statutory: false, taxable: true, ...payload };
    await this.db.insert(schema.salaryComponents).values(row);
    return row;
  }

  async updateSalaryComponent(companyId: string, id: string, payload: any) {
    const { id: _id, companyId: _c, ...rest } = payload || {};
    await this.db
      .update(schema.salaryComponents)
      .set(rest)
      .where(and(eq(schema.salaryComponents.id, id), eq(schema.salaryComponents.companyId, companyId)));
    return this.db.query.salaryComponents.findFirst({ where: eq(schema.salaryComponents.id, id) });
  }

  async deleteSalaryComponent(companyId: string, id: string) {
    const existing = await this.db.query.salaryComponents.findFirst({
      where: and(eq(schema.salaryComponents.id, id), eq(schema.salaryComponents.companyId, companyId)),
    });
    if (!existing) return null;
    if (existing.statutory) throw new Error('Statutory components cannot be deleted');
    await this.db.delete(schema.salaryComponents).where(eq(schema.salaryComponents.id, id));
    return existing;
  }

  // ---------------- Pay grades ----------------
  async getPayGrades(companyId: string) {
    return this.db.query.payGrades.findMany({ where: eq(schema.payGrades.companyId, companyId), orderBy: [asc(schema.payGrades.level)] });
  }

  async createPayGrade(companyId: string, payload: any) {
    const row = { id: genId('PG'), companyId, ...payload };
    await this.db.insert(schema.payGrades).values(row);
    return row;
  }

  async updatePayGrade(companyId: string, id: string, payload: any) {
    const { id: _id, companyId: _c, ...rest } = payload || {};
    await this.db.update(schema.payGrades).set(rest).where(and(eq(schema.payGrades.id, id), eq(schema.payGrades.companyId, companyId)));
    return this.db.query.payGrades.findFirst({ where: eq(schema.payGrades.id, id) });
  }

  async deletePayGrade(companyId: string, id: string) {
    const existing = await this.db.query.payGrades.findFirst({ where: and(eq(schema.payGrades.id, id), eq(schema.payGrades.companyId, companyId)) });
    if (!existing) return null;
    await this.db.delete(schema.payGrades).where(eq(schema.payGrades.id, id));
    return existing;
  }

  // ---------------- Loans ----------------
  async getLoans(companyId: string) {
    const rows = await this.db.query.loans.findMany({
      where: eq(schema.loans.companyId, companyId),
      orderBy: [desc(schema.loans.createdAt)],
    });
    const employees = await this.db.query.employees.findMany({ where: eq(schema.employees.companyId, companyId) });
    const byId = new Map<string, any>(employees.map((e: any) => [e.id, e]));
    return rows.map((l: any) => {
      const emp = byId.get(l.employeeId);
      return { ...l, employeeName: emp ? `${emp.name} ${emp.lastName || ''}`.trim() : 'Unknown' };
    });
  }

  async createLoan(companyId: string, payload: any) {
    const principal = Number(payload.principal) || 0;
    const durationMonths = Math.max(1, Number(payload.durationMonths) || 1);
    const interestRatePercent = Number(payload.interestRatePercent) || 0;
    const totalRepayable = principal + principal * (interestRatePercent / 100);
    const monthlyInstallment = Math.round(totalRepayable / durationMonths);

    const row = {
      id: genId('LN'),
      companyId,
      employeeId: payload.employeeId,
      principal,
      interestRatePercent,
      durationMonths,
      monthlyInstallment,
      remainingBalance: Math.round(totalRepayable),
      status: 'active',
      purpose: payload.purpose || null,
      startDate: payload.startDate || new Date().toISOString().slice(0, 10),
    };
    await this.db.insert(schema.loans).values(row);
    return row;
  }

  async updateLoan(companyId: string, id: string, payload: any) {
    const { id: _id, companyId: _c, employeeId, ...rest } = payload || {};
    await this.db.update(schema.loans).set(rest).where(and(eq(schema.loans.id, id), eq(schema.loans.companyId, companyId)));
    return this.db.query.loans.findFirst({ where: eq(schema.loans.id, id) });
  }

  async deleteLoan(companyId: string, id: string) {
    const existing = await this.db.query.loans.findFirst({ where: and(eq(schema.loans.id, id), eq(schema.loans.companyId, companyId)) });
    if (!existing) return null;
    await this.db.delete(schema.loans).where(eq(schema.loans.id, id));
    return existing;
  }

  async getLoanRepayments(companyId: string, loanId: string) {
    return this.db.query.loanRepayments.findMany({
      where: and(eq(schema.loanRepayments.loanId, loanId), eq(schema.loanRepayments.companyId, companyId)),
      orderBy: [desc(schema.loanRepayments.paidAt)],
    });
  }

  private async getActiveLoansByEmployee(companyId: string) {
    const rows = await this.db.query.loans.findMany({
      where: and(eq(schema.loans.companyId, companyId), eq(schema.loans.status, 'active')),
    });
    const map = new Map<string, any>();
    for (const l of rows) map.set(l.employeeId, l);
    return map;
  }

  // ---------------- Attendance summary ----------------
  private async getAttendanceSummary(companyId: string, month: number, year: number) {
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const rows = await this.db
      .select({
        employeeId: schema.attendanceRecords.employeeId,
        status: schema.attendanceRecords.status,
        overtime: schema.attendanceRecords.overtime,
      })
      .from(schema.attendanceRecords)
      .where(
        and(
          eq(schema.attendanceRecords.companyId, companyId),
          gte(schema.attendanceRecords.date, start),
          lte(schema.attendanceRecords.date, end)
        )
      );

    const map = new Map<string, { present: number; overtime: number }>();
    for (const r of rows) {
      const cur = map.get(r.employeeId) || { present: 0, overtime: 0 };
      if (r.status === 'present') cur.present += 1;
      cur.overtime += r.overtime || 0;
      map.set(r.employeeId, cur);
    }
    return map;
  }

  // ---------------- Exceptions (dashboard) ----------------
  private buildExceptions(activeEmployees: any[], settings?: any) {
    const exceptions: any[] = [];
    const minWage = settings?.minWageAnnual ?? 840000;
    for (const emp of activeEmployees) {
      const name = `${emp.name} ${emp.lastName || ''}`.trim();
      const salary = emp.salary || emp.baseSalary || 0;
      if (!emp.accountNumber || !emp.bankName) {
        exceptions.push({ employeeId: emp.id, employeeName: name, issue: 'Missing Bank Details', severity: 'red', type: 'Compliance' });
      }
      if (!salary) {
        exceptions.push({ employeeId: emp.id, employeeName: name, issue: 'Salary Not Configured', severity: 'red', type: 'Calculation' });
      } else if (settings?.minWageCheckEnabled && salary < minWage) {
        exceptions.push({ employeeId: emp.id, employeeName: name, issue: `Below Statutory Minimum Wage (₦${Math.round(minWage / 12).toLocaleString()}/mo)`, severity: 'red', type: 'Compliance' });
      }
      if (!emp.pfa && !emp.pensionId) {
        exceptions.push({ employeeId: emp.id, employeeName: name, issue: 'Missing PFA / Pension ID', severity: 'orange', type: 'Statutory' });
      }
      if (!emp.tin) {
        exceptions.push({ employeeId: emp.id, employeeName: name, issue: 'Missing TIN', severity: 'orange', type: 'Statutory' });
      }
    }
    return exceptions;
  }

  // ---------------- Core computation ----------------
  private computePayslip(emp: any, settings: any, brackets: any[], month: number, year: number, attendance: { present: number; overtime: number } | undefined, loan: any, overrides: any) {
    const workingDays = settings.workingDaysPerMonth || 22;
    const daysInMonth = new Date(year, month, 0).getDate();

    let proratedDays = daysInMonth;
    let isProrated = false;
    if (settings.prorationEnabled && emp.hireDate) {
      const hire = new Date(emp.hireDate);
      if (!Number.isNaN(hire.getTime()) && hire.getFullYear() === year && hire.getMonth() + 1 === month) {
        proratedDays = Math.max(0, daysInMonth - hire.getDate() + 1);
        isProrated = true;
      }
    }
    const prorationFactor = daysInMonth > 0 ? proratedDays / daysInMonth : 1;

    const annualSalary = emp.salary || emp.baseSalary || 0;
    const grossMonthlyFull = Math.round(annualSalary / 12);
    const proratedGross = Math.round(grossMonthlyFull * prorationFactor);

    const basicSalary = Math.round(proratedGross * 0.4);
    const allowances = proratedGross - basicSalary;
    const bonuses = Math.max(0, Math.round(Number(overrides?.bonuses) || 0));

    const grossPay = proratedGross + bonuses;
    const pensionableBase = basicSalary + allowances;
    const pensionDeductions = Math.round(pensionableBase * ((settings.pensionEmployeeRate ?? 8) / 100));

    // NHF: employee deduction (National Housing Fund, remitted to FMBN),
    // reduces net pay like pension does. NSITF/ITF are employer-only
    // statutory costs — computed for remittance/compliance tracking but
    // deliberately excluded from the netPay subtraction below.
    const nhfDeductions = settings.nhfEnabled ? Math.round(basicSalary * ((settings.nhfRate ?? 2.5) / 100)) : 0;
    const nsitfContribution = settings.nsitfEnabled ? Math.round(grossPay * ((settings.nsitfRate ?? 1) / 100)) : 0;
    const itfContribution = settings.itfEnabled ? Math.round(grossPay * ((settings.itfRate ?? 1) / 100)) : 0;

    const grossAnnual = grossPay * 12;
    // PITA Section 33(2) statutory deductions allowable as relief: Pension + NHF
    const statutoryReliefAnnual = (pensionDeductions + nhfDeductions) * 12;
    let taxableAnnual;
    if (settings.applyConsolidatedReliefAllowance) {
      const cra = Math.max(200000, grossAnnual * 0.01) + grossAnnual * 0.2;
      taxableAnnual = Math.max(0, grossAnnual - cra - statutoryReliefAnnual);
    } else {
      taxableAnnual = Math.max(0, grossAnnual - statutoryReliefAnnual);
    }

    const minWageAnnual = settings.minWageAnnual ?? 840000;
    // Finance Act / PITA Section 37: Minimum wage earners (₦840,000/yr or less) are exempt from PAYE
    const isMinWageExempt = settings.minWageCheckEnabled && grossAnnual <= minWageAnnual;

    let taxDeductions = 0;
    if (!isMinWageExempt) {
      const calculatedAnnualPaye = calculateAnnualPaye(taxableAnnual, brackets);
      // PITA Section 37: 1% minimum tax on gross income if computed tax is lower
      const minTaxAnnual = grossAnnual * 0.01;
      const annualPaye = taxableAnnual > 0 ? Math.max(calculatedAnnualPaye, minTaxAnnual) : minTaxAnnual;
      taxDeductions = Math.round(annualPaye / 12);
    }

    const loanDeduction = loan && loan.remainingBalance > 0 ? Math.min(loan.monthlyInstallment, loan.remainingBalance) : 0;
    const otherDeductions = Math.max(0, Math.round(Number(overrides?.otherDeductions) || 0));

    const netPay = grossPay - taxDeductions - pensionDeductions - nhfDeductions - loanDeduction - otherDeductions;

    return {
      id: crypto.randomUUID(),
      employeeId: emp.id,
      employeeName: `${emp.name} ${emp.lastName || ''}`.trim(),
      department: emp.department || 'Unassigned',
      bankName: emp.bankName || null,
      accountNumber: emp.accountNumber || null,
      accountName: emp.accountName || null,
      basicSalary,
      allowances,
      bonuses,
      grossPay,
      taxDeductions,
      pensionDeductions,
      nhfDeductions,
      nsitfContribution,
      itfContribution,
      loanDeductions: loanDeduction,
      otherDeductions,
      netPay,
      isProrated,
      workingDays,
      presentDays: attendance?.present ?? workingDays,
      absentDays: Math.max(0, workingDays - (attendance?.present ?? workingDays)),
      overtimeHours: attendance?.overtime ?? 0,
      loanId: loan?.id || null,
    };
  }

  async previewRun(companyId: string, month: number, year: number, overrides: Record<string, any> = {}) {
    const activeEmployees = await this.db.query.employees.findMany({
      where: and(eq(schema.employees.companyId, companyId), eq(schema.employees.status, 'active')),
    });

    const [settings, brackets, attendanceMap, loanMap] = await Promise.all([
      this.getSettings(companyId),
      this.getTaxBrackets(companyId),
      this.getAttendanceSummary(companyId, month, year),
      this.getActiveLoansByEmployee(companyId),
    ]);

    let totalGross = 0;
    let totalNet = 0;
    let totalTaxes = 0;
    let totalPension = 0;
    let totalNhf = 0;
    let totalNsitf = 0;
    let totalItf = 0;
    let totalLoanDeductions = 0;

    const payslips = activeEmployees.map((emp: any) => {
      const ps = this.computePayslip(emp, settings, brackets, month, year, attendanceMap.get(emp.id), loanMap.get(emp.id), overrides?.[emp.id]);
      totalGross += ps.grossPay;
      totalNet += ps.netPay;
      totalTaxes += ps.taxDeductions;
      totalPension += ps.pensionDeductions;
      totalNhf += ps.nhfDeductions;
      totalNsitf += ps.nsitfContribution;
      totalItf += ps.itfContribution;
      totalLoanDeductions += ps.loanDeductions;
      return ps;
    });

    return {
      periodMonth: month,
      periodYear: year,
      status: 'preview',
      totalGross,
      totalNet,
      totalTaxes,
      totalPension,
      totalNhf,
      totalNsitf,
      totalItf,
      totalLoanDeductions,
      employeeCount: activeEmployees.length,
      exceptions: this.buildExceptions(activeEmployees, settings),
      payslips,
    };
  }

  // ---------------- Run lifecycle ----------------
  async submitRun(companyId: string, submittedBy: string | undefined, payload: any) {
    const { periodMonth, periodYear, overrides, notes } = payload;

    // A run for this period is already in flight (or done) — the UI treats any
    // non-rejected run as "locked" for the period; enforce the same rule
    // server-side so a second submission can't create a duplicate run.
    const existingRun = await this.db.query.payrollRuns.findFirst({
      where: and(
        eq(schema.payrollRuns.companyId, companyId),
        eq(schema.payrollRuns.periodMonth, periodMonth),
        eq(schema.payrollRuns.periodYear, periodYear),
      ),
    });
    if (existingRun && existingRun.status !== 'rejected') {
      throw new Error(
        `A payroll run for ${String(periodMonth).padStart(2, '0')}/${periodYear} already exists (status: ${existingRun.status}). Reject it before submitting a new one.`
      );
    }

    const preview = await this.previewRun(companyId, periodMonth, periodYear, overrides || {});

    // Red-severity exceptions (missing bank details, unconfigured salary, below
    // statutory minimum wage) would produce a broken or non-compliant payslip —
    // block submission until they're resolved. Orange (missing statutory IDs)
    // stays advisory since it doesn't prevent computing or paying the employee.
    const blocking = (preview.exceptions || []).filter((ex: any) => ex.severity === 'red');
    if (blocking.length > 0) {
      const names = [...new Set(blocking.map((ex: any) => ex.employeeName))];
      throw new Error(
        `Cannot submit: blocking exceptions for ${names.join(', ')}. Resolve missing bank details, unconfigured salary, or minimum-wage issues first.`
      );
    }

    const settings = await this.getSettings(companyId);
    const runId = genId('RUN');

    await this.db.insert(schema.payrollRuns).values({
      id: runId,
      companyId,
      periodMonth,
      periodYear,
      status: 'pending_approval',
      totalGross: preview.totalGross,
      totalNet: preview.totalNet,
      totalTaxes: preview.totalTaxes,
      totalPension: preview.totalPension,
      totalNhf: preview.totalNhf,
      totalNsitf: preview.totalNsitf,
      totalItf: preview.totalItf,
      totalLoanDeductions: preview.totalLoanDeductions,
      employeeCount: preview.employeeCount,
      dueDate: `${periodYear}-${String(periodMonth).padStart(2, '0')}-${String(settings.paymentDay).padStart(2, '0')}`,
      submittedBy: submittedBy || null,
      submittedAt: new Date().toISOString(),
      notes: notes || null,
    });

    if (preview.payslips.length > 0) {
      const rows = preview.payslips.map((ps: any) => ({
        id: ps.id,
        runId,
        employeeId: ps.employeeId,
        employeeName: ps.employeeName,
        department: ps.department,
        bankName: ps.bankName,
        accountNumber: ps.accountNumber,
        accountName: ps.accountName,
        basicSalary: ps.basicSalary,
        allowances: ps.allowances,
        bonuses: ps.bonuses,
        grossPay: ps.grossPay,
        taxDeductions: ps.taxDeductions,
        pensionDeductions: ps.pensionDeductions,
        nhfDeductions: ps.nhfDeductions,
        nsitfContribution: ps.nsitfContribution,
        itfContribution: ps.itfContribution,
        loanDeductions: ps.loanDeductions,
        otherDeductions: ps.otherDeductions,
        netPay: ps.netPay,
        isProrated: ps.isProrated,
        workingDays: ps.workingDays,
        presentDays: ps.presentDays,
        absentDays: ps.absentDays,
        overtimeHours: ps.overtimeHours,
      }));

      // D1 caps bound parameters at 100 per statement. Each payslip row binds
      // ~24 params, so a single multi-row VALUES insert breaks past ~4-5
      // employees. Chunk into a batch of smaller inserts (still one atomic
      // D1 round trip) instead.
      const CHUNK_SIZE = 4;
      const chunks: (typeof rows)[] = [];
      for (let i = 0; i < rows.length; i += CHUNK_SIZE) chunks.push(rows.slice(i, i + CHUNK_SIZE));

      const statements = chunks.map((chunk) => this.db.insert(schema.payslips).values(chunk));
      await this.db.batch(statements as [any, ...any[]]);
    }

    return this.getRun(companyId, runId);
  }

  async getRuns(companyId: string, status?: string) {
    const where = status
      ? and(eq(schema.payrollRuns.companyId, companyId), eq(schema.payrollRuns.status, status))
      : eq(schema.payrollRuns.companyId, companyId);
    return this.db.query.payrollRuns.findMany({
      where,
      orderBy: [desc(schema.payrollRuns.periodYear), desc(schema.payrollRuns.periodMonth)],
    });
  }

  async getRun(companyId: string, runId: string) {
    const run = await this.db.query.payrollRuns.findFirst({
      where: and(eq(schema.payrollRuns.id, runId), eq(schema.payrollRuns.companyId, companyId)),
    });
    if (!run) return null;
    const payslips = await this.db.query.payslips.findMany({ where: eq(schema.payslips.runId, runId) });
    return { ...run, payslips };
  }

  async approveRun(companyId: string, runId: string, approvedBy?: string) {
    const run = await this.getRun(companyId, runId);
    if (!run) return null;
    if (run.status !== 'pending_approval') throw new Error(`Cannot approve a run in "${run.status}" status`);

    const [claimed] = await this.db
      .update(schema.payrollRuns)
      .set({ status: 'approved', approvedBy: approvedBy || null, approvedAt: new Date().toISOString() })
      .where(and(eq(schema.payrollRuns.id, runId), eq(schema.payrollRuns.status, 'pending_approval')))
      .returning({ id: schema.payrollRuns.id });
    if (!claimed) throw new Error('Run status changed before this approval could be applied');
    return this.getRun(companyId, runId);
  }

  async rejectRun(companyId: string, runId: string, reason?: string) {
    const run = await this.getRun(companyId, runId);
    if (!run) return null;
    if (run.status !== 'pending_approval') throw new Error(`Cannot reject a run in "${run.status}" status`);

    const [claimed] = await this.db
      .update(schema.payrollRuns)
      .set({ status: 'rejected', rejectedReason: reason || null })
      .where(and(eq(schema.payrollRuns.id, runId), eq(schema.payrollRuns.status, 'pending_approval')))
      .returning({ id: schema.payrollRuns.id });
    if (!claimed) throw new Error('Run status changed before this rejection could be applied');
    return this.getRun(companyId, runId);
  }

  async markRunPaid(companyId: string, runId: string) {
    const run = await this.getRun(companyId, runId);
    if (!run) return null;
    if (run.status !== 'approved') throw new Error(`Cannot mark a run in "${run.status}" status as paid`);

    const paidAt = new Date().toISOString();

    // Compare-and-swap on status: D1 has no interactive multi-statement
    // transaction to wrap the status flip + loan/compliance side effects below,
    // so a plain read-then-write here would let two concurrent (or retried)
    // mark-paid calls both pass the status check above and double-decrement
    // loan balances / duplicate compliance tasks. Scoping the UPDATE's WHERE to
    // status = 'approved' makes the flip itself atomic: only one concurrent
    // caller can ever move a given run out of 'approved', so only that caller
    // proceeds to apply the side effects.
    const [claimed] = await this.db
      .update(schema.payrollRuns)
      .set({ status: 'paid', paidAt })
      .where(and(eq(schema.payrollRuns.id, runId), eq(schema.payrollRuns.status, 'approved')))
      .returning({ id: schema.payrollRuns.id });

    if (!claimed) {
      throw new Error('Run is already being processed or has already been paid');
    }

    // Apply loan repayments for this run's employees.
    for (const ps of run.payslips) {
      if (!ps.loanDeductions) continue;
      // There may be multiple historical loans per employee; only the active one accrues.
      const activeLoan = await this.db.query.loans.findFirst({
        where: and(eq(schema.loans.companyId, companyId), eq(schema.loans.employeeId, ps.employeeId), eq(schema.loans.status, 'active')),
      });
      if (!activeLoan) continue;

      const newBalance = Math.max(0, activeLoan.remainingBalance - ps.loanDeductions);
      await this.db
        .update(schema.loans)
        .set({ remainingBalance: newBalance, status: newBalance === 0 ? 'completed' : 'active' })
        .where(eq(schema.loans.id, activeLoan.id));

      await this.db.insert(schema.loanRepayments).values({
        id: genId('RPY'),
        companyId,
        loanId: activeLoan.id,
        payrollRunId: runId,
        amount: ps.loanDeductions,
        balanceAfter: newBalance,
        paidAt,
      });
    }

    // Generate statutory remittance tasks due the following month.
    const np = nextPeriod(run.periodMonth, run.periodYear);
    const pad = (n: number) => String(n).padStart(2, '0');
    const periodLabel = new Date(run.periodYear, run.periodMonth - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });

    // PAYE/Pension/NHF are genuinely monthly obligations, so a task is
    // generated every run. NSITF and ITF are not: NSITF is remitted quarterly
    // and ITF is an annual levy, so generating a task for them on every run
    // overstated the filing calendar. Only emit those two on the run that
    // closes out their period (quarter-end / year-end), and size the task to
    // the accumulated contribution across that whole period rather than just
    // the closing month's slice of it.
    const tasksToInsert: (typeof schema.complianceTasks.$inferInsert)[] = [
      {
        id: genId('CT'),
        companyId,
        payrollRunId: runId,
        title: `${periodLabel} PAYE Filing`,
        type: 'tax',
        dueDate: `${np.year}-${pad(np.month)}-10`,
        amount: run.totalTaxes,
        status: 'pending',
      },
      {
        id: genId('CT'),
        companyId,
        payrollRunId: runId,
        title: `${periodLabel} Pension Remittance`,
        type: 'pension',
        dueDate: `${np.year}-${pad(np.month)}-07`,
        amount: run.totalPension,
        status: 'pending',
      },
      {
        id: genId('CT'),
        companyId,
        payrollRunId: runId,
        title: `${periodLabel} NHF Remittance`,
        type: 'nhf',
        dueDate: `${np.year}-${pad(np.month)}-30`,
        amount: run.totalNhf || 0,
        status: 'pending',
      },
    ];

    const isQuarterEnd = run.periodMonth % 3 === 0;
    if (isQuarterEnd) {
      const quarterStartMonth = run.periodMonth - 2;
      const quarterMonths = [quarterStartMonth, quarterStartMonth + 1, quarterStartMonth + 2];
      const quarterRuns = await this.db.query.payrollRuns.findMany({
        where: and(
          eq(schema.payrollRuns.companyId, companyId),
          eq(schema.payrollRuns.periodYear, run.periodYear),
          inArray(schema.payrollRuns.periodMonth, quarterMonths),
          eq(schema.payrollRuns.status, 'paid'),
        ),
      });
      const quarterNsitf = quarterRuns.reduce((sum: number, r: any) => sum + (r.totalNsitf || 0), 0);
      const quarterLabel = `Q${run.periodMonth / 3} ${run.periodYear}`;
      tasksToInsert.push({
        id: genId('CT'),
        companyId,
        payrollRunId: runId,
        title: `${quarterLabel} NSITF Contribution`,
        type: 'nsitf',
        dueDate: `${np.year}-${pad(np.month)}-30`,
        amount: quarterNsitf,
        status: 'pending',
      });
    }

    const isYearEnd = run.periodMonth === 12;
    if (isYearEnd) {
      const yearRuns = await this.db.query.payrollRuns.findMany({
        where: and(
          eq(schema.payrollRuns.companyId, companyId),
          eq(schema.payrollRuns.periodYear, run.periodYear),
          eq(schema.payrollRuns.status, 'paid'),
        ),
      });
      const yearItf = yearRuns.reduce((sum: number, r: any) => sum + (r.totalItf || 0), 0);
      tasksToInsert.push({
        id: genId('CT'),
        companyId,
        payrollRunId: runId,
        title: `${run.periodYear} ITF Levy`,
        type: 'itf',
        dueDate: `${np.year}-${pad(np.month)}-30`,
        amount: yearItf,
        status: 'pending',
      });
    }

    await this.db.insert(schema.complianceTasks).values(tasksToInsert);

    return this.getRun(companyId, runId);
  }

  async getBankFile(companyId: string, runId: string) {
    const run = await this.getRun(companyId, runId);
    if (!run) return null;
    const header = 'Employee ID,Employee Name,Bank Name,Account Number,Account Name,Net Pay\n';
    const lines = run.payslips.map((ps: any) =>
      [ps.employeeId, ps.employeeName, ps.bankName || '', ps.accountNumber || '', ps.accountName || '', ps.netPay].join(',')
    );
    return { filename: `bank-file-${run.periodYear}-${String(run.periodMonth).padStart(2, '0')}.csv`, content: header + lines.join('\n') };
  }

  // ---------------- Statutory remittance schedules ----------------
  // One CSV per scheme, shaped to resemble what each agency's filing
  // actually asks for (PAYE per-state-IRS, Pension per-PFA, NHF/NSITF
  // per-employee, ITF as a single company-level levy line).
  async getRemittanceSchedule(companyId: string, runId: string, type: 'paye' | 'pension' | 'nhf' | 'nsitf' | 'itf') {
    const run = await this.getRun(companyId, runId);
    if (!run) return null;

    const employeeIds = run.payslips.map((ps: any) => ps.employeeId);
    const [employees, settings] = await Promise.all([
      employeeIds.length ? this.db.query.employees.findMany({ where: inArray(schema.employees.id, employeeIds) }) : Promise.resolve([]),
      this.getSettings(companyId),
    ]);
    const empById = new Map<string, any>(employees.map((e: any) => [e.id, e]));

    const periodLabel = `${run.periodYear}-${String(run.periodMonth).padStart(2, '0')}`;
    const csv = (header: string, rows: string[]) => ({ filename: `${type}-remittance-${periodLabel}.csv`, content: header + '\n' + rows.join('\n') });

    if (type === 'paye') {
      const header = 'Employee Name,TIN,Tax State,Gross Annual,PAYE Deducted (Monthly)';
      const rows = run.payslips.map((ps: any) => {
        const emp = empById.get(ps.employeeId);
        return [ps.employeeName, emp?.tin || '', emp?.taxState || '', ps.grossPay * 12, ps.taxDeductions].join(',');
      });
      return csv(header, rows);
    }

    if (type === 'pension') {
      const header = 'Employee Name,PFA,Pension PIN,Employee Contribution,Employer Contribution,Total';
      const rows = run.payslips.map((ps: any) => {
        const emp = empById.get(ps.employeeId);
        const employerContribution = Math.round((ps.basicSalary + ps.allowances) * ((settings.pensionEmployerRate ?? 10) / 100));
        return [ps.employeeName, emp?.pfa || '', emp?.pensionId || '', ps.pensionDeductions, employerContribution, ps.pensionDeductions + employerContribution].join(',');
      });
      return csv(header, rows);
    }

    if (type === 'nhf') {
      const header = 'Employee Name,NHF Number,Basic Salary,NHF Contribution';
      const rows = run.payslips.map((ps: any) => {
        const emp = empById.get(ps.employeeId);
        return [ps.employeeName, emp?.nhf || '', ps.basicSalary, ps.nhfDeductions].join(',');
      });
      return csv(header, rows);
    }

    if (type === 'nsitf') {
      const header = 'Employee Name,NIN,Gross Pay,NSITF Contribution (Employer)';
      const rows = run.payslips.map((ps: any) => {
        const emp = empById.get(ps.employeeId);
        return [ps.employeeName, emp?.nin || '', ps.grossPay, ps.nsitfContribution].join(',');
      });
      return csv(header, rows);
    }

    // ITF is a flat annual levy on total payroll cost, filed at company
    // level rather than per-employee.
    const header = 'Period,Total Payroll Cost,ITF Levy (1%)';
    const totalItf = run.payslips.reduce((sum: number, ps: any) => sum + (ps.itfContribution || 0), 0);
    return csv(header, [[periodLabel, run.totalGross, totalItf].join(',')]);
  }

  // ---------------- Compliance ----------------
  async getComplianceTasks(companyId: string) {
    return this.db.query.complianceTasks.findMany({
      where: eq(schema.complianceTasks.companyId, companyId),
      orderBy: [desc(schema.complianceTasks.dueDate)],
    });
  }

  async completeComplianceTask(companyId: string, id: string, completedBy: string | undefined, reference?: string) {
    const existing = await this.db.query.complianceTasks.findFirst({
      where: and(eq(schema.complianceTasks.id, id), eq(schema.complianceTasks.companyId, companyId)),
    });
    if (!existing) return null;
    await this.db
      .update(schema.complianceTasks)
      .set({ status: 'completed', completedAt: new Date().toISOString(), completedBy: completedBy || null, reference: reference || null })
      .where(eq(schema.complianceTasks.id, id));
    return this.db.query.complianceTasks.findFirst({ where: eq(schema.complianceTasks.id, id) });
  }

  // ---------------- Dashboard ----------------
  async getDashboard(companyId: string, month: number, year: number) {
    const [preview, latestRuns, complianceTasks, loans] = await Promise.all([
      this.previewRun(companyId, month, year),
      this.getRuns(companyId),
      this.getComplianceTasks(companyId),
      this.getLoans(companyId),
    ]);

    const currentRun = latestRuns.find((r: any) => r.periodMonth === month && r.periodYear === year) || null;
    const pendingCompliance = complianceTasks.filter((t: any) => t.status === 'pending');
    const activeLoans = loans.filter((l: any) => l.status === 'active');

    return {
      periodMonth: month,
      periodYear: year,
      currentRun,
      preview: currentRun ? null : preview, // once a run exists for the period, its persisted figures are authoritative
      employeeCount: preview.employeeCount,
      totalGross: currentRun ? currentRun.totalGross : preview.totalGross,
      totalNet: currentRun ? currentRun.totalNet : preview.totalNet,
      totalTaxes: currentRun ? currentRun.totalTaxes : preview.totalTaxes,
      totalPension: currentRun ? currentRun.totalPension : preview.totalPension,
      totalNhf: currentRun ? currentRun.totalNhf : preview.totalNhf,
      totalNsitf: currentRun ? currentRun.totalNsitf : preview.totalNsitf,
      totalItf: currentRun ? currentRun.totalItf : preview.totalItf,
      totalLoanDeductions: currentRun ? currentRun.totalLoanDeductions : preview.totalLoanDeductions,
      exceptions: preview.exceptions,
      pendingComplianceCount: pendingCompliance.length,
      upcomingRemittances: pendingCompliance.slice(0, 5),
      activeLoanCount: activeLoans.length,
      activeLoanBalance: activeLoans.reduce((sum: number, l: any) => sum + l.remainingBalance, 0),
      recentRuns: latestRuns.slice(0, 5),
    };
  }
}
