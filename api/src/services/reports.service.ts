import { drizzle } from 'drizzle-orm/d1';
import { eq, and, inArray, gte } from 'drizzle-orm';
import * as schema from '../db/schema';

// ---------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------

const CHART_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#3b82f6',
  '#ec4899', '#14b8a6', '#f97316', '#0ea5e9', '#84cc16',
];

const GENDER_COLORS: Record<string, string> = {
  Male: '#3b82f6',
  Female: '#ec4899',
  'Non-binary': '#8b5cf6',
};

const monthKey = (d: Date) => d.toISOString().slice(0, 7); // 'YYYY-MM'

// Last `n` months (oldest first), ending at the current month.
const lastNMonths = (n: number, from: Date = new Date()) => {
  const months: { key: string; label: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(from.getFullYear(), from.getMonth() - i, 1);
    months.push({ key: monthKey(d), label: d.toLocaleString('en-US', { month: 'short', year: '2-digit' }) });
  }
  return months;
};

const groupCount = <T,>(rows: T[], keyFn: (row: T) => string): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const row of rows) {
    const key = keyFn(row) || 'Unspecified';
    out[key] = (out[key] || 0) + 1;
  }
  return out;
};

const groupSum = <T,>(rows: T[], keyFn: (row: T) => string, valueFn: (row: T) => number): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const row of rows) {
    const key = keyFn(row) || 'Unspecified';
    out[key] = (out[key] || 0) + (valueFn(row) || 0);
  }
  return out;
};

const toChartArray = (counts: Record<string, number>, colors: string[] = CHART_COLORS) =>
  Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({ name, value, fill: colors[i % colors.length] }));

const yearsBetween = (from: string, to: Date) =>
  (to.getTime() - new Date(from).getTime()) / (365.25 * 24 * 60 * 60 * 1000);

const csvEscape = (value: any): string => {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
};

const toCsv = (header: string[], rows: any[][]): string =>
  [header.map(csvEscape).join(','), ...rows.map((r) => r.map(csvEscape).join(','))].join('\n');

const dateStamp = () => new Date().toISOString().split('T')[0];

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export type ReportScope = { employeeIds?: string[] };

export class ReportsService {
  private db;

  constructor(dbBinding: any) {
    this.db = drizzle(dbBinding, { schema });
  }

  // ---------------------------------------------------------------------
  // Workforce
  // ---------------------------------------------------------------------
  async getWorkforceReport(companyId: string, scope: ReportScope = {}) {
    const conditions = [eq(schema.employees.companyId, companyId)];
    if (scope.employeeIds) {
      if (scope.employeeIds.length === 0) return this.emptyWorkforceReport();
      conditions.push(inArray(schema.employees.id, scope.employeeIds));
    }

    const all = await this.db.query.employees.findMany({
      where: and(...conditions),
      columns: {
        id: true, status: true, department: true, gender: true, employmentType: true,
        location: true, hireDate: true, salary: true, role: true,
      },
    });

    const now = new Date();
    const currentMonthKey = monthKey(now);
    const active = all.filter((e: any) => e.status === 'active' || e.status === 'onboarding');
    const withHireDate = active.filter((e: any) => !!e.hireDate);

    const tenures = withHireDate.map((e: any) => yearsBetween(e.hireDate, now));
    const avgTenureYears = tenures.length ? +(tenures.reduce((a: number, b: number) => a + b, 0) / tenures.length).toFixed(1) : 0;

    const statusCounts = groupCount(all, (e: any) => e.status || 'unknown');
    const nonActiveCount = all.length - active.length;
    const attritionRate = all.length > 0 ? +((nonActiveCount / all.length) * 100).toFixed(1) : 0;

    const tenureBuckets: Record<string, number> = { '<1yr': 0, '1-2yr': 0, '2-4yr': 0, '4-6yr': 0, '6yr+': 0 };
    for (const t of tenures) {
      if (t < 1) tenureBuckets['<1yr']++;
      else if (t < 2) tenureBuckets['1-2yr']++;
      else if (t < 4) tenureBuckets['2-4yr']++;
      else if (t < 6) tenureBuckets['4-6yr']++;
      else tenureBuckets['6yr+']++;
    }

    // Headcount trend (last 12 months): real hires-per-month from hireDate, plus
    // cumulative headcount as of each month end among employees on record today.
    const sortedByHire = [...withHireDate].sort((a: any, b: any) => (a.hireDate < b.hireDate ? -1 : 1));
    const headcountTrend = lastNMonths(12).map(({ key, label }) => ({
      month: label,
      hires: sortedByHire.filter((e: any) => e.hireDate.startsWith(key)).length,
      total: sortedByHire.filter((e: any) => e.hireDate.slice(0, 7) <= key).length,
    }));

    return {
      summary: {
        totalHeadcount: active.length,
        activeCount: statusCounts['active'] || 0,
        onboardingCount: statusCounts['onboarding'] || 0,
        newHiresThisMonth: active.filter((e: any) => e.hireDate?.startsWith(currentMonthKey)).length,
        avgTenureYears,
        attritionRate,
      },
      headcountTrend,
      departmentDistribution: toChartArray(groupCount(active, (e: any) => e.department || 'Unassigned')),
      genderDistribution: Object.entries(groupCount(active, (e: any) => e.gender || 'Unspecified'))
        .map(([name, value]) => ({ name, value, fill: GENDER_COLORS[name] || '#94a3b8' })),
      employmentTypeDistribution: toChartArray(groupCount(active, (e: any) => e.employmentType || 'Unspecified')),
      locationDistribution: toChartArray(groupCount(active, (e: any) => e.location || 'Unspecified')),
      tenureDistribution: Object.entries(tenureBuckets).map(([name, value]) => ({ name, value })),
      statusBreakdown: toChartArray(statusCounts),
    };
  }

