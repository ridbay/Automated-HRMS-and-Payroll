import { Context } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as schema from '../../db/schema';
import { TransitionService, TransitionActor } from '../../services/transition.service';
import { AppEnv } from '../../types';

// Resolves the acting employee's display name so each journey keeps a
// readable audit trail of who started it, mirroring requisition.controller.
const getActor = async (c: Context<AppEnv>): Promise<TransitionActor> => {
  const employeeId = c.get('employeeId') as string | undefined;
  if (!employeeId) return { id: 'system', name: 'System' };

  const db = drizzle(c.env.DB, { schema });
  const employee = await db.query.employees.findFirst({ where: eq(schema.employees.id, employeeId) });
  const name = employee ? [employee.name, employee.lastName].filter(Boolean).join(' ') : 'Unknown';
  return { id: employeeId, name };
};

export const getTransitions = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId') as string;
  const type = c.req.query('type');
  const service = new TransitionService(c.env.DB);
  const rows = await service.getAllByCompany(companyId, type);
  return c.json(rows);
};

export const getTransition = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId') as string;
  const id = c.req.param('id') as string;
  const service = new TransitionService(c.env.DB);
  const row = await service.getById(companyId, id);
  if (!row) return c.json({ error: 'Transition not found' }, 404);
  return c.json(row);
};

export const createTransition = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId') as string;
  const payload = await c.req.json();

  if (!payload.employeeId) return c.json({ error: 'employeeId is required' }, 400);

  try {
    const actor = await getActor(c);
    const service = new TransitionService(c.env.DB);
    const created = await service.create(companyId, actor, payload);
    return c.json(created, 201);
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to start transition' }, 400);
  }
};

export const addTransitionTask = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId') as string;
  const id = c.req.param('id') as string;
  const payload = await c.req.json();
  if (!payload.title) return c.json({ error: 'title is required' }, 400);

  const service = new TransitionService(c.env.DB);
  const updated = await service.addTask(companyId, id, payload);
  if (!updated) return c.json({ error: 'Transition not found' }, 404);
  return c.json(updated, 201);
};

export const updateTransitionTaskStatus = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId') as string;
  const id = c.req.param('id') as string;
  const taskId = c.req.param('taskId') as string;
  const { status } = await c.req.json();

  if (status !== 'pending' && status !== 'completed') {
    return c.json({ error: "status must be 'pending' or 'completed'" }, 400);
  }

  const service = new TransitionService(c.env.DB);
  const updated = await service.setTaskStatus(companyId, id, taskId, status);
  if (!updated) return c.json({ error: 'Transition or task not found' }, 404);
  return c.json(updated);
};

export const cancelTransition = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId') as string;
  const id = c.req.param('id') as string;

  const service = new TransitionService(c.env.DB);
  const updated = await service.cancel(companyId, id);
  if (!updated) return c.json({ error: 'Transition not found' }, 404);
  return c.json(updated);
};
