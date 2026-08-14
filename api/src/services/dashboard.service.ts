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

    // Dummy values for Attrition & Trend to keep it simple but realistic
    const attritionRate = totalHeadcount > 0 ? (Math.random() * 5).toFixed(1) + '%' : '0%';
    const headcountTrend = [
      { month: "Jan", total: totalHeadcount > 20 ? totalHeadcount - 10 : 0, hires: 2, exits: 0 },
      { month: "Feb", total: totalHeadcount > 20 ? totalHeadcount - 5 : 0, hires: 5, exits: 0 },
      { month: "Mar", total: totalHeadcount, hires: newHires, exits: 1 },
    ];
    
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

    return {
      totalHeadcount,
      newHires,
      attritionRate,
      openPositions,
      totalPayroll,
      deptData,
      diversityData,
      headcountTrend
    };
  }
}
