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
    return this.db.query.employees.findMany({
      where: eq(schema.employees.companyId, companyId),
      with: {
        emergencyContacts: true,
      },
    });
  }

  async createForCompany(companyId: string, payload: any) {
    const { emergencyContacts, ...employeeData } = payload;
    
    // Auto generate ID if not provided
    if (!employeeData.id) {
      employeeData.id = `EMP-${crypto.randomUUID().split('-')[0].toUpperCase()}`;
    }
    
    // Insert the employee
    const result = await this.db
      .insert(schema.employees)
      .values({ ...employeeData, companyId })
      .returning();
      
    const newEmployee = result[0];

    // Insert emergency contacts if any exist
    if (emergencyContacts && emergencyContacts.length > 0) {
      const contactsToInsert = emergencyContacts.map((c: any) => ({
        ...c,
        id: `EC-${Math.floor(1000 + Math.random() * 9000)}`,
        companyId,
        employeeId: newEmployee.id,
      }));
      await this.db.insert(schema.emergencyContacts).values(contactsToInsert);
    }
    
    return newEmployee;
  }
}
