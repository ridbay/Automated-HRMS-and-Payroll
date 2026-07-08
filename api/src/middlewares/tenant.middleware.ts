import { Context, Next } from 'hono';

export const tenantMiddleware = async (c: Context, next: Next) => {
  // In a real app, this would extract the companyId from a verified JWT.
  // For local development, we simulate it via a custom header.
  const companyId = c.req.header('x-company-id');

  if (!companyId) {
    return c.json({ error: 'Missing tenant identification (x-company-id)' }, 401);
  }

  // Inject the tenant ID into the Hono context variables
  c.set('companyId', companyId);
  
  await next();
};
