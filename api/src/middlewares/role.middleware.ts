import { Context, Next } from 'hono';
import { AppEnv } from '../types';

// Gates a route to a fixed set of roles. Must run after authMiddleware, which
// is what actually populates `role` on the context from the verified JWT.
export const requireRole = (...allowedRoles: string[]) => {
  return async (c: Context<AppEnv>, next: Next) => {
    const role = c.get('role');

    if (!role || !allowedRoles.includes(role)) {
      return c.json({ error: 'Forbidden: insufficient permissions' }, 403);
    }

    await next();
  };
};
