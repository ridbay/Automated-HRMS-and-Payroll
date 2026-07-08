import { D1Database } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema';

export class RoleService {
  private db;

  constructor(dbBinding: D1Database) {
    this.db = drizzle(dbBinding, { schema });
  }

  async getRoles(companyId: string) {
    return this.db.select().from(schema.roles).where(eq(schema.roles.companyId, companyId)).all();
  }

  async getRole(companyId: string, id: string) {
    return this.db.select().from(schema.roles).where(and(eq(schema.roles.id, id), eq(schema.roles.companyId, companyId))).get();
  }

  async createRole(companyId: string, data: { name: string, description?: string, permissions: any, color?: string }) {
    const id = `role_${Math.random().toString(36).substring(2, 9)}`;
    return this.db.insert(schema.roles)
      .values({
        id,
        companyId,
        name: data.name,
        description: data.description,
        permissions: data.permissions,
        color: data.color || 'slate',
        createdAt: new Date().toISOString(),
      })
      .returning()
      .get();
  }

  async updateRole(companyId: string, id: string, data: Partial<{ name: string, description: string, permissions: any, color: string }>) {
    return this.db.update(schema.roles)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(and(eq(schema.roles.id, id), eq(schema.roles.companyId, companyId)))
      .returning()
      .get();
  }

  async deleteRole(companyId: string, id: string) {
    return this.db.delete(schema.roles)
      .where(and(eq(schema.roles.id, id), eq(schema.roles.companyId, companyId)))
      .returning()
      .get();
  }
}
