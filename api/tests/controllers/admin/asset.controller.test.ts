import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminAssetController } from '../../../src/controllers/admin/asset.controller';
import { AssetService } from '../../../src/services/asset.service';

vi.mock('../../../src/services/asset.service');

describe('Admin Asset Controller', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    AssetService.prototype.getAllAssetsByCompany = vi.fn().mockResolvedValue([{ id: 'a1', name: 'MacBook Pro', category: 'Laptop' }]);
    AssetService.prototype.getAssetById = vi.fn().mockResolvedValue({ id: 'a1', name: 'MacBook Pro', category: 'Laptop' });
    AssetService.prototype.createAsset = vi.fn().mockResolvedValue({ id: 'new1', name: 'Magic Mouse', category: 'Peripherals' });
    AssetService.prototype.updateAsset = vi.fn().mockResolvedValue({ id: 'a1', name: 'MacBook Pro', category: 'Laptop', condition: 'Fair' });
    AssetService.prototype.deleteAsset = vi.fn().mockResolvedValue({ success: true });

    mockContext = {
      get: vi.fn().mockReturnValue('company1'),
      req: {
        param: vi.fn().mockReturnValue('a1'),
        json: vi.fn().mockResolvedValue({ employeeId: 'e1', name: 'Magic Mouse', category: 'Peripherals' }),
      },
      json: vi.fn((data, status) => ({ data, status })),
      env: { DB: {} },
    };
  });

  it('should return all assets', async () => {
    const res: any = await AdminAssetController.getAllAssets(mockContext);
    expect(res.data.data).toHaveLength(1);
    expect(res.data.data[0].name).toBe('MacBook Pro');
  });

  it('should create an asset', async () => {
    const res: any = await AdminAssetController.createAsset(mockContext);
    expect(res.status).toBe(201);
    expect(res.data.data.name).toBe('Magic Mouse');
  });
});
