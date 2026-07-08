import { D1Database, R2Bucket } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, or, like } from 'drizzle-orm';
import * as schema from '../db/schema';
import { emergencyContacts, employeeDocuments } from '../models/employee.model';
import { hashPassword, generateSalt } from './auth.service';

export class EmployeeService {
  private db;

  constructor(dbBinding: D1Database) {
    this.db = drizzle(dbBinding, { schema });
  }

  async getAllByCompany(companyId: string, search?: string) {
    const conditions = [eq(schema.employees.companyId, companyId)];
    if (search && search.trim()) {
      const pattern = `%${search.trim()}%`;
      conditions.push(
        or(
          like(schema.employees.name, pattern),
          like(schema.employees.lastName, pattern)
        ) as any
      );
    }
    return this.db.query.employees.findMany({
      where: and(...conditions),
      with: {
        emergencyContacts: true,
        employeeDocuments: true,
      },
    });
  }

  async createForCompany(companyId: string, payload: any) {
    const { emergencyContacts, ...employeeData } = payload;
    
    // Auto generate ID if not provided
    if (!employeeData.id) {
      employeeData.id = `EMP-${crypto.randomUUID().split('-')[0].toUpperCase()}`;
    }
    
    // Generate temporary password
    const temporaryPassword = `ZenHR-${crypto.randomUUID().split('-')[0]}`;
    const salt = generateSalt();
    const hashedPassword = await hashPassword(temporaryPassword, salt);
    
    // Insert the employee
    const result = await this.db
      .insert(schema.employees)
      .values({ 
        ...employeeData, 
        companyId,
        passwordHash: hashedPassword,
        passwordSalt: salt,
        isPasswordChanged: false
      })
      .returning();
      
    const newEmployee = result[0] as any;
    newEmployee.temporaryPassword = temporaryPassword;

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
    return this.db.query.employees.findFirst({
      where: and(eq(schema.employees.id, employeeId), eq(schema.employees.companyId, companyId)),
      with: {
        emergencyContacts: true,
        employeeDocuments: true,
      },
    });
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
      secondaryBankName: data.secondaryBankName,
      secondaryAccountNumber: data.secondaryAccountNumber,
      secondaryAccountName: data.secondaryAccountName,
      tin: data.tin,
      pfa: data.pfa,
      pensionId: data.pensionId,
      nin: data.nin,
      nhf: data.nhf,
      taxState: data.taxState,
      maritalStatus: data.maritalStatus,
      avatar: data.avatar,
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

  async addEmergencyContact(companyId: string, employeeId: string, data: any) {
    const newContact = {
      id: `EC-${Math.floor(1000 + Math.random() * 9000)}`,
      companyId,
      employeeId,
      name: data.name,
      relationship: data.relationship,
      phone: data.phone,
      email: data.email,
      isPrimary: data.isPrimary || false,
    };
    console.log("=== DEBUG SCHEMA ===", emergencyContacts);
    if (!emergencyContacts) {
       console.error("emergencyContacts is undefined!");
    }
    const insertBuilder = this.db.insert(emergencyContacts);
    console.log("=== DEBUG INSERT BUILDER ===", Object.keys(insertBuilder), typeof insertBuilder.values);
    await insertBuilder.values(newContact);
    return newContact;
  }

  async deleteEmergencyContact(companyId: string, employeeId: string, contactId: string) {
    await this.db
      .delete(emergencyContacts)
      .where(
        and(
          eq(emergencyContacts.id, contactId),
          eq(emergencyContacts.companyId, companyId),
          eq(emergencyContacts.employeeId, employeeId)
        )
      );
    return { success: true };
  }

  async addDocument(companyId: string, employeeId: string, bucket: R2Bucket, data: { name: string; type: string; file: File }) {
    const documentId = `DOC-${Math.floor(1000 + Math.random() * 9000)}`;
    const fileKey = `companies/${companyId}/employees/${employeeId}/documents/${documentId}-${data.file.name}`;
    
    // Upload to R2
    await bucket.put(fileKey, await data.file.arrayBuffer(), {
      httpMetadata: { contentType: data.file.type }
    });

    const newDocument = {
      id: documentId,
      companyId,
      employeeId,
      name: data.name,
      type: data.type,
      fileKey,
      status: 'Active',
    };

    await this.db.insert(employeeDocuments).values(newDocument);
    return newDocument;
  }

  async deleteDocument(companyId: string, employeeId: string, bucket: R2Bucket, documentId: string) {
    // Get document to find fileKey
    const doc = await this.db.query.employeeDocuments.findFirst({
      where: and(
        eq(employeeDocuments.id, documentId),
        eq(employeeDocuments.companyId, companyId),
        eq(employeeDocuments.employeeId, employeeId)
      )
    });

    if (!doc) throw new Error('Document not found');

    // Delete from R2
    await bucket.delete(doc.fileKey);

    // Delete from DB
    await this.db
      .delete(employeeDocuments)
      .where(eq(employeeDocuments.id, documentId));
      
    return { success: true };
  }

  async getDocumentFile(companyId: string, employeeId: string, bucket: R2Bucket, documentId: string) {
    const doc = await this.db.query.employeeDocuments.findFirst({
      where: and(
        eq(employeeDocuments.id, documentId),
        eq(employeeDocuments.companyId, companyId),
        eq(employeeDocuments.employeeId, employeeId)
      )
    });

    if (!doc) throw new Error('Document not found');

    const file = await bucket.get(doc.fileKey);
    if (!file) throw new Error('File not found in storage');

    return { file, doc };
  }
}
