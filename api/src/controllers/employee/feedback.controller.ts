import { Context } from 'hono';
import { AppEnv } from '../../types';
import { drizzle } from 'drizzle-orm/d1';
import { feedbacks } from '../../models/feedback.model';
import { eq, desc } from 'drizzle-orm';

export const sendShoutout = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.get('employeeId');
  const { toEmployeeName, type, message } = await c.req.json();

  if (!toEmployeeName || !type || !message) {
    return c.json({ error: 'recipient, type and message are required' }, 400);
  }

  const db = drizzle(c.env.DB);
  const id = `FB-${crypto.randomUUID().split('-')[0].toUpperCase()}`;

  await db.insert(feedbacks).values({
    id,
    companyId,
    fromEmployeeId: employeeId!,
    toEmployeeName,
    type,
    message,
  });

  return c.json({ id, message: 'Shoutout sent!' }, 201);
};

export const getShoutouts = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const db = drizzle(c.env.DB);

  const results = await db
    .select()
    .from(feedbacks)
    .where(eq(feedbacks.companyId, companyId))
    .orderBy(desc(feedbacks.createdAt))
    .limit(50);

  return c.json(results);
};
