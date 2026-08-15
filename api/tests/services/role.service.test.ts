import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoleService } from '../../src/services/role.service';

describe('Role Service', () => {
  let mockDb: any;
  let service: RoleService;

  beforeEach(() => {
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnValue({
        all: vi.fn().mockResolvedValue([{ id: 'role-1', name: 'Admin', companyId: 'comp-1' }]),
        get: vi.fn().mockResolvedValue({ id: 'role-1', name: 'Admin', companyId: 'comp-1' })
      }),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({ id: 'new-role', name: 'Manager', companyId: 'comp-1' })
      }),
      delete: vi.fn().mockReturnThis(),
    };
    
    service = new RoleService({} as any);
    (service as any).db = mockDb;
  });

  it('should fetch roles by companyId', async () => {
    const result = await service.getRoles('comp-1');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Admin');
  });

  it('should create a role', async () => {
    const result = await service.createRole('comp-1', { name: 'Manager', permissions: {} });
    expect(mockDb.insert).toHaveBeenCalled();
    expect(result.name).toBe('Manager');
  });

  it('should get a single role', async () => {
    const result = await service.getRole('comp-1', 'role-1');
    expect(result?.id).toBe('role-1');
  });
});
