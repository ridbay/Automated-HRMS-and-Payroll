import { describe, it, expect, vi } from 'vitest';
import { requireRole, hasCustomPermission, requirePermission } from './role.middleware';

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
