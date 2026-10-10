import { drizzle } from 'drizzle-orm/d1';
import { eq, and, gte, lte, asc, desc, inArray, getTableColumns } from 'drizzle-orm';
import * as schema from '../db/schema';

const genId = (prefix: string) => `${prefix}-${crypto.randomUUID().split('-')[0].toUpperCase()}`;

// Nigeria Tax Act 2025 statutory PAYE progressive bands (effective 1 January 2026)
// First ₦800k at 0%, next ₦2.2m at 15%, next ₦9m at 18%, next ₦13m at 21%, next ₦25m at 23%, above ₦50m at 25%
const DEFAULT_TAX_BRACKETS = [
  { minIncome: 0, maxIncome: 800000, ratePercent: 0 },
  { minIncome: 800001, maxIncome: 3000000, ratePercent: 15 },
  { minIncome: 3000001, maxIncome: 12000000, ratePercent: 18 },
  { minIncome: 12000001, maxIncome: 25000000, ratePercent: 21 },
  { minIncome: 25000001, maxIncome: 50000000, ratePercent: 23 },
  { minIncome: 50000001, maxIncome: null as number | null, ratePercent: 25 },
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
    if (existing) return { ...existing, disbursementDay: existing.paymentDay };

    const settings = { companyId, ...DEFAULT_SETTINGS, disbursementDay: DEFAULT_SETTINGS.paymentDay };
    await this.db.insert(schema.payrollSettings).values({ companyId, ...DEFAULT_SETTINGS });
    return settings;
  }

  async updateSettings(companyId: string, payload: any) {
    await this.getSettings(companyId); // ensure a row exists to update
    const { companyId: _drop, createdAt, updatedAt, ...rest } = payload || {};
    if (rest.disbursementDay !== undefined && rest.paymentDay === undefined) {
      rest.paymentDay = rest.disbursementDay;
    }
    const allowed = [
      'payCycle', 'cutoffDay', 'paymentDay', 'workingDaysPerMonth',
      'prorationEnabled', 'minWageCheckEnabled', 'minWageAnnual',
      'pensionEmployeeRate', 'pensionEmployerRate',
      'nhfEnabled', 'nhfRate',
      'nsitfEnabled', 'nsitfRate', 'itfEnabled', 'itfRate', 'currency'
    ];
    const updateData: Record<string, any> = {};
    for (const key of allowed) {
      if (key in rest) {
        if (typeof rest[key] === 'boolean') {
          updateData[key] = rest[key];
        } else if (typeof rest[key] === 'number') {
          updateData[key] = rest[key];
        } else if (typeof rest[key] === 'string') {
          if (['cutoffDay', 'paymentDay', 'workingDaysPerMonth', 'minWageAnnual', 'pensionEmployeeRate', 'pensionEmployerRate', 'nhfRate', 'nsitfRate', 'itfRate'].includes(key)) {
            updateData[key] = Number(rest[key]) || 0;
          } else {
            updateData[key] = rest[key];
          }
        }
      }
    }
    if (Object.keys(updateData).length > 0) {
      await this.db.update(schema.payrollSettings).set(updateData).where(eq(schema.payrollSettings.companyId, companyId));
    }
    return this.getSettings(companyId);
  }

  // ---------------- Tax brackets ----------------
  async getTaxBrackets(companyId: string) {
    const existing = await this.db.query.taxBrackets.findMany({
      where: eq(schema.taxBrackets.companyId, companyId),
      orderBy: [asc(schema.taxBrackets.sortOrder)],
    });
    // If existing brackets are still using repealed PITA 2011/Finance Act bands (0-300k @ 7%), auto-upgrade to NTA 2025
    const isOldPita = existing.length > 0 && existing[0].maxIncome === 300000 && existing[0].ratePercent === 7;
    if (existing.length > 0 && !isOldPita) return existing;

    const rows = DEFAULT_TAX_BRACKETS.map((b, i) => ({ id: genId('TB'), companyId, ...b, sortOrder: i }));
    if (isOldPita) {
      await this.db.delete(schema.taxBrackets).where(eq(schema.taxBrackets.companyId, companyId));
    }
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

  async resetTaxBracketsToDefaults(companyId: string) {
    return this.replaceTaxBrackets(companyId, DEFAULT_TAX_BRACKETS);
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
    const row = {
      id: genId('SC'),
      companyId,
      name: payload.name?.trim() || 'Untitled Component',
      type: payload.type === 'deduction' ? 'deduction' : 'earning',
      calculationType: payload.calculationType || 'fixed',
      value: Number(payload.value) || 0,
      taxable: payload.taxable !== undefined ? Boolean(payload.taxable) : true,
      statutory: false,
      active: payload.active !== undefined ? Boolean(payload.active) : true,
    };
    await this.db.insert(schema.salaryComponents).values(row);
    return row;
  }

  async updateSalaryComponent(companyId: string, id: string, payload: any) {
    const existing = await this.db.query.salaryComponents.findFirst({
      where: and(eq(schema.salaryComponents.id, id), eq(schema.salaryComponents.companyId, companyId)),
    });
    if (!existing) return null;
    const { id: _id, companyId: _c, createdAt, updatedAt, ...rest } = payload || {};
    const sanitized: Record<string, any> = {};
    if (rest.name !== undefined) sanitized.name = rest.name.trim();
    if (rest.type !== undefined) sanitized.type = rest.type;
    if (rest.calculationType !== undefined) sanitized.calculationType = rest.calculationType;
    if (rest.value !== undefined) sanitized.value = Number(rest.value) || 0;
    if (rest.taxable !== undefined) sanitized.taxable = Boolean(rest.taxable);
    if (rest.active !== undefined) sanitized.active = Boolean(rest.active);

    await this.db
      .update(schema.salaryComponents)
      .set(sanitized)
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
    const row = {
      id: genId('PG'),
      companyId,
      name: payload.name?.trim() || 'Untitled Grade',
      level: Number(payload.level) || 1,
      minSalary: Number(payload.minSalary) || 0,
      maxSalary: Number(payload.maxSalary) || 0,
    };
    await this.db.insert(schema.payGrades).values(row);
    return row;
  }

  async updatePayGrade(companyId: string, id: string, payload: any) {
    const existing = await this.db.query.payGrades.findFirst({
      where: and(eq(schema.payGrades.id, id), eq(schema.payGrades.companyId, companyId)),
    });
    if (!existing) return null;
    const { id: _id, companyId: _c, createdAt, updatedAt, ...rest } = payload || {};
    const sanitized: Record<string, any> = {};
    if (rest.name !== undefined) sanitized.name = rest.name.trim();
    if (rest.level !== undefined) sanitized.level = Number(rest.level) || 1;
    if (rest.minSalary !== undefined) sanitized.minSalary = Number(rest.minSalary) || 0;
    if (rest.maxSalary !== undefined) sanitized.maxSalary = Number(rest.maxSalary) || 0;

    await this.db.update(schema.payGrades).set(sanitized).where(and(eq(schema.payGrades.id, id), eq(schema.payGrades.companyId, companyId)));
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
      status: payload.status || 'active',
      purpose: payload.purpose || null,
      startDate: payload.startDate || new Date().toISOString().slice(0, 10),
    };
    await this.db.insert(schema.loans).values(row);
    return row;
  }

  async updateLoan(companyId: string, id: string, payload: any) {
    const existing = await this.db.query.loans.findFirst({
      where: and(eq(schema.loans.id, id), eq(schema.loans.companyId, companyId)),
    });
    if (!existing) return null;

    const { id: _id, companyId: _c, createdAt, updatedAt, ...rest } = payload || {};
    const sanitized: Record<string, any> = {};
    if (rest.status !== undefined) sanitized.status = rest.status;
    if (rest.principal !== undefined) sanitized.principal = Number(rest.principal) || 0;
    if (rest.interestRatePercent !== undefined) sanitized.interestRatePercent = Number(rest.interestRatePercent) || 0;
    if (rest.durationMonths !== undefined) sanitized.durationMonths = Number(rest.durationMonths) || 1;
    if (rest.monthlyInstallment !== undefined) sanitized.monthlyInstallment = Number(rest.monthlyInstallment) || 0;
    if (rest.remainingBalance !== undefined) {
      sanitized.remainingBalance = Math.max(0, Number(rest.remainingBalance) || 0);
      if (sanitized.remainingBalance === 0) sanitized.status = 'completed';
    }
    if (rest.purpose !== undefined) sanitized.purpose = rest.purpose;
    if (rest.startDate !== undefined) sanitized.startDate = rest.startDate;

    await this.db.update(schema.loans).set(sanitized).where(and(eq(schema.loans.id, id), eq(schema.loans.companyId, companyId)));
    return this.db.query.loans.findFirst({ where: eq(schema.loans.id, id) });
  }

  async deleteLoan(companyId: string, id: string) {
    const existing = await this.db.query.loans.findFirst({ where: and(eq(schema.loans.id, id), eq(schema.loans.companyId, companyId)) });
    if (!existing) return null;
    await this.db.delete(schema.loanRepayments).where(eq(schema.loanRepayments.loanId, id));
    await this.db.delete(schema.loans).where(eq(schema.loans.id, id));
    return existing;
  }

  async getLoanRepayments(companyId: string, loanId: string) {
    return this.db.query.loanRepayments.findMany({
      where: and(eq(schema.loanRepayments.loanId, loanId), eq(schema.loanRepayments.companyId, companyId)),
      orderBy: [desc(schema.loanRepayments.paidAt)],
    });
  }

  async recordLoanRepayment(companyId: string, loanId: string, amount: number, payrollRunId?: string) {
    const loan = await this.db.query.loans.findFirst({
      where: and(eq(schema.loans.id, loanId), eq(schema.loans.companyId, companyId)),
    });
    if (!loan) throw new Error('Loan not found');

    const repayAmount = Math.min(amount, loan.remainingBalance);
    const balanceAfter = Math.max(0, loan.remainingBalance - repayAmount);

    const repayment = {
      id: genId('LR'),
      companyId,
      loanId,
      payrollRunId: payrollRunId || null,
      amount: repayAmount,
      balanceAfter,
      paidAt: new Date().toISOString(),
    };
    await this.db.insert(schema.loanRepayments).values(repayment);

    await this.db.update(schema.loans).set({
      remainingBalance: balanceAfter,
      status: balanceAfter === 0 ? 'completed' : loan.status,
    }).where(eq(schema.loans.id, loanId));

    return repayment;
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
  private computePayslip(
    emp: any,
    settings: any,
    brackets: any[],
    components: any[],
    month: number,
    year: number,
    attendance: { present: number; overtime: number } | undefined,
    loan: any,
    overrides: any
  ) {
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

    // Split gross per the company salary component catalogue (FR35, Sections 3.6.7 and 4.3.7)
    const activeEarnings = (components || []).filter((c: any) => c.type === 'earning' && c.active !== false);
    const basicComp = activeEarnings.find((c: any) => /basic/i.test(c.name));
    const housingComp = activeEarnings.find((c: any) => /housing/i.test(c.name));
    const transportComp = activeEarnings.find((c: any) => /transport/i.test(c.name));

    let basicSalary: number;
    if (basicComp) {
      if (basicComp.calculationType === 'percentage_of_gross') {
        basicSalary = Math.round(proratedGross * ((basicComp.value || 40) / 100));
      } else if (basicComp.calculationType === 'fixed') {
        basicSalary = Math.min(proratedGross, Math.round(basicComp.value * prorationFactor));
      } else {
        basicSalary = Math.round(proratedGross * 0.4);
      }
    } else {
      basicSalary = Math.round(proratedGross * 0.4);
    }

    let housingAllowance = 0;
    if (housingComp) {
      if (housingComp.calculationType === 'percentage_of_basic') {
        housingAllowance = Math.round(basicSalary * ((housingComp.value || 50) / 100));
      } else if (housingComp.calculationType === 'percentage_of_gross') {
        housingAllowance = Math.round(proratedGross * ((housingComp.value || 20) / 100));
      } else if (housingComp.calculationType === 'fixed') {
        housingAllowance = Math.round(housingComp.value * prorationFactor);
      }
    } else {
      housingAllowance = Math.round(basicSalary * 0.5); // Statutory baseline: 50% of basic
    }

    let transportAllowance = 0;
    if (transportComp) {
      if (transportComp.calculationType === 'percentage_of_basic') {
        transportAllowance = Math.round(basicSalary * ((transportComp.value || 25) / 100));
      } else if (transportComp.calculationType === 'percentage_of_gross') {
        transportAllowance = Math.round(proratedGross * ((transportComp.value || 10) / 100));
      } else if (transportComp.calculationType === 'fixed') {
        transportAllowance = Math.round(transportComp.value * prorationFactor);
      }
    } else {
      transportAllowance = Math.round(proratedGross * 0.1); // Statutory baseline: 10% of gross
    }

    const otherAllowances = Math.max(0, proratedGross - basicSalary - housingAllowance - transportAllowance);
    const allowances = housingAllowance + transportAllowance + otherAllowances;
    const bonuses = Math.max(0, Math.round(Number(overrides?.bonuses) || 0));

    const grossPay = proratedGross + bonuses;

    // Pension Reform Act 2014: statutory pension base = basic + housing + transport
    const pensionableBase = basicSalary + housingAllowance + transportAllowance;
    const pensionDeductions = Math.round(pensionableBase * ((settings.pensionEmployeeRate ?? 8) / 100));

    // NHF: 2.5% of basic salary
    const nhfDeductions = settings.nhfEnabled ? Math.round(basicSalary * ((settings.nhfRate ?? 2.5) / 100)) : 0;
    const nsitfContribution = settings.nsitfEnabled ? Math.round(grossPay * ((settings.nsitfRate ?? 1) / 100)) : 0;
    const itfContribution = settings.itfEnabled ? Math.round(grossPay * ((settings.itfRate ?? 1) / 100)) : 0;

    // Nigeria Tax Act 2025: Deduct eligible statutory and personal reliefs before bands
    // 1. Pension contribution (employee)
    // 2. NHF (National Housing Fund)
    // 3. NHIS (National Health Insurance Scheme)
    // 4. Mortgage interest on owner-occupied residence
    // 5. Life insurance / annuity premiums
    // 6. Rent relief: 20% of annual rent paid, capped at ₦500,000
    const grossAnnual = grossPay * 12;
    const statutoryReliefAnnual = (pensionDeductions + nhfDeductions) * 12;

    const annualRent = Number(emp.annualRent) || Number(emp.rentPaid) || 0;
    const rentReliefAnnual = Math.min(500000, Math.round(annualRent * 0.20));

    const nhisAnnual = (Number(emp.nhisMonthly) || 0) * 12;
    const mortgageInterestAnnual = Number(emp.mortgageInterestAnnual) || 0;
    const lifeInsuranceAnnual = Number(emp.lifeInsuranceAnnual) || 0;

    const totalEligibleReliefsAnnual = statutoryReliefAnnual + rentReliefAnnual + nhisAnnual + mortgageInterestAnnual + lifeInsuranceAnnual;
    const taxableAnnual = Math.max(0, grossAnnual - totalEligibleReliefsAnnual);

    // Progressive PAYE under NTA 2025 (first ₦800,000 has 0% tax)
    const annualPaye = calculateAnnualPaye(taxableAnnual, brackets);
    const taxDeductions = Math.round(annualPaye / 12);

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
      housingAllowance,
      transportAllowance,
      otherAllowances,
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
      pensionableBase,
      taxableAnnual,
      rentReliefAnnual,
    };
  }

  async previewRun(companyId: string, month: number, year: number, overrides: Record<string, any> = {}) {
    const [activeEmployees, settings, brackets, components, attendanceMap, loanMap] = await Promise.all([
      this.db.query.employees.findMany({
        where: and(eq(schema.employees.companyId, companyId), eq(schema.employees.status, 'active')),
      }),
      this.getSettings(companyId),
      this.getTaxBrackets(companyId),
      this.getSalaryComponents(companyId),
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
      const ps = this.computePayslip(emp, settings, brackets, components, month, year, attendanceMap.get(emp.id), loanMap.get(emp.id), overrides?.[emp.id]);
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

    const runInsert = this.db.insert(schema.payrollRuns).values({
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

    // D1 caps bound parameters at 100 per statement, and Drizzle binds every
    // column of the table (not just the fields supplied), so size chunks from
    // the column count. The run header goes in the same batch so a failed
    // payslip insert can't leave an orphaned run locking the period.
    const CHUNK_SIZE = Math.floor(100 / Object.keys(getTableColumns(schema.payslips)).length);
    const payslipInserts = [];
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      payslipInserts.push(this.db.insert(schema.payslips).values(rows.slice(i, i + CHUNK_SIZE)));
    }
    await this.db.batch([runInsert, ...payslipInserts]);

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
