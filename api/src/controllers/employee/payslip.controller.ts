import { Context } from 'hono';
import { eq, and, desc } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { AppEnv } from '../../types';
import * as schema from '../../db/schema';

// Self-service payslip history — an employee can only ever see their own runs.
export const getMyPayslips = async (c: Context<AppEnv>) => {
  try {
    const employeeId = c.get('employeeId');
    const companyId = c.get('companyId') as string;
    if (!employeeId) return c.json({ error: 'Unauthorized: No employee ID found' }, 401);

    const db = drizzle(c.env.DB, { schema });
    const records = await db
      .select({
        id: schema.payslips.id,
        runId: schema.payslips.runId,
        basicSalary: schema.payslips.basicSalary,
        allowances: schema.payslips.allowances,
        bonuses: schema.payslips.bonuses,
        grossPay: schema.payslips.grossPay,
        taxDeductions: schema.payslips.taxDeductions,
        pensionDeductions: schema.payslips.pensionDeductions,
        loanDeductions: schema.payslips.loanDeductions,
        otherDeductions: schema.payslips.otherDeductions,
        netPay: schema.payslips.netPay,
        createdAt: schema.payslips.createdAt,
        periodMonth: schema.payrollRuns.periodMonth,
        periodYear: schema.payrollRuns.periodYear,
        status: schema.payrollRuns.status,
        paidAt: schema.payrollRuns.paidAt,
      })
      .from(schema.payslips)
      .innerJoin(schema.payrollRuns, eq(schema.payslips.runId, schema.payrollRuns.id))
      // Only finalized runs are visible to the employee — pending/rejected
      // figures aren't final and shouldn't be delivered as a payslip yet.
      .where(and(eq(schema.payslips.employeeId, employeeId), eq(schema.payrollRuns.companyId, companyId), eq(schema.payrollRuns.status, 'paid')))
      .orderBy(desc(schema.payrollRuns.periodYear), desc(schema.payrollRuns.periodMonth));

    return c.json({ data: records });
  } catch (error: any) {
    console.error('Error fetching my payslips:', error);
    return c.json({ error: error.message }, 500);
  }
};
