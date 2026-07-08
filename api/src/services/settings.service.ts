import { D1Database } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema';

export class SettingsService {
  private db;

  constructor(dbBinding: D1Database) {
    this.db = drizzle(dbBinding, { schema });
  }

  async getSettings(companyId: string) {
    const settings = await this.db.select().from(schema.companySettings).where(eq(schema.companySettings.companyId, companyId)).get();
    if (!settings) {
      // Return defaults if not set yet
      return { companyId, require2fa: false, passwordMinLength: 12, sessionTimeoutMins: 60 };
    }
    return settings;
  }

  async updateSettings(companyId: string, payload: Partial<typeof schema.companySettings.$inferInsert>) {
    const existing = await this.db.select().from(schema.companySettings).where(eq(schema.companySettings.companyId, companyId)).get();
    const data = { ...payload, updatedAt: new Date().toISOString() };
    
    if (existing) {
      return this.db.update(schema.companySettings)
        .set(data)
        .where(eq(schema.companySettings.companyId, companyId))
        .returning()
        .get();
    } else {
      return this.db.insert(schema.companySettings)
        .values({ companyId, ...data })
        .returning()
        .get();
    }
  }

  async getApiKeys(companyId: string) {
    return this.db.select().from(schema.apiKeys).where(eq(schema.apiKeys.companyId, companyId)).all();
  }

  async createApiKey(companyId: string, name: string) {
    // Generate a secure random string for the API key (mock implementation for demo)
    const key = `zk_test_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    const id = `key_${Math.random().toString(36).substring(2, 9)}`;

    return this.db.insert(schema.apiKeys)
      .values({
        id,
        companyId,
        name,
        key,
        createdAt: new Date().toISOString(),
      })
      .returning()
      .get();
  }

  async deleteApiKey(companyId: string, keyId: string) {
    return this.db.delete(schema.apiKeys)
      .where(and(eq(schema.apiKeys.id, keyId), eq(schema.apiKeys.companyId, companyId)))
      .returning()
      .get();
  }
}
