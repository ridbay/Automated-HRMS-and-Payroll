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
  async getFirstEmployeeId(companyId: string): Promise<string | null> {
    const result = await this.db
      .select({ id: schema.employees.id })
      .from(schema.employees)
      .where(eq(schema.employees.companyId, companyId))
      .limit(1);
    
    return result[0]?.id || null;
  }

  async getEmployeeProfile(companyId: string, employeeId: string) {
    const employee = await this.db.query.employees.findFirst({
      where: and(eq(schema.employees.id, employeeId), eq(schema.employees.companyId, companyId)),
      with: {
        emergencyContacts: true,
      },
    });

    return employee;
  }

  async updateEmployeeProfile(companyId: string, employeeId: string, data: Partial<typeof schema.employees.$inferInsert>) {
    // Only allow specific self-service fields to be updated
    const allowedUpdates = {
      phone: data.phone,
      email: data.email, 
      location: data.location,
      bankName: data.bankName,
      accountNumber: data.accountNumber,
      accountName: data.accountName,
      maritalStatus: data.maritalStatus,
    };

    // Remove undefined values
    const updateData = Object.fromEntries(
      Object.entries(allowedUpdates).filter(([_, v]) => v !== undefined)
    );

    if (Object.keys(updateData).length > 0) {
      await this.db
        .update(schema.employees)
        .set(updateData)
        .where(and(eq(schema.employees.id, employeeId), eq(schema.employees.companyId, companyId)));
    }

    return this.getEmployeeProfile(companyId, employeeId);
  }
}
