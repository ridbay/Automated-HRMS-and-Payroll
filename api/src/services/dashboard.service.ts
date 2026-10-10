import { drizzle } from 'drizzle-orm/d1';
import { eq, sql, and, gte, like } from 'drizzle-orm';
import * as schema from '../db/schema';

export class DashboardService {
  private db;

  constructor(dbBinding: any) {
    this.db = drizzle(dbBinding, { schema });
  }

  async getDashboardStats(companyId: string) {
    const today = new Date();
    const toDateStr = (d: Date) => d.toISOString().slice(0, 10);
    const currentYearMonth = today.toISOString().slice(0, 7); // 'YYYY-MM'
    const currentMonth = today.toISOString().slice(5, 7); // 'MM'
    const todayStr = today.toISOString().slice(0, 10);
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const thirtyDaysStr = thirtyDaysFromNow.toISOString().slice(0, 10);

    // Run all independent queries concurrently via Promise.all
    const [
      headcountResult,
      newHiresResult,
      openPositionsResult,
      deptResult,
      diversityResult,
      allEmployeeDates,
      completedExits,
      payrollResult,
      probationResult,
      pendingLeaveResult,
      pendingRequisitionsResult,
      recentActivityRaw,
      birthdaysResult,
      anniversariesResult,
    ] = await Promise.all([
      // 1. Total Headcount (Active + Onboarding)
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.employees)
        .where(
          and(
            eq(schema.employees.companyId, companyId),
            sql`${schema.employees.status} IN ('active', 'onboarding')`
          )
        ),

      // 2. New Hires this month
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.employees)
        .where(
          and(
            eq(schema.employees.companyId, companyId),
            like(schema.employees.hireDate, `${currentYearMonth}%`)
          )
        ),

      // 3. Open Positions
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.jobRequisitions)
        .where(
          and(
            eq(schema.jobRequisitions.companyId, companyId),
            sql`${schema.jobRequisitions.status} IN ('Sourcing', 'Interviewing', 'Open')`
          )
        ),

      // 4. Department Mix
      this.db
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
        .groupBy(schema.employees.department),

      // 5. Diversity (Gender)
      this.db
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
        .groupBy(schema.employees.gender),

      // 6. Hire dates for attrition/trend
      this.db
        .select({ hireDate: schema.employees.hireDate })
        .from(schema.employees)
        .where(eq(schema.employees.companyId, companyId)),

      // 7. Completed exits for attrition/trend
      this.db
        .select({ completedAt: schema.transitions.completedAt })
        .from(schema.transitions)
        .where(
          and(
            eq(schema.transitions.companyId, companyId),
            eq(schema.transitions.type, 'Offboarding'),
            eq(schema.transitions.status, 'Completed')
          )
        ),

      // 8. Total payroll estimate
      this.db
        .select({ total: sql<number>`sum(${schema.employees.salary})` })
        .from(schema.employees)
        .where(
          and(
            eq(schema.employees.companyId, companyId),
            sql`${schema.employees.status} = 'active'`
          )
        ),

      // 9. Probation Ending (next 30 days)
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.employees)
        .where(
          and(
            eq(schema.employees.companyId, companyId),
            gte(schema.employees.probationEnd, todayStr),
            sql`${schema.employees.probationEnd} <= ${thirtyDaysStr}`
          )
        ),

      // 10. Pending Leave Requests
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.leaveRequests)
        .where(
          and(
            eq(schema.leaveRequests.companyId, companyId),
            eq(schema.leaveRequests.status, "pending")
          )
        ),

      // 11. Pending Job Requisitions
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.jobRequisitions)
        .where(
          and(
            eq(schema.jobRequisitions.companyId, companyId),
            eq(schema.jobRequisitions.status, "Pending Approval")
          )
        ),

      // 12. Recent Activity (Operations Log)
      this.db
        .select()
        .from(schema.auditLogs)
        .where(eq(schema.auditLogs.companyId, companyId))
        .orderBy(sql`${schema.auditLogs.createdAt} DESC`)
        .limit(5),

      // 13. Birthdays this month
      this.db
        .select({ name: schema.employees.name, lastName: schema.employees.lastName })
        .from(schema.employees)
        .where(
          and(
            eq(schema.employees.companyId, companyId),
            like(schema.employees.dob, `%-${currentMonth}-%`)
          )
        ),

      // 14. Anniversaries this month
      this.db
        .select({ name: schema.employees.name, lastName: schema.employees.lastName, hireDate: schema.employees.hireDate })
        .from(schema.employees)
        .where(
          and(
            eq(schema.employees.companyId, companyId),
            like(schema.employees.hireDate, `%-${currentMonth}-%`)
          )
        ),
    ]);

    const totalHeadcount = headcountResult[0]?.count || 0;
    const newHires = newHiresResult[0]?.count || 0;
    const openPositions = openPositionsResult[0]?.count || 0;

    // Map colors
    const colors = ["#6366f1", "#10b981", "#f59e0b", "#8b5cf6", "#3b82f6", "#ec4899", "#14b8a6"];
    const deptData = deptResult.map((d, i) => ({
      name: d.name || 'Unassigned',
      value: d.value,
      fill: colors[i % colors.length]
    }));

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

    const totalPayroll = payrollResult[0]?.total || 0;

    // --- Dynamic Data for Alerts, Logs, Events ---
    const alerts = [];
    
    const probationCount = probationResult[0]?.count || 0;
    if (probationCount > 0) {
      alerts.push({
        title: "Probation Ending",
        sub: `${probationCount} Employees (Next 30 days)`,
        type: "red",
        iconType: "UserCheck"
      });
    }

    const pendingLeaveCount = pendingLeaveResult[0]?.count || 0;
    if (pendingLeaveCount > 0) {
      alerts.push({
        title: "Leave Requests",
        sub: `${pendingLeaveCount} pending approvals`,
        type: "orange",
        iconType: "Calendar"
      });
    }

    const pendingReqCount = pendingRequisitionsResult[0]?.count || 0;
    if (pendingReqCount > 0) {
      alerts.push({
        title: "Job Requisitions",
        sub: `${pendingReqCount} awaiting review`,
        type: "orange",
        iconType: "Briefcase"
      });
    }

    const recentActivity = recentActivityRaw.map(log => {
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
        color: "bg-indigo-500"
      };
    });

    if (recentActivity.length === 0) {
      recentActivity.push({ ev: "System initialized", t: "Just now", color: "bg-emerald-500" });
    }

    const birthdays = birthdaysResult.map(emp => `${emp.name} ${emp.lastName?.[0]}.`);

    const anniversaries = anniversariesResult
      .filter(emp => emp.hireDate && !emp.hireDate.startsWith(today.getFullYear().toString()))
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
