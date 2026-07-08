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
