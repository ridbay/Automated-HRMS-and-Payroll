import { Context } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as schema from '../../db/schema';
import { RequisitionService, RequisitionActor } from '../../services/requisition.service';
import { NotificationService } from '../../services/controlCenter.service';
import { AppEnv } from '../../types';

const VALID_MANUAL_STATUSES = ['Open', 'On Hold', 'Filled', 'Cancelled'];

// Resolves the acting employee's display name/avatar so the requisition
// keeps a readable audit trail (who requested it, who reviewed it) instead
// of just an opaque id.
const getActor = async (c: Context<AppEnv>): Promise<RequisitionActor> => {
  const employeeId = c.get('employeeId') as string | undefined;
  const role = c.get('role') as string | undefined;

  if (!employeeId) {
    return { id: 'system', name: 'System', avatar: null, role };
  }

  const db = drizzle(c.env.DB, { schema });
  const employee = await db.query.employees.findFirst({
    where: eq(schema.employees.id, employeeId),
  });

  const name = employee ? [employee.name, employee.lastName].filter(Boolean).join(' ') : 'Unknown';
  return { id: employeeId, name, avatar: employee?.avatar || null, role };
};

export const getAllRequisitions = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId') as string;
  const service = new RequisitionService(c.env.DB);
  const rows = await service.getAllByCompany(companyId);
  return c.json(rows);
};

export const getPendingRequisitions = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId') as string;
  const service = new RequisitionService(c.env.DB);
  const rows = await service.getPendingByCompany(companyId);
  return c.json(rows);
};

export const getMyRequisitions = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId') as string;
  const employeeId = c.get('employeeId') as string | undefined;
  if (!employeeId) return c.json([]);

  const service = new RequisitionService(c.env.DB);
  const rows = await service.getMineByCompany(companyId, employeeId);
  return c.json(rows);
};

export const createRequisition = async (c: Context<AppEnv>) => {
  try {
    const companyId = c.get('companyId') as string;
    const payload = await c.req.json();

    if (!payload.title || !payload.department || !payload.location) {
      return c.json({ error: 'title, department and location are required' }, 400);
    }

    const requester = await getActor(c);
    const service = new RequisitionService(c.env.DB);
    const created = await service.create(companyId, requester, payload);
    return c.json(created, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
};

export const approveRequisition = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId') as string;
  const id = c.req.param('id') as string;
  const reviewer = await getActor(c);

  const service = new RequisitionService(c.env.DB);
  const updated = await service.approve(companyId, id, reviewer);
  if (!updated) return c.json({ error: 'Requisition not found' }, 404);

  // Awaited (not fire-and-forget) because Workers doesn't guarantee an
  // un-awaited promise runs to completion after the response is sent unless
  // routed through executionCtx.waitUntil — notify() itself never throws
  // (it catches its own delivery errors), so this can't fail the approval.
  await new NotificationService(c.env.DB).notify(
    companyId,
    'requisition.approved',
    `🎉 New role approved: *${updated.title}* (${updated.department})`
  );

  return c.json(updated);
};

export const rejectRequisition = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId') as string;
  const id = c.req.param('id') as string;
  const payload = await c.req.json().catch(() => ({} as any));
  const reviewer = await getActor(c);

  const service = new RequisitionService(c.env.DB);
  const updated = await service.reject(companyId, id, reviewer, payload.reason);
  if (!updated) return c.json({ error: 'Requisition not found' }, 404);
  return c.json(updated);
};

export const updateRequisitionStatus = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId') as string;
  const id = c.req.param('id') as string;
  const { status } = await c.req.json();

  if (!VALID_MANUAL_STATUSES.includes(status)) {
    return c.json({ error: `status must be one of ${VALID_MANUAL_STATUSES.join(', ')}` }, 400);
  }

  const service = new RequisitionService(c.env.DB);
  const updated = await service.updateStatus(companyId, id, status);
  if (!updated) return c.json({ error: 'Requisition not found' }, 404);
  return c.json(updated);
};

export const deleteRequisition = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId') as string;
  const id = c.req.param('id') as string;

  const service = new RequisitionService(c.env.DB);
  const deleted = await service.remove(companyId, id);
  if (!deleted) return c.json({ error: 'Requisition not found' }, 404);
  return c.json({ success: true });
};
