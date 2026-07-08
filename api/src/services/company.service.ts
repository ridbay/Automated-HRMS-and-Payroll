import { D1Database } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema';

export class CompanyService {
  private db;

  constructor(dbBinding: D1Database) {
    this.db = drizzle(dbBinding, { schema });
  }

  async getCompany(companyId: string) {
    return this.db.select().from(schema.companies).where(eq(schema.companies.id, companyId)).get();
  }

  async updateCompany(companyId: string, data: Partial<typeof schema.companies.$inferInsert>) {
    return this.db.update(schema.companies)
      .set(data)
      .where(eq(schema.companies.id, companyId))
      .returning()
      .get();
  }
}
