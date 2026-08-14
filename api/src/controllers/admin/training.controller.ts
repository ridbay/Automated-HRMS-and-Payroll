import { Context } from 'hono';
import { eq, and, desc } from 'drizzle-orm';
import { employeeTrainings } from '../../db/schema';

export const getEmployeeTrainings = async (c: Context) => {
  try {
    const employeeId = c.req.param('id') as string;
    const companyId = c.get('companyId');
    const db = c.get('db');

    const records = await db
      .select()
      .from(employeeTrainings)
      .where(and(eq(employeeTrainings.employeeId, employeeId), eq(employeeTrainings.companyId, companyId)))
      .orderBy(desc(employeeTrainings.createdAt));

    return c.json(records);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const addEmployeeTraining = async (c: Context) => {
  try {
    const employeeId = c.req.param('id') as string;
    const companyId = c.get('companyId');
    const db = c.get('db');
    const body = await c.req.json();

    const id = `TRN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const newTraining = await db.insert(employeeTrainings).values({
      id,
      companyId,
      employeeId,
      courseName: body.courseName,
      provider: body.provider,
      status: body.status || 'in_progress',
      date: body.date || new Date().toISOString().split('T')[0],
    }).returning();

    return c.json(newTraining[0]);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};
