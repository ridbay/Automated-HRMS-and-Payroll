import { eq, and } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { employeeAssets } from '../models/employee.model';
import { D1Database } from '@cloudflare/workers-types';
import * as schema from '../db/schema';

export class AssetService {
  private db;

  constructor(dbBinding: D1Database) {
    this.db = drizzle(dbBinding, { schema });
  }

  async getAllAssetsByCompany(companyId: string) {
    return await this.db.select().from(employeeAssets).where(eq(employeeAssets.companyId, companyId));
  }

  async getAssetById(assetId: string, companyId: string) {
    const result = await this.db
      .select()
      .from(employeeAssets)
      .where(and(eq(employeeAssets.id, assetId), eq(employeeAssets.companyId, companyId)));
    return result[0];
  }

  async getAssetsByEmployee(employeeId: string, companyId: string) {
    return await this.db
      .select()
      .from(employeeAssets)
      .where(and(eq(employeeAssets.employeeId, employeeId), eq(employeeAssets.companyId, companyId)));
  }

  async createAsset(data: {
    companyId: string;
    employeeId: string;
    name: string;
    category: string;
    serialNumber?: string;
    status?: string;
    condition?: string;
    purchaseDate?: string;
    value?: number;
    image?: string;
  }) {
    const assetId = `AST-${crypto.randomUUID().split('-')[0].toUpperCase()}`;
    const result = await this.db
      .insert(employeeAssets)
      .values({
        id: assetId,
        ...data,
      })
      .returning();
    return result[0];
  }

  async updateAsset(
    assetId: string,
    companyId: string,
    data: Partial<{
      employeeId: string;
      name: string;
      category: string;
      serialNumber: string;
      status: string;
      condition: string;
      purchaseDate: string;
      value: number;
      image: string;
    }>
  ) {
    const result = await this.db
      .update(employeeAssets)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(and(eq(employeeAssets.id, assetId), eq(employeeAssets.companyId, companyId)))
      .returning();
    return result[0];
  }

  async deleteAsset(assetId: string, companyId: string) {
    await this.db
      .delete(employeeAssets)
      .where(and(eq(employeeAssets.id, assetId), eq(employeeAssets.companyId, companyId)));
    return { success: true };
  }
}
