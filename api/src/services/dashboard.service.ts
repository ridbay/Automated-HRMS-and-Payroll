import { drizzle } from 'drizzle-orm/d1';
import { eq, sql, and, gte, like } from 'drizzle-orm';
import * as schema from '../db/schema';

export class DashboardService {
  private db;

  constructor(dbBinding: any) {
    this.db = drizzle(dbBinding, { schema });
  }

  async getDashboardStats(companyId: string) {
    // 1. Total Headcount (Active + Onboarding)
    const headcountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.employees)
      .where(
        and(
          eq(schema.employees.companyId, companyId),
          sql`${schema.employees.status} IN ('active', 'onboarding')`
        )
      );
    const totalHeadcount = headcountResult[0]?.count || 0;

    // 2. New Hires this month (simple approach: check hireDate for current month/year)
    const currentYearMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
    const newHiresResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.employees)
      .where(
        and(
          eq(schema.employees.companyId, companyId),
          like(schema.employees.hireDate, `${currentYearMonth}%`)
        )
      );
    const newHires = newHiresResult[0]?.count || 0;

    // 3. Open Positions
    const openPositionsResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.jobRequisitions)
      .where(
        and(
          eq(schema.jobRequisitions.companyId, companyId),
          sql`${schema.jobRequisitions.status} IN ('Sourcing', 'Interviewing', 'Open')`
        )
      );
    const openPositions = openPositionsResult[0]?.count || 0;

    // 4. Department Mix
    const deptResult = await this.db
      .select({
        name: schema.employees.department,
        value: sql<number>`count(*)`
      })
      .from(schema.employees)
      .where(
        and(
          eq(schema.employees.companyId, companyId),
          sql`${schema.employees.status} IN ('active', 'onboarding')`
        )
      )
      .groupBy(schema.employees.department);
      
    // Map colors
    const colors = ["#6366f1", "#10b981", "#f59e0b", "#8b5cf6", "#3b82f6", "#ec4899", "#14b8a6"];
    const deptData = deptResult.map((d, i) => ({
      name: d.name || 'Unassigned',
      value: d.value,
      fill: colors[i % colors.length]
    }));

    // 5. Diversity (Gender)
    const diversityResult = await this.db
      .select({
        name: schema.employees.gender,
        value: sql<number>`count(*)`
      })
      .from(schema.employees)
      .where(
        and(
          eq(schema.employees.companyId, companyId),
          sql`${schema.employees.status} IN ('active', 'onboarding')`
        )
      )
      .groupBy(schema.employees.gender);
      
    const genderColors: Record<string, string> = {
      'Male': '#3b82f6',
      'Female': '#ec4899',
      'Non-binary': '#8b5cf6',
      'Prefer not to say': '#94a3b8'
    };
    const diversityData = diversityResult.map((d) => ({
      name: d.name || 'Unassigned',
      value: d.value,
      fill: genderColors[d.name || ''] || '#f59e0b'
    }));

    // Attrition & headcount trend, computed from real hire dates (employees.hireDate)
    // and real completed offboarding transitions (transitions.completedAt) rather than
    // simulated values.
    const today = new Date();
    const toDateStr = (d: Date) => d.toISOString().slice(0, 10);

    const allEmployeeDates = await this.db
      .select({ hireDate: schema.employees.hireDate })
      .from(schema.employees)
      .where(eq(schema.employees.companyId, companyId));

    const completedExits = await this.db
      .select({ completedAt: schema.transitions.completedAt })
      .from(schema.transitions)
      .where(
        and(
          eq(schema.transitions.companyId, companyId),
          eq(schema.transitions.type, 'Offboarding'),
          eq(schema.transitions.status, 'Completed')
        )
      );

    const hireDates = allEmployeeDates.map((e) => e.hireDate).filter((d): d is string => !!d);
    const exitDates = completedExits
      .map((e) => e.completedAt?.slice(0, 10))
      .filter((d): d is string => !!d);

    const headcountAsOf = (dateStr: string) =>
      hireDates.filter((d) => d <= dateStr).length - exitDates.filter((d) => d <= dateStr).length;

    const monthsBack = 6;
    const headcountTrend = Array.from({ length: monthsBack }, (_, idx) => {
      const i = monthsBack - 1 - idx;
      const monthStartDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthEndDate = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
      const start = toDateStr(monthStartDate);
      const end = toDateStr(monthEndDate);

      return {
        month: monthStartDate.toLocaleString('en-US', { month: 'short' }),
        total: Math.max(headcountAsOf(end), 0),
        hires: hireDates.filter((d) => d >= start && d <= end).length,
        exits: exitDates.filter((d) => d >= start && d <= end).length,
      };
    });

    const twelveMonthsAgo = new Date(today);
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const twelveMonthsAgoStr = toDateStr(twelveMonthsAgo);

    const exitsLast12mo = exitDates.filter((d) => d >= twelveMonthsAgoStr).length;
    const headcountStartOf12mo = Math.max(headcountAsOf(twelveMonthsAgoStr), 0);
    const avgHeadcount = (headcountStartOf12mo + totalHeadcount) / 2;
    const attritionRate = avgHeadcount > 0
      ? `${((exitsLast12mo / avgHeadcount) * 100).toFixed(1)}%`
      : '0%';

    // Calculate total payroll roughly (sum of salaries)
    const payrollResult = await this.db
      .select({ total: sql<number>`sum(${schema.employees.salary})` })
      .from(schema.employees)
      .where(
        and(
          eq(schema.employees.companyId, companyId),
          sql`${schema.employees.status} = 'active'`
        )
      );
    const totalPayroll = payrollResult[0]?.total || 0;

    // --- Dynamic Data for Alerts, Logs, Events ---

    // 1. Alerts
    const alerts = [];
    
    // 1a. Probation Ending (next 30 days)
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const todayStr = today.toISOString().slice(0, 10);
    const thirtyDaysStr = thirtyDaysFromNow.toISOString().slice(0, 10);

    const probationResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.employees)
      .where(
        and(
          eq(schema.employees.companyId, companyId),
          gte(schema.employees.probationEnd, todayStr),
          sql`${schema.employees.probationEnd} <= ${thirtyDaysStr}`
        )
      );
    
    const probationCount = probationResult[0]?.count || 0;
    if (probationCount > 0) {
      alerts.push({
        title: "Probation Ending",
        sub: `${probationCount} Employees (Next 30 days)`,
        type: "red",
        iconType: "UserCheck"
      });
    }

    // 1b. Pending Leave Requests
    const pendingLeaveResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.leaveRequests)
      .where(
        and(
          eq(schema.leaveRequests.companyId, companyId),
          eq(schema.leaveRequests.status, "pending")
        )
      );
    const pendingLeaveCount = pendingLeaveResult[0]?.count || 0;
    if (pendingLeaveCount > 0) {
      alerts.push({
        title: "Leave Requests",
        sub: `${pendingLeaveCount} pending approvals`,
        type: "orange",
        iconType: "Calendar"
      });
    }

    // 1c. Pending Job Requisitions
    const pendingRequisitionsResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.jobRequisitions)
      .where(
        and(
          eq(schema.jobRequisitions.companyId, companyId),
          eq(schema.jobRequisitions.status, "Pending Approval")
        )
      );
    const pendingReqCount = pendingRequisitionsResult[0]?.count || 0;
    if (pendingReqCount > 0) {
      alerts.push({
        title: "Job Requisitions",
        sub: `${pendingReqCount} awaiting review`,
        type: "orange",
        iconType: "Briefcase" // Using Briefcase or similar for jobs
      });
    }

    // 2. Recent Activity (Operations Log)
    // Fetch latest 5 audit logs
    const recentActivityRaw = await this.db
      .select()
      .from(schema.auditLogs)
      .where(eq(schema.auditLogs.companyId, companyId))
      .orderBy(sql`${schema.auditLogs.createdAt} DESC`)
      .limit(5);

    const recentActivity = recentActivityRaw.map(log => {
      // Very basic time ago logic
      const logDate = new Date(log.createdAt);
      const diffMs = today.getTime() - logDate.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHrs / 24);
      
      let tStr = "Just now";
      if (diffDays > 0) tStr = `${diffDays}d ago`;
      else if (diffHrs > 0) tStr = `${diffHrs}h ago`;

      return {
        ev: `${log.actorName} ${log.action} ${log.details}`.trim(),
        t: tStr,
        color: "bg-indigo-500" // Default color, could map based on action
      };
    });

    // Fallback if no logs
    if (recentActivity.length === 0) {
      recentActivity.push({ ev: "System initialized", t: "Just now", color: "bg-emerald-500" });
    }

    // 3. Social & Culture Events
    // Birthdays this month
    const currentMonth = today.toISOString().slice(5, 7); // 'MM'
    
    // SQLite doesn't have great native Date extraction without strftime, so we use string matching if format is YYYY-MM-DD
    const birthdaysResult = await this.db
      .select({ name: schema.employees.name, lastName: schema.employees.lastName })
      .from(schema.employees)
      .where(
        and(
          eq(schema.employees.companyId, companyId),
          like(schema.employees.dob, `%-${currentMonth}-%`)
        )
      );
    
    const birthdays = birthdaysResult.map(emp => `${emp.name} ${emp.lastName?.[0]}.`);

    // Anniversaries this month
    const anniversariesResult = await this.db
      .select({ name: schema.employees.name, lastName: schema.employees.lastName, hireDate: schema.employees.hireDate })
      .from(schema.employees)
      .where(
        and(
          eq(schema.employees.companyId, companyId),
          like(schema.employees.hireDate, `%-${currentMonth}-%`)
        )
      );
    
    const anniversaries = anniversariesResult
      .filter(emp => emp.hireDate && !emp.hireDate.startsWith(today.getFullYear().toString())) // Not hired this year
      .map(emp => `${emp.name} ${emp.lastName?.[0]}.`);


    return {
      totalHeadcount,
      newHires,
      attritionRate,
      openPositions,
      totalPayroll,
      deptData,
      diversityData,
      headcountTrend,
      alerts,
      recentActivity,
      events: {
        birthdays,
        anniversaries
      }
    };
  }
}
