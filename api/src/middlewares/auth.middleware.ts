import { Context, Next } from 'hono';
import { verify } from 'hono/jwt';
import { AppEnv } from '../types';

export const authMiddleware = async (c: Context<AppEnv>, next: Next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: Missing or invalid token' }, 401);
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = c.env.JWT_SECRET;

  // Refuse to operate without a real secret. Fail loudly rather than silently
  // falling back to a predictable key that any attacker could use.
  if (!jwtSecret) {
    console.error('[auth] JWT_SECRET env var is not set — refusing request');
    return c.json({ error: 'Server misconfiguration: authentication unavailable' }, 503);
  }

  try {
    const payload = await verify(token, jwtSecret, 'HS256');

    c.set('employeeId', payload.sub as string);
    c.set('companyId', payload.companyId as string);
    c.set('role', payload.role as string);

    await next();
  } catch {
    return c.json({ error: 'Unauthorized: Invalid or expired token' }, 401);
  }
};
