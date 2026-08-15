import { Context } from 'hono';
import { ReportsService } from '../../services/reports.service';
import { AppEnv } from '../../types';

export const getOverview = async (c: Context<AppEnv>) => {
  try {
    const companyId = c.get('companyId') as string;
    const service = new ReportsService(c.env.DB);
    return c.json({ data: await service.getOverview(companyId) });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const getWorkforceReport = async (c: Context<AppEnv>) => {
  try {
    const companyId = c.get('companyId') as string;
    const service = new ReportsService(c.env.DB);
    return c.json({ data: await service.getWorkforceReport(companyId) });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const getRecruitmentReport = async (c: Context<AppEnv>) => {
  try {
    const companyId = c.get('companyId') as string;
    const service = new ReportsService(c.env.DB);
    return c.json({ data: await service.getRecruitmentReport(companyId) });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const getPayrollReport = async (c: Context<AppEnv>) => {
  try {
    const companyId = c.get('companyId') as string;
    const service = new ReportsService(c.env.DB);
    return c.json({ data: await service.getPayrollReport(companyId) });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

// Manager-scoped: the caller's own direct reports only.
export const getTeamReport = async (c: Context<AppEnv>) => {
  try {
    const companyId = c.get('companyId') as string;
    const managerId = c.get('employeeId') as string;
    if (!managerId) return c.json({ error: 'Unauthorized' }, 401);
    const service = new ReportsService(c.env.DB);
    return c.json({ data: await service.getTeamReport(companyId, managerId) });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

const EXPORT_TYPES = new Set(['employees', 'requisitions', 'leave', 'payroll']);

export const exportReport = async (c: Context<AppEnv>) => {
  try {
    const companyId = c.get('companyId') as string;
    const role = c.get('role') as string | undefined;
    const type = c.req.query('type') || '';

    if (!EXPORT_TYPES.has(type)) {
      return c.json({ error: `Invalid export type. Expected one of: ${[...EXPORT_TYPES].join(', ')}` }, 400);
    }
    // Payroll staff without HR/Super Admin access can only export payroll data.
    if (role === 'PAYROLL_OFFICER' && type !== 'payroll') {
      return c.json({ error: 'Forbidden: insufficient permissions' }, 403);
    }

    const month = c.req.query('month') ? parseInt(c.req.query('month')!, 10) : undefined;
    const year = c.req.query('year') ? parseInt(c.req.query('year')!, 10) : undefined;

    const service = new ReportsService(c.env.DB);
    const file = await service.exportCsv(companyId, type, { month, year });
    if (!file) return c.json({ error: 'No data found to export for the given parameters' }, 404);

    c.header('Content-Type', 'text/csv');
    c.header('Content-Disposition', `attachment; filename="${file.filename}"`);
    return c.body(file.content);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};
