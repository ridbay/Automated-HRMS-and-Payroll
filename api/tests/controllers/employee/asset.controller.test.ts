import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmployeeAssetController } from '../../../../src/controllers/employee/asset.controller';
import { AssetService } from '../../../../src/services/asset.service';

vi.mock('../../../../src/services/asset.service');

describe('Employee Asset Controller', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    AssetService.prototype.getAssetsByEmployee = vi.fn().mockResolvedValue([{ id: 'a1', name: 'MacBook Pro', category: 'Laptop' }]);

    mockContext = {
      get: vi.fn((key: string) => {
        if (key === 'tenantId') return 'company1';
        if (key === 'user') return { sub: 'emp123' };
        return null;
      }),
      json: vi.fn((data, status) => ({ data, status })),
      env: { DB: {} },
    };
  });

  it('should return assets for the current employee', async () => {
    const res = await EmployeeAssetController.getMyAssets(mockContext);
    expect(res.data.data).toHaveLength(1);
    expect(res.data.data[0].name).toBe('MacBook Pro');
  });
});
