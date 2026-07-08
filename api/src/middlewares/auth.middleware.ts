import { Context, Next } from 'hono';
import { verify } from 'hono/jwt';
import { AppEnv } from '../types';

export const authMiddleware = async (c: Context<AppEnv>, next: Next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // If no JWT is provided, fallback to the mock tenant headers for admin routes if desired
    // But for full auth, we should require it.
    // For now, let's still allow x-company-id for pure mock scenarios to not break the admin dashboard if it hasn't logged in.
    const companyId = c.req.header('x-company-id');
    if (companyId) {
      c.set('companyId', companyId);
      const employeeId = c.req.header('x-employee-id');
      if (employeeId) c.set('employeeId', employeeId);
      return await next();
    }
    return c.json({ error: 'Unauthorized: Missing or invalid token' }, 401);
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = c.env.JWT_SECRET || 'fallback_secret_for_local_dev';

  try {
    const payload = await verify(token, jwtSecret, "HS256");
    
    // Set authenticated context
    c.set('employeeId', payload.sub as string);
    c.set('companyId', payload.companyId as string);
    c.set('role', payload.role as string);
    
    await next();
  } catch (err) {
    return c.json({ error: 'Unauthorized: Invalid token' }, 401);
  }
};
