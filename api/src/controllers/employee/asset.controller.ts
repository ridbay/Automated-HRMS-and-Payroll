import { Context } from 'hono';
import { AssetService } from '../../services/asset.service';

export class EmployeeAssetController {
  static async getMyAssets(c: Context<any>) {
    const companyId = c.get('tenantId') || c.get('companyId');
    const employeeId = c.get('user')?.sub || c.get('employeeId');

    if (!companyId || !employeeId) return c.json({ error: 'Unauthorized' }, 401);

    const assetService = new AssetService(c.env.DB);
    const assets = await assetService.getAssetsByEmployee(employeeId, companyId);
    return c.json({ data: assets });
  }
}
