import { Context } from 'hono';
import { AppEnv } from '../../types';
import { drizzle } from 'drizzle-orm/d1';
import { goals } from '../../models/goal.model';
import { eq, and, desc } from 'drizzle-orm';

export const getMyGoals = async (c: Context<AppEnv>) => {
  const employeeId = c.get('employeeId')!;
  const companyId = c.get('companyId');
  const db = drizzle(c.env.DB);

  const rows = await db
    .select()
    .from(goals)
    .where(and(eq(goals.employeeId, employeeId), eq(goals.companyId, companyId)))
    .orderBy(desc(goals.createdAt));

  // Parse stored JSON key results
  const result = rows.map((g) => ({
    ...g,
    keyResults: g.keyResults ? JSON.parse(g.keyResults) : [],
  }));

  return c.json(result);
};

export const createGoal = async (c: Context<AppEnv>) => {
  const employeeId = c.get('employeeId')!;
  const companyId = c.get('companyId');
  const body = await c.req.json();
  const db = drizzle(c.env.DB);

  const id = `GOAL-${crypto.randomUUID().split('-')[0].toUpperCase()}`;

  await db.insert(goals).values({
    id,
    companyId,
    employeeId,
    title: body.title,
    description: body.description || null,
    priority: body.priority || 'medium',
    status: body.status || 'on_track',
    progress: body.progress ?? 0,
    dueDate: body.dueDate || null,
    keyResults: body.keyResults ? JSON.stringify(body.keyResults) : null,
  });

  return c.json({ id, message: 'Goal created' }, 201);
};

export const updateGoalProgress = async (c: Context<AppEnv>) => {
  const employeeId = c.get('employeeId')!;
  const companyId = c.get('companyId');
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'Goal id is required' }, 400);

  const { progress, status } = await c.req.json();
  const db = drizzle(c.env.DB);

  await db
    .update(goals)
    .set({ progress, status, updatedAt: new Date().toISOString() })
    .where(and(eq(goals.id, id), eq(goals.employeeId, employeeId), eq(goals.companyId, companyId)));

  return c.json({ message: 'Goal updated' });
};

