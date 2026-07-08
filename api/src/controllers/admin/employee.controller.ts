import { Context } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../../db/schema';

export const getEmployees = async (c: Context) => {
  const db = drizzle(c.env.DB, { schema });
  const result = await db.select().from(schema.employees).all();
  return c.json(result);
};

export const createEmployee = async (c: Context) => {
  const db = drizzle(c.env.DB, { schema });
  const body = await c.req.json();
  const result = await db.insert(schema.employees).values(body).returning();
  return c.json(result[0], 201);
};
