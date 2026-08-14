import { Context } from 'hono';
import { eq, and } from 'drizzle-orm';
import { employeeBenefits } from '../../db/schema';

export const getEmployeeBenefits = async (c: Context) => {
  try {
    const employeeId = c.req.param('id') as string;
    const companyId = c.get('companyId');
    const db = c.get('db');

    const record = await db
      .select()
      .from(employeeBenefits)
      .where(and(eq(employeeBenefits.employeeId, employeeId), eq(employeeBenefits.companyId, companyId)))
      .get();

    return c.json(record || null);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const updateEmployeeBenefits = async (c: Context) => {
  try {
    const employeeId = c.req.param('id') as string;
    const companyId = c.get('companyId');
    const db = c.get('db');
    const body = await c.req.json();

    const existing = await db
      .select()
      .from(employeeBenefits)
      .where(and(eq(employeeBenefits.employeeId, employeeId), eq(employeeBenefits.companyId, companyId)))
      .get();

    if (existing) {
      const updated = await db
        .update(employeeBenefits)
        .set({ ...body })
        .where(eq(employeeBenefits.id, existing.id))
        .returning();
      return c.json(updated[0]);
    } else {
      const id = `BEN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      const inserted = await db
        .insert(employeeBenefits)
        .values({
          id,
          companyId,
          employeeId,
          ...body,
        })
        .returning();
      return c.json(inserted[0]);
    }
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};
