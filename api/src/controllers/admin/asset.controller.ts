import { Context } from 'hono';
import { AssetService } from '../../services/asset.service';

export class AdminAssetController {
  static async getAllAssets(c: Context<any>) {
    const companyId = c.get('tenantId') || c.get('companyId');
    if (!companyId) return c.json({ error: 'Tenant not found' }, 400);

    const assetService = new AssetService(c.env.DB);
    const assets = await assetService.getAllAssetsByCompany(companyId);
    return c.json({ data: assets });
  }

  static async getAssetById(c: Context<any>) {
    const companyId = c.get('tenantId') || c.get('companyId');
    if (!companyId) return c.json({ error: 'Tenant not found' }, 400);
    const assetId = c.req.param('id');
    if (!assetId) return c.json({ error: 'Asset ID is required' }, 400);

    const assetService = new AssetService(c.env.DB);
    const asset = await assetService.getAssetById(assetId, companyId);
    if (!asset) return c.json({ error: 'Asset not found' }, 404);
    return c.json({ data: asset });
  }

  static async createAsset(c: Context<any>) {
    const companyId = c.get('tenantId') || c.get('companyId');
    if (!companyId) return c.json({ error: 'Tenant not found' }, 400);

    const body = await c.req.json();
    if (!body.employeeId || !body.name || !body.category) {
      return c.json({ error: 'Missing required fields (employeeId, name, category)' }, 400);
    }

    const assetService = new AssetService(c.env.DB);
    const asset = await assetService.createAsset({
      companyId,
      ...body,
    });
    return c.json({ data: asset }, 201);
  }

  static async updateAsset(c: Context<any>) {
    const companyId = c.get('tenantId') || c.get('companyId');
    if (!companyId) return c.json({ error: 'Tenant not found' }, 400);
    const assetId = c.req.param('id');
    if (!assetId) return c.json({ error: 'Asset ID is required' }, 400);
    const body = await c.req.json();

    const assetService = new AssetService(c.env.DB);
    const asset = await assetService.updateAsset(assetId, companyId, body);
    if (!asset) return c.json({ error: 'Asset not found' }, 404);
    return c.json({ data: asset });
  }

  static async deleteAsset(c: Context<any>) {
    const companyId = c.get('tenantId') || c.get('companyId');
    if (!companyId) return c.json({ error: 'Tenant not found' }, 400);
    const assetId = c.req.param('id');
    if (!assetId) return c.json({ error: 'Asset ID is required' }, 400);

    const assetService = new AssetService(c.env.DB);
    await assetService.deleteAsset(assetId, companyId);
    return c.json({ success: true });
  }
}
