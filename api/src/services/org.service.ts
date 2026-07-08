import { D1Database } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema';

export class OrgService {
  private db;

  constructor(dbBinding: D1Database) {
    this.db = drizzle(dbBinding, { schema });
  }

  async getDepartments(companyId: string) {
    return this.db.select().from(schema.departments).where(eq(schema.departments.companyId, companyId)).all();
  }

  async createDepartment(companyId: string, data: { name: string, description?: string }) {
    const id = `dept_${Math.random().toString(36).substring(2, 9)}`;
    return this.db.insert(schema.departments)
      .values({
        id,
        companyId,
        name: data.name,
        description: data.description,
        createdAt: new Date().toISOString(),
      })
      .returning()
      .get();
  }

  async deleteDepartment(companyId: string, id: string) {
    return this.db.delete(schema.departments)
      .where(and(eq(schema.departments.id, id), eq(schema.departments.companyId, companyId)))
      .returning()
      .get();
  }

  async getLocations(companyId: string) {
    return this.db.select().from(schema.locations).where(eq(schema.locations.companyId, companyId)).all();
  }

  async createLocation(companyId: string, data: { name: string, address: string, city?: string, country?: string }) {
    const id = `loc_${Math.random().toString(36).substring(2, 9)}`;
    return this.db.insert(schema.locations)
      .values({
        id,
        companyId,
        ...data,
        createdAt: new Date().toISOString(),
      })
      .returning()
      .get();
  }

  async deleteLocation(companyId: string, id: string) {
    return this.db.delete(schema.locations)
      .where(and(eq(schema.locations.id, id), eq(schema.locations.companyId, companyId)))
      .returning()
      .get();
  }
}