  private emptyWorkforceReport() {
    return {
      summary: { totalHeadcount: 0, activeCount: 0, onboardingCount: 0, newHiresThisMonth: 0, avgTenureYears: 0, attritionRate: 0 },
      headcountTrend: lastNMonths(12).map(({ label }) => ({ month: label, hires: 0, total: 0 })),
      departmentDistribution: [], genderDistribution: [], employmentTypeDistribution: [],
      locationDistribution: [], tenureDistribution: [], statusBreakdown: [],
    };
  }

  // ---------------------------------------------------------------------
  // Recruitment (derived entirely from job_requisitions — there is no
  // candidate/interview/offer tracking table yet, so metrics that would need
  // one — cost-per-hire, offer acceptance, source effectiveness — are
  // intentionally left out rather than invented).
  // ---------------------------------------------------------------------
  async getRecruitmentReport(companyId: string) {
    const reqs = await this.db.query.jobRequisitions.findMany({
      where: eq(schema.jobRequisitions.companyId, companyId),
    });

    const now = new Date();
    const currentMonthKey = monthKey(now);
    const open = reqs.filter((r: any) => r.status === 'Open');
    const filled = reqs.filter((r: any) => r.status === 'Filled');

    const daysBetween = (a: string, b: string) => Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));

    const avgDaysOpen = open.length
      ? Math.round(open.reduce((sum: number, r: any) => sum + daysBetween(r.dateOpened, now.toISOString()), 0) / open.length)
      : 0;
    const filledWithDuration = filled.filter((r: any) => r.dateOpened && r.updatedAt);
    const avgTimeToFill = filledWithDuration.length
      ? Math.round(filledWithDuration.reduce((sum: number, r: any) => sum + daysBetween(r.dateOpened, r.updatedAt), 0) / filledWithDuration.length)
      : null;

    const monthlyTrend = lastNMonths(6).map(({ key, label }) => ({
      month: label,
      opened: reqs.filter((r: any) => r.dateOpened?.startsWith(key)).length,
      filled: filled.filter((r: any) => r.updatedAt?.startsWith(key)).length,
    }));

    return {
      summary: {
        totalRequisitions: reqs.length,
        openPositions: open.length,
        filledThisMonth: filled.filter((r: any) => r.updatedAt?.startsWith(currentMonthKey)).length,
        avgDaysOpen,
        avgTimeToFill,
      },
      statusBreakdown: toChartArray(groupCount(reqs, (r: any) => r.status || 'Unknown')),
      byDepartment: toChartArray(groupCount(reqs, (r: any) => r.department || 'Unassigned')),
      byPriority: toChartArray(groupCount(reqs, (r: any) => r.priority || 'Unspecified')),
      monthlyTrend,
    };
  }

  // ---------------------------------------------------------------------
  // Payroll
  // ---------------------------------------------------------------------
  async getPayrollReport(companyId: string) {
    const [paidRuns, activeEmployees, complianceTasks] = await Promise.all([
      this.db.query.payrollRuns.findMany({
        where: and(eq(schema.payrollRuns.companyId, companyId), eq(schema.payrollRuns.status, 'paid')),
      }),
      this.db.query.employees.findMany({
        where: and(eq(schema.employees.companyId, companyId), eq(schema.employees.status, 'active')),
        columns: { department: true, salary: true, baseSalary: true },
      }),
      this.db.query.complianceTasks.findMany({ where: eq(schema.complianceTasks.companyId, companyId) }),
    ]);

    const sortedRuns = [...paidRuns].sort((a: any, b: any) =>
      a.periodYear === b.periodYear ? a.periodMonth - b.periodMonth : a.periodYear - b.periodYear
    );
    const costTrend = sortedRuns.slice(-12).map((r: any) => ({
      month: `${MONTH_ABBR[r.periodMonth - 1] || r.periodMonth} '${String(r.periodYear).slice(2)}`,
      gross: r.totalGross,
      net: r.totalNet,
      tax: r.totalTaxes,
      pension: r.totalPension,
    }));

    const annualSalaryOf = (e: any) => e.salary || e.baseSalary || 0;
    const monthlyRunRate = Math.round(activeEmployees.reduce((sum: number, e: any) => sum + annualSalaryOf(e), 0) / 12);
    const costByDepartment = toChartArray(
      Object.fromEntries(
        Object.entries(groupSum(activeEmployees, (e: any) => e.department || 'Unassigned', annualSalaryOf))
          .map(([dept, annual]) => [dept, Math.round((annual as number) / 12)])
      )
    );

    const bands: Record<string, number> = { '<1M': 0, '1M-3M': 0, '3M-6M': 0, '6M-10M': 0, '10M+': 0 };
    for (const e of activeEmployees) {
      const s = annualSalaryOf(e);
      if (!s) continue;
      if (s < 1_000_000) bands['<1M']++;
      else if (s < 3_000_000) bands['1M-3M']++;
      else if (s < 6_000_000) bands['3M-6M']++;
      else if (s < 10_000_000) bands['6M-10M']++;
      else bands['10M+']++;
    }
    const salaryBands = Object.entries(bands).map(([name, value]) => ({ name, value }));

    const pending = complianceTasks.filter((t: any) => t.status === 'pending');
    const completed = complianceTasks.filter((t: any) => t.status === 'completed');
    const lastPaidRun = sortedRuns[sortedRuns.length - 1] || null;

    return {
      summary: {
        monthlyRunRate,
        lastPaidRunNet: lastPaidRun?.totalNet ?? null,
        lastPaidRunPeriod: lastPaidRun ? `${MONTH_ABBR[lastPaidRun.periodMonth - 1]} ${lastPaidRun.periodYear}` : null,
        pendingComplianceCount: pending.length,
        pendingComplianceAmount: pending.reduce((s: number, t: any) => s + (t.amount || 0), 0),
      },
      costTrend,
      costByDepartment,
      salaryBands,
      complianceSummary: {
        pending: pending.length,
        completed: completed.length,
        byType: toChartArray(groupCount(complianceTasks, (t: any) => t.type || 'other')),
      },
    };
  }

  // ---------------------------------------------------------------------
  // Leave & Attendance
  // ---------------------------------------------------------------------
  async getLeaveAttendanceReport(companyId: string, scope: ReportScope = {}) {
    if (scope.employeeIds && scope.employeeIds.length === 0) {
      return this.emptyLeaveAttendanceReport();
    }

    const leaveConditions = [eq(schema.leaveRequests.companyId, companyId)];
    if (scope.employeeIds) leaveConditions.push(inArray(schema.leaveRequests.employeeId, scope.employeeIds));
    const leaves = await this.db.query.leaveRequests.findMany({ where: and(...leaveConditions) });
    const approved = leaves.filter((l: any) => l.status === 'approved');

    const thisYear = String(new Date().getFullYear());
    const leaveByType = toChartArray(
      groupSum(approved.filter((l: any) => l.startDate?.startsWith(thisYear)), (l: any) => l.type || 'Other', (l: any) => l.days)
    );

    const leaveTrend = lastNMonths(6).map(({ key, label }) => ({
      month: label,
      days: approved.filter((l: any) => l.startDate?.startsWith(key)).reduce((s: number, l: any) => s + (l.days || 0), 0),
      requests: leaves.filter((l: any) => l.appliedOn?.startsWith(key)).length,
    }));

    const attConditions = [eq(schema.attendanceRecords.companyId, companyId)];
    if (scope.employeeIds) attConditions.push(inArray(schema.attendanceRecords.employeeId, scope.employeeIds));
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    attConditions.push(gte(schema.attendanceRecords.date, cutoff.toISOString().split('T')[0]));
    const records = await this.db.query.attendanceRecords.findMany({ where: and(...attConditions) });
    const withHours = records.filter((r: any) => (r.workHours || 0) > 0);
    const avgWorkHours = withHours.length
      ? +(withHours.reduce((s: number, r: any) => s + r.workHours, 0) / withHours.length).toFixed(2)
      : 0;

    const otConditions = [eq(schema.overtimeRequests.companyId, companyId)];
    if (scope.employeeIds) otConditions.push(inArray(schema.overtimeRequests.employeeId, scope.employeeIds));
    const overtimeRequests = await this.db.query.overtimeRequests.findMany({ where: and(...otConditions) });
    const currentMonthKey = monthKey(new Date());
    const approvedOvertimeHoursThisMonth = overtimeRequests
      .filter((o: any) => o.status === 'approved' && o.date?.startsWith(currentMonthKey))
      .reduce((s: number, o: any) => s + (o.hours || 0), 0);

    return {
      leaveByType,
      leaveTrend,
      leaveStatusBreakdown: toChartArray(groupCount(leaves, (l: any) => l.status || 'unknown')),
      attendance: {
        recordCount30d: records.length,
        avgWorkHours,
        statusBreakdown: toChartArray(groupCount(records, (r: any) => r.status || 'unknown')),
      },
      overtime: {
        approvedHoursThisMonth: approvedOvertimeHoursThisMonth,
        statusBreakdown: toChartArray(groupCount(overtimeRequests, (o: any) => o.status || 'unknown')),
      },
    };
  }

  private emptyLeaveAttendanceReport() {
    return {
      leaveByType: [], leaveTrend: lastNMonths(6).map(({ label }) => ({ month: label, days: 0, requests: 0 })),
      leaveStatusBreakdown: [],
      attendance: { recordCount30d: 0, avgWorkHours: 0, statusBreakdown: [] },
      overtime: { approvedHoursThisMonth: 0, statusBreakdown: [] },
    };
  }

  // ---------------------------------------------------------------------
  // Performance
  // ---------------------------------------------------------------------
  async getPerformanceReport(companyId: string, scope: ReportScope = {}) {
    if (scope.employeeIds && scope.employeeIds.length === 0) {
      return { goalsByStatus: [], avgGoalProgress: 0, totalGoals: 0, assessmentsByStatus: [], totalAssessments: 0, ratingDistribution: [] };
    }

    const goalConditions = [eq(schema.goals.companyId, companyId)];
    if (scope.employeeIds) goalConditions.push(inArray(schema.goals.employeeId, scope.employeeIds));
    const goals = await this.db.query.goals.findMany({ where: and(...goalConditions) });

    const assessConditions = [eq(schema.assessments.companyId, companyId)];
    if (scope.employeeIds) assessConditions.push(inArray(schema.assessments.employeeId, scope.employeeIds));
    const assessments = await this.db.query.assessments.findMany({ where: and(...assessConditions) });

    return {
      goalsByStatus: toChartArray(groupCount(goals, (g: any) => g.status || 'unknown')),
      avgGoalProgress: goals.length ? +(goals.reduce((s: number, g: any) => s + (g.progress || 0), 0) / goals.length).toFixed(1) : 0,
      totalGoals: goals.length,
      assessmentsByStatus: toChartArray(groupCount(assessments, (a: any) => a.status || 'unknown')),
      totalAssessments: assessments.length,
      ratingDistribution: toChartArray(groupCount(assessments.filter((a: any) => a.managerRating), (a: any) => a.managerRating)),
    };
  }

  // ---------------------------------------------------------------------
  // Combined views
  // ---------------------------------------------------------------------
  async getOverview(companyId: string) {
    const [workforce, recruitment, payroll, leaveAttendance, performance] = await Promise.all([
      this.getWorkforceReport(companyId),
      this.getRecruitmentReport(companyId),
      this.getPayrollReport(companyId),
      this.getLeaveAttendanceReport(companyId),
      this.getPerformanceReport(companyId),
    ]);
    return { generatedAt: new Date().toISOString(), workforce, recruitment, payroll, leaveAttendance, performance };
  }

  // Direct-report-scoped view for a manager's own "Reports" tab.
  async getTeamReport(companyId: string, managerId: string) {
    const team = await this.db.query.employees.findMany({
      where: and(eq(schema.employees.companyId, companyId), eq(schema.employees.managerId, managerId)),
      columns: { id: true, name: true, lastName: true, avatar: true, department: true, role: true },
    });
    const employeeIds = team.map((t: any) => t.id);
    const [workforce, leaveAttendance, performance] = await Promise.all([
      this.getWorkforceReport(companyId, { employeeIds }),
      this.getLeaveAttendanceReport(companyId, { employeeIds }),
      this.getPerformanceReport(companyId, { employeeIds }),
    ]);
    return {
      generatedAt: new Date().toISOString(),
      teamSize: employeeIds.length,
      team: team.map((t: any) => ({ id: t.id, name: `${t.name} ${t.lastName || ''}`.trim(), avatar: t.avatar, department: t.department, role: t.role })),
      workforce,
      leaveAttendance,
      performance,
    };
  }

  // ---------------------------------------------------------------------
  // CSV export — real records straight out of the tables backing each report.
  // ---------------------------------------------------------------------
  async exportCsv(companyId: string, type: string, opts: { month?: number; year?: number } = {}): Promise<{ filename: string; content: string } | null> {
    switch (type) {
      case 'employees': {
        const rows = await this.db.query.employees.findMany({ where: eq(schema.employees.companyId, companyId) });
        const header = ['Employee ID', 'First Name', 'Last Name', 'Email', 'Department', 'Role', 'Employment Type', 'Status', 'Location', 'Hire Date', 'Gender', 'Annual Salary'];
        const lines = rows.map((e: any) => [e.id, e.name, e.lastName, e.email, e.department, e.role, e.employmentType, e.status, e.location, e.hireDate, e.gender, e.salary]);
        return { filename: `workforce-export-${dateStamp()}.csv`, content: toCsv(header, lines) };
      }
      case 'requisitions': {
        const rows = await this.db.query.jobRequisitions.findMany({ where: eq(schema.jobRequisitions.companyId, companyId) });
        const header = ['Requisition ID', 'Title', 'Department', 'Location', 'Employment Type', 'Priority', 'Status', 'Hiring Manager', 'Date Opened', 'Target Hire Date', 'Days Open'];
        const now = new Date().toISOString();
        const lines = rows.map((r: any) => [r.id, r.title, r.department, r.location, r.employmentType, r.priority, r.status, r.hiringManager, r.dateOpened, r.targetHireDate, Math.max(0, Math.round((new Date(now).getTime() - new Date(r.dateOpened).getTime()) / 86400000))]);
        return { filename: `recruitment-export-${dateStamp()}.csv`, content: toCsv(header, lines) };
      }
      case 'leave': {
        const rows = await this.db.query.leaveRequests.findMany({ where: eq(schema.leaveRequests.companyId, companyId) });
        const header = ['Request ID', 'Employee ID', 'Type', 'Start Date', 'End Date', 'Days', 'Status', 'Applied On'];
        const lines = rows.map((l: any) => [l.id, l.employeeId, l.type, l.startDate, l.endDate, l.days, l.status, l.appliedOn]);
        return { filename: `leave-export-${dateStamp()}.csv`, content: toCsv(header, lines) };
      }
      case 'payroll': {
        if (!opts.month || !opts.year) return null;
        const run = await this.db.query.payrollRuns.findFirst({
          where: and(eq(schema.payrollRuns.companyId, companyId), eq(schema.payrollRuns.periodMonth, opts.month), eq(schema.payrollRuns.periodYear, opts.year)),
        });
        if (!run) return null;
        const payslips = await this.db.query.payslips.findMany({ where: eq(schema.payslips.runId, run.id) });
        const header = ['Employee ID', 'Employee Name', 'Department', 'Basic Salary', 'Allowances', 'Bonuses', 'Gross Pay', 'Tax', 'Pension', 'Loan Deductions', 'Other Deductions', 'Net Pay'];
        const lines = payslips.map((p: any) => [p.employeeId, p.employeeName, p.department, p.basicSalary, p.allowances, p.bonuses, p.grossPay, p.taxDeductions, p.pensionDeductions, p.loanDeductions, p.otherDeductions, p.netPay]);
        return { filename: `payroll-export-${run.periodYear}-${String(run.periodMonth).padStart(2, '0')}.csv`, content: toCsv(header, lines) };
      }
      default:
        return null;
    }
  }
}
