import { describe, it, expect, vi } from 'vitest';
import { requireRole, hasCustomPermission, requirePermission } from '../../src/middlewares/role.middleware';

describe('Role Middleware', () => {
  it('should call next when the role is in the allow-list', async () => {
    const mockContext = {
      get: vi.fn().mockReturnValue('HR_ADMIN'),
      json: vi.fn().mockReturnValue('json-response'),
    };
    const mockNext = vi.fn();

    const middleware = requireRole('SUPER_ADMIN', 'HR_ADMIN');
    await middleware(mockContext as any, mockNext);

    expect(mockContext.get).toHaveBeenCalledWith('role');
    expect(mockNext).toHaveBeenCalled();
    expect(mockContext.json).not.toHaveBeenCalled();
  });

  it('should return 403 when the role is not in the allow-list', async () => {
    const mockContext = {
      get: vi.fn().mockReturnValue('EMPLOYEE'),
      json: vi.fn().mockReturnValue('json-response'),
    };
    const mockNext = vi.fn();

    const middleware = requireRole('SUPER_ADMIN', 'HR_ADMIN');
    const res = await middleware(mockContext as any, mockNext);

    expect(mockContext.json).toHaveBeenCalledWith({ error: 'Forbidden: insufficient permissions' }, 403);
    expect(res).toBe('json-response');
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 403 when no role is present on the context', async () => {
    const mockContext = {
      get: vi.fn().mockReturnValue(undefined),
      json: vi.fn().mockReturnValue('json-response'),
    };
    const mockNext = vi.fn();

    const middleware = requireRole('SUPER_ADMIN', 'HR_ADMIN');
    await middleware(mockContext as any, mockNext);

    expect(mockContext.json).toHaveBeenCalledWith({ error: 'Forbidden: insufficient permissions' }, 403);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should allow any of multiple permitted roles through', async () => {
    const mockContext = {
      get: vi.fn().mockReturnValue('PAYROLL_OFFICER'),
      json: vi.fn(),
    };
    const mockNext = vi.fn();

    const middleware = requireRole('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'PAYROLL_OFFICER');
    await middleware(mockContext as any, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});

describe('hasCustomPermission', () => {
  it('should allow through when the employee has no custom role assigned', async () => {
    const mockDb = {
      query: {
        employees: { findFirst: vi.fn().mockResolvedValue({ id: 'emp-1', customRoleId: null }) },
        roles: { findFirst: vi.fn() },
      },
    };

    const allowed = await hasCustomPermission(mockDb, 'emp-1', 'settings', 'view');

    expect(allowed).toBe(true);
    expect(mockDb.query.roles.findFirst).not.toHaveBeenCalled();
  });

  it('should allow when the custom role grants the module/action', async () => {
    const mockDb = {
      query: {
        employees: { findFirst: vi.fn().mockResolvedValue({ id: 'emp-1', customRoleId: 'role-1' }) },
        roles: { findFirst: vi.fn().mockResolvedValue({ id: 'role-1', permissions: { settings: { view: true } } }) },
      },
    };

    const allowed = await hasCustomPermission(mockDb, 'emp-1', 'settings', 'view');

    expect(allowed).toBe(true);
  });

  it('should deny when the custom role does not grant the module/action', async () => {
    const mockDb = {
      query: {
        employees: { findFirst: vi.fn().mockResolvedValue({ id: 'emp-1', customRoleId: 'role-1' }) },
        roles: { findFirst: vi.fn().mockResolvedValue({ id: 'role-1', permissions: { settings: { view: false } } }) },
      },
    };

    const allowed = await hasCustomPermission(mockDb, 'emp-1', 'settings', 'view');

    expect(allowed).toBe(false);
  });

  it('should deny when the assigned custom role no longer exists', async () => {
    const mockDb = {
      query: {
        employees: { findFirst: vi.fn().mockResolvedValue({ id: 'emp-1', customRoleId: 'deleted-role' }) },
        roles: { findFirst: vi.fn().mockResolvedValue(undefined) },
      },
    };

    const allowed = await hasCustomPermission(mockDb, 'emp-1', 'settings', 'view');

    expect(allowed).toBe(false);
  });
});

describe('requirePermission middleware', () => {
  it('should 403 without calling next when no employeeId is on the context', async () => {
    const mockContext = {
      get: vi.fn().mockReturnValue(undefined),
      json: vi.fn().mockReturnValue('json-response'),
    };
    const mockNext = vi.fn();

    const middleware = requirePermission('settings', 'view');
    const res = await middleware(mockContext as any, mockNext);

    expect(mockContext.json).toHaveBeenCalledWith({ error: 'Forbidden: insufficient permissions' }, 403);
    expect(res).toBe('json-response');
    expect(mockNext).not.toHaveBeenCalled();
  });
});
