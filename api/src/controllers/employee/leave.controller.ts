import { Context } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../../db/schema';

export const getLeaveRequests = async (c: Context) => {
  const db = drizzle(c.env.DB, { schema });
  const result = await db.select().from(schema.leaveRequests).all();
  return c.json(result);
};
