import { Context, Next } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { AppEnv } from '../types';
import * as schema from '../db/schema';

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

export type PermissionModule = 'workforce' | 'payroll' | 'performance' | 'settings' | 'leave' | 'attendance';
export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'approve';

// Decides whether an employee's optional custom role grants a given module/action.
// Exported separately (rather than inlined in the middleware) so it can be unit
// tested against a mocked db, mirroring the service-layer test convention.
export const hasCustomPermission = async (
  db: any,
  employeeId: string,
  moduleKey: PermissionModule,
  action: PermissionAction
): Promise<boolean> => {
  const employee = await db.query.employees.findFirst({
    where: eq(schema.employees.id, employeeId),
  });

  // No custom role assigned: nothing to narrow, the fixed-role gate stands alone.
  if (!employee?.customRoleId) return true;

  const role = await db.query.roles.findFirst({
    where: eq(schema.roles.id, employee.customRoleId),
  });

  const permissions = (role?.permissions as any) || {};
  return permissions?.[moduleKey]?.[action] === true;
};

// Narrows requireRole's decision for employees who've been assigned a custom
// role. Must run after authMiddleware AND (typically) requireRole. Additive
// only: a custom role can never grant more than the routes it's attached to
// already allow, it can only take access away from employees assigned one.
export const requirePermission = (moduleKey: PermissionModule, action: PermissionAction) => {
  return async (c: Context<AppEnv>, next: Next) => {
    const employeeId = c.get('employeeId');
    if (!employeeId) {
      return c.json({ error: 'Forbidden: insufficient permissions' }, 403);
    }

    const db = drizzle(c.env.DB, { schema });
    const allowed = await hasCustomPermission(db, employeeId, moduleKey, action);

    if (!allowed) {
      return c.json({ error: 'Forbidden: custom role does not grant this permission' }, 403);
    }

    await next();
  };
};
