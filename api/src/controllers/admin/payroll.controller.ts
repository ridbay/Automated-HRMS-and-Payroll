import { Context } from 'hono';
import { eq, and, desc } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { AppEnv } from '../../types';
import { PayrollService } from '../../services/payroll.service';
import { NotificationService } from '../../services/controlCenter.service';
import * as schema from '../../db/schema';

const currentPeriod = (c: Context) => {
  const now = new Date();
  const month = parseInt(c.req.query('month') || '') || now.getMonth() + 1;
  const year = parseInt(c.req.query('year') || '') || now.getFullYear();
  return { month, year };
};

// ---------------- Settings ----------------
export const getPayrollSettings = async (c: Context<AppEnv>) => {
  try {
    const service = new PayrollService(c.env.DB);
    return c.json({ data: await service.getSettings((c.get('companyId') as string)) });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const updatePayrollSettings = async (c: Context<AppEnv>) => {
  try {
    const service = new PayrollService(c.env.DB);
    const payload = await c.req.json();
    return c.json({ data: await service.updateSettings((c.get('companyId') as string), payload) });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

// ---------------- Tax brackets ----------------
export const getTaxBrackets = async (c: Context<AppEnv>) => {
  try {
    const service = new PayrollService(c.env.DB);
    return c.json({ data: await service.getTaxBrackets((c.get('companyId') as string)) });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const updateTaxBrackets = async (c: Context<AppEnv>) => {
  try {
    const service = new PayrollService(c.env.DB);
    const { brackets } = await c.req.json();
    return c.json({ data: await service.replaceTaxBrackets((c.get('companyId') as string), brackets) });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

// ---------------- Salary components ----------------
export const getSalaryComponents = async (c: Context<AppEnv>) => {
  try {
    const service = new PayrollService(c.env.DB);
    return c.json({ data: await service.getSalaryComponents((c.get('companyId') as string)) });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const createSalaryComponent = async (c: Context<AppEnv>) => {
  try {
    const service = new PayrollService(c.env.DB);
    const payload = await c.req.json();
    return c.json({ data: await service.createSalaryComponent((c.get('companyId') as string), payload) }, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const updateSalaryComponent = async (c: Context<AppEnv>) => {
  try {
    const service = new PayrollService(c.env.DB);
    const payload = await c.req.json();
    const updated = await service.updateSalaryComponent((c.get('companyId') as string), (c.req.param('id') as string), payload);
    if (!updated) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: updated });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const deleteSalaryComponent = async (c: Context<AppEnv>) => {
  try {
    const service = new PayrollService(c.env.DB);
    const deleted = await service.deleteSalaryComponent((c.get('companyId') as string), (c.req.param('id') as string));
    if (!deleted) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: deleted });
  } catch (error: any) {
    return c.json({ error: error.message }, error.message?.includes('cannot be deleted') ? 400 : 500);
  }
};

// ---------------- Pay grades ----------------
export const getPayGrades = async (c: Context<AppEnv>) => {
  try {
    const service = new PayrollService(c.env.DB);
    return c.json({ data: await service.getPayGrades((c.get('companyId') as string)) });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const createPayGrade = async (c: Context<AppEnv>) => {
  try {
    const service = new PayrollService(c.env.DB);
    const payload = await c.req.json();
    return c.json({ data: await service.createPayGrade((c.get('companyId') as string), payload) }, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const updatePayGrade = async (c: Context<AppEnv>) => {
  try {
    const service = new PayrollService(c.env.DB);
    const payload = await c.req.json();
    const updated = await service.updatePayGrade((c.get('companyId') as string), (c.req.param('id') as string), payload);
    if (!updated) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: updated });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const deletePayGrade = async (c: Context<AppEnv>) => {
  try {
    const service = new PayrollService(c.env.DB);
    const deleted = await service.deletePayGrade((c.get('companyId') as string), (c.req.param('id') as string));
    if (!deleted) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: deleted });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

// ---------------- Loans ----------------
export const getLoans = async (c: Context<AppEnv>) => {
  try {
    const service = new PayrollService(c.env.DB);
    return c.json({ data: await service.getLoans((c.get('companyId') as string)) });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const createLoan = async (c: Context<AppEnv>) => {
  try {
    const service = new PayrollService(c.env.DB);
    const payload = await c.req.json();
    if (!payload.employeeId || !payload.principal) {
      return c.json({ error: 'employeeId and principal are required' }, 400);
    }
    return c.json({ data: await service.createLoan((c.get('companyId') as string), payload) }, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const updateLoan = async (c: Context<AppEnv>) => {
  try {
    const service = new PayrollService(c.env.DB);
    const payload = await c.req.json();
    const updated = await service.updateLoan((c.get('companyId') as string), (c.req.param('id') as string), payload);
    if (!updated) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: updated });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const deleteLoan = async (c: Context<AppEnv>) => {
  try {
    const service = new PayrollService(c.env.DB);
    const deleted = await service.deleteLoan((c.get('companyId') as string), (c.req.param('id') as string));
    if (!deleted) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: deleted });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const getLoanRepayments = async (c: Context<AppEnv>) => {
  try {
    const service = new PayrollService(c.env.DB);
    return c.json({ data: await service.getLoanRepayments((c.get('companyId') as string), (c.req.param('id') as string)) });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

// ---------------- Preview ----------------
export const previewPayroll = async (c: Context<AppEnv>) => {
  try {
    const { month, year } = currentPeriod(c);
    const service = new PayrollService(c.env.DB);
    const preview = await service.previewRun((c.get('companyId') as string), month, year);
    return c.json({ data: preview }, 200);
  } catch (error: any) {
    console.error('Error previewing payroll:', error);
    return c.json({ error: error.message || 'Internal Server Error' }, 500);
  }
};

// Recompute a preview with per-employee manual overrides (bonuses, ad-hoc
// deductions) from the Earnings/Deductions wizard steps, without persisting.
export const recomputePreview = async (c: Context<AppEnv>) => {
  try {
    const body = await c.req.json();
    const service = new PayrollService(c.env.DB);
    const preview = await service.previewRun((c.get('companyId') as string), body.periodMonth, body.periodYear, body.overrides || {});
    return c.json({ data: preview }, 200);
  } catch (error: any) {
    console.error('Error recomputing payroll preview:', error);
    return c.json({ error: error.message || 'Internal Server Error' }, 500);
  }
};

// ---------------- Run lifecycle ----------------
export const submitPayrollRun = async (c: Context<AppEnv>) => {
  try {
    const payload = await c.req.json();
    if (!payload.periodMonth || !payload.periodYear) {
      return c.json({ error: 'periodMonth and periodYear are required' }, 400);
    }
    const service = new PayrollService(c.env.DB);
    const run = await service.submitRun((c.get('companyId') as string), c.get('employeeId'), payload);
    return c.json({ data: run }, 201);
  } catch (error: any) {
    console.error('Error submitting payroll run:', error);
    return c.json({ error: error.message || 'Internal Server Error' }, 500);
  }
};

export const getPayrollRuns = async (c: Context<AppEnv>) => {
  try {
    const service = new PayrollService(c.env.DB);
    const status = c.req.query('status');
    return c.json({ data: await service.getRuns((c.get('companyId') as string), status) });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const getPayrollRun = async (c: Context<AppEnv>) => {
  try {
    const service = new PayrollService(c.env.DB);
    const run = await service.getRun((c.get('companyId') as string), (c.req.param('id') as string));
    if (!run) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: run });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const approvePayrollRun = async (c: Context<AppEnv>) => {
  try {
    const service = new PayrollService(c.env.DB);
    const run = await service.approveRun((c.get('companyId') as string), (c.req.param('id') as string), c.get('employeeId'));
    if (!run) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: run });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
};

export const rejectPayrollRun = async (c: Context<AppEnv>) => {
  try {
    const service = new PayrollService(c.env.DB);
    const { reason } = await c.req.json().catch(() => ({ reason: undefined }));
    const run = await service.rejectRun((c.get('companyId') as string), (c.req.param('id') as string), reason);
    if (!run) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: run });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
};

export const markPayrollRunPaid = async (c: Context<AppEnv>) => {
  try {
    const companyId = c.get('companyId') as string;
    const service = new PayrollService(c.env.DB);
    const run = await service.markRunPaid(companyId, (c.req.param('id') as string));
    if (!run) return c.json({ error: 'Not found' }, 404);

    const period = new Date(run.periodYear, run.periodMonth - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
    await new NotificationService(c.env.DB).notify(
      companyId,
      'payroll.paid',
      `💰 Payroll for *${period}* has been paid — ${run.employeeCount} employees, net ₦${run.totalNet.toLocaleString()}`
    );

    return c.json({ data: run });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
};

export const getBankFile = async (c: Context<AppEnv>) => {
  try {
    const service = new PayrollService(c.env.DB);
    const file = await service.getBankFile((c.get('companyId') as string), (c.req.param('id') as string));
    if (!file) return c.json({ error: 'Not found' }, 404);
    c.header('Content-Type', 'text/csv');
    c.header('Content-Disposition', `attachment; filename="${file.filename}"`);
    return c.body(file.content);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

const VALID_REMITTANCE_TYPES = ['paye', 'pension', 'nhf', 'nsitf', 'itf'];

export const getRemittanceSchedule = async (c: Context<AppEnv>) => {
  try {
    const type = c.req.param('type') as string;
    if (!VALID_REMITTANCE_TYPES.includes(type)) {
      return c.json({ error: `type must be one of ${VALID_REMITTANCE_TYPES.join(', ')}` }, 400);
    }
    const service = new PayrollService(c.env.DB);
    const file = await service.getRemittanceSchedule((c.get('companyId') as string), (c.req.param('id') as string), type as any);
    if (!file) return c.json({ error: 'Not found' }, 404);
    c.header('Content-Type', 'text/csv');
    c.header('Content-Disposition', `attachment; filename="${file.filename}"`);
    return c.body(file.content);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

// ---------------- Compliance ----------------
export const getComplianceTasks = async (c: Context<AppEnv>) => {
  try {
    const service = new PayrollService(c.env.DB);
    return c.json({ data: await service.getComplianceTasks((c.get('companyId') as string)) });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const completeComplianceTask = async (c: Context<AppEnv>) => {
  try {
    const service = new PayrollService(c.env.DB);
    const { reference } = await c.req.json().catch(() => ({ reference: undefined }));
    const task = await service.completeComplianceTask((c.get('companyId') as string), (c.req.param('id') as string), c.get('employeeId'), reference);
    if (!task) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: task });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

// ---------------- Dashboard ----------------
export const getPayrollDashboard = async (c: Context<AppEnv>) => {
  try {
    const { month, year } = currentPeriod(c);
    const service = new PayrollService(c.env.DB);
    return c.json({ data: await service.getDashboard((c.get('companyId') as string), month, year) });
  } catch (error: any) {
    console.error('Error building payroll dashboard:', error);
    return c.json({ error: error.message || 'Internal Server Error' }, 500);
  }
};

// ---------------- Employee payslip history (admin lookup) ----------------
export const getEmployeePayslips = async (c: Context<AppEnv>) => {
  try {
    const employeeId = (c.req.param('id') as string) as string;
    const companyId = (c.get('companyId') as string) as string;
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
      })
      .from(schema.payslips)
      .innerJoin(schema.payrollRuns, eq(schema.payslips.runId, schema.payrollRuns.id))
      .where(and(eq(schema.payslips.employeeId, employeeId), eq(schema.payrollRuns.companyId, companyId)))
      .orderBy(desc(schema.payrollRuns.periodYear), desc(schema.payrollRuns.periodMonth));

    return c.json({ data: records });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};
