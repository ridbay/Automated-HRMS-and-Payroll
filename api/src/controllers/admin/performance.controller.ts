import { Context } from 'hono';
import { eq, and, desc } from 'drizzle-orm';
import { assessments } from '../../db/schema';

export const getEmployeeAssessments = async (c: Context) => {
  try {
    const employeeId = c.req.param('id') as string;
    const companyId = c.get('companyId');
    const db = c.get('db');

    const records = await db
      .select()
      .from(assessments)
      .where(and(eq(assessments.employeeId, employeeId), eq(assessments.companyId, companyId)))
      .orderBy(desc(assessments.createdAt));

    return c.json(records);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const addEmployeeAssessment = async (c: Context) => {
  try {
    const employeeId = c.req.param('id') as string;
    const companyId = c.get('companyId');
    const db = c.get('db');
    const body = await c.req.json();

    const id = `ASSESS-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const newAssessment = await db.insert(assessments).values({
      id,
      companyId,
      employeeId,
      cycleName: body.cycleName || 'Mid-Year Review',
      managerRating: body.managerRating,
      managerComment: body.managerComment,
      status: 'completed',
      reviewedAt: new Date().toISOString(),
    }).returning();

    return c.json(newAssessment[0]);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};
