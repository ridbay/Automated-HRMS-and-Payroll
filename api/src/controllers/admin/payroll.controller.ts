import { Context } from 'hono';
import { PayrollService } from '../../services/payroll.service';

export const previewPayroll = async (c: Context) => {
  const companyId = c.get('companyId');
  const month = parseInt(c.req.query('month') || new Date().getMonth().toString()) + 1;
  const year = parseInt(c.req.query('year') || new Date().getFullYear().toString());

  const db = c.get('db');
  const payrollService = new PayrollService(db);

  try {
    const preview = await payrollService.previewRun(companyId, month, year);
    return c.json({ data: preview }, 200);
  } catch (error: any) {
    console.error('Error previewing payroll:', error);
    return c.json({ error: error.message || 'Internal Server Error' }, 500);
  }
};

export const lockPayroll = async (c: Context) => {
  const companyId = c.get('companyId');
  const payload = await c.req.json();

  const db = c.get('db');
  const payrollService = new PayrollService(db);

  try {
    const result = await payrollService.lockRun(companyId, payload);
    return c.json({ data: result }, 201);
  } catch (error: any) {
    console.error('Error locking payroll:', error);
    return c.json({ error: error.message || 'Internal Server Error' }, 500);
  }
};

import { eq, and, desc } from 'drizzle-orm';
import { payslips, payrollRuns } from '../../db/schema';

export const getEmployeePayslips = async (c: Context) => {
  try {
    const employeeId = c.req.param('id') as string;
    const companyId = c.get('companyId');
    const db = c.get('db');

    const records = await db
      .select({
        id: payslips.id,
        runId: payslips.runId,
        basicSalary: payslips.basicSalary,
        allowances: payslips.allowances,
        grossPay: payslips.grossPay,
        taxDeductions: payslips.taxDeductions,
        pensionDeductions: payslips.pensionDeductions,
        netPay: payslips.netPay,
        createdAt: payslips.createdAt,
        periodMonth: payrollRuns.periodMonth,
        periodYear: payrollRuns.periodYear,
        status: payrollRuns.status
      })
      .from(payslips)
      .innerJoin(payrollRuns, eq(payslips.runId, payrollRuns.id))
      .where(and(eq(payslips.employeeId, employeeId), eq(payrollRuns.companyId, companyId)))
      .orderBy(desc(payrollRuns.periodYear), desc(payrollRuns.periodMonth));

    return c.json(records);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};
