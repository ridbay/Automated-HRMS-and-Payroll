import { describe, it, expect, vi } from 'vitest';
import { tenantMiddleware } from './tenant.middleware';

describe('Tenant Middleware', () => {
  it('should return 401 if x-company-id header is missing', async () => {
    const mockContext = {
      req: { header: vi.fn().mockReturnValue(null) },
      json: vi.fn().mockReturnValue('json-response'),
    };
    const mockNext = vi.fn();
    
    const res = await tenantMiddleware(mockContext as any, mockNext);
    
    expect(mockContext.req.header).toHaveBeenCalledWith('x-company-id');
    expect(mockContext.json).toHaveBeenCalledWith({ error: 'Missing tenant identification (x-company-id)' }, 401);
    expect(res).toBe('json-response');
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should inject companyId into context and call next if header is present', async () => {
    const mockContext = {
      req: { header: vi.fn().mockReturnValue('comp-123') },
      set: vi.fn(),
    };
    const mockNext = vi.fn();
    
    await tenantMiddleware(mockContext as any, mockNext);
    
    expect(mockContext.set).toHaveBeenCalledWith('companyId', 'comp-123');
    expect(mockNext).toHaveBeenCalled();
  });
});
