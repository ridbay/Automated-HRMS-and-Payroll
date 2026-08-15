import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authMiddleware } from './auth.middleware';
import * as jwt from 'hono/jwt';

vi.mock('hono/jwt', () => ({
  verify: vi.fn(),
}));

describe('Auth Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fallback to x-company-id header if no Authorization header exists', async () => {
    const mockContext = {
      req: {
        header: vi.fn((key: string) => {
          if (key === 'x-company-id') return 'comp-1';
          if (key === 'x-employee-id') return 'emp-1';
          return null;
        })
      },
      set: vi.fn(),
      env: { JWT_SECRET: 'secret' },
      json: vi.fn(),
    };
    const mockNext = vi.fn();

    await authMiddleware(mockContext as any, mockNext);

    expect(mockContext.set).toHaveBeenCalledWith('companyId', 'comp-1');
    expect(mockContext.set).toHaveBeenCalledWith('employeeId', 'emp-1');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should return 401 if neither token nor fallback headers exist', async () => {
    const mockContext = {
      req: {
        header: vi.fn(() => null)
      },
      json: vi.fn().mockReturnValue('json-res'),
      env: {},
    };
    const mockNext = vi.fn();

    const res = await authMiddleware(mockContext as any, mockNext);

    expect(mockContext.json).toHaveBeenCalledWith({ error: 'Unauthorized: Missing or invalid token' }, 401);
    expect(res).toBe('json-res');
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should verify token and set context variables', async () => {
    (jwt.verify as any).mockResolvedValueOnce({ sub: 'emp-1', companyId: 'comp-1', role: 'ADMIN' });
    
    const mockContext = {
      req: {
        header: vi.fn((key: string) => {
          if (key === 'Authorization') return 'Bearer valid-token';
          return null;
        })
      },
      set: vi.fn(),
      env: { JWT_SECRET: 'secret' },
    };
    const mockNext = vi.fn();

    await authMiddleware(mockContext as any, mockNext);

    expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'secret', 'HS256');
    expect(mockContext.set).toHaveBeenCalledWith('employeeId', 'emp-1');
    expect(mockContext.set).toHaveBeenCalledWith('companyId', 'comp-1');
    expect(mockContext.set).toHaveBeenCalledWith('role', 'ADMIN');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should return 401 if token verification fails', async () => {
    (jwt.verify as any).mockRejectedValueOnce(new Error('Invalid signature'));
    
    const mockContext = {
      req: {
        header: vi.fn((key: string) => {
          if (key === 'Authorization') return 'Bearer invalid-token';
          return null;
        })
      },
      json: vi.fn().mockReturnValue('json-res'),
      env: { JWT_SECRET: 'secret' },
    };
    const mockNext = vi.fn();

    const res = await authMiddleware(mockContext as any, mockNext);

    expect(mockContext.json).toHaveBeenCalledWith({ error: 'Unauthorized: Invalid token' }, 401);
    expect(res).toBe('json-res');
    expect(mockNext).not.toHaveBeenCalled();
  });
});
