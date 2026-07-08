import { D1Database } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema';

export class EmployeeService {
  private db;

  constructor(dbBinding: D1Database) {
    this.db = drizzle(dbBinding, { schema });
  }

  async getAllByCompany(companyId: string) {
    return this.db
      .select()
      .from(schema.employees)
      .where(eq(schema.employees.companyId, companyId))
      .all();
  }

  async createForCompany(companyId: string, employeeData: any) {
    const result = await this.db
      .insert(schema.employees)
      .values({ ...employeeData, companyId })
      .returning();
    return result[0];
  }
}
