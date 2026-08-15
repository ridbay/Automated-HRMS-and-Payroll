import { D1Database, R2Bucket } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, or, like, inArray } from 'drizzle-orm';
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
    const employees = await this.db.query.employees.findMany({
      where: and(...conditions),
      with: {
        emergencyContacts: true,
        employeeDocuments: true,
      },
    });

    // Remove sensitive fields before sending to frontend
    return employees.map(emp => {
      const { passwordHash, passwordSalt, ...safeEmployee } = emp;
      return safeEmployee;
    });
  }

  async getDirectory(companyId: string) {
    const directory = await this.db
      .select({
        id: schema.employees.id,
        name: schema.employees.name,
        lastName: schema.employees.lastName,
        email: schema.employees.email,
        phone: schema.employees.phone,
        role: schema.employees.role,
        department: schema.employees.department,
        location: schema.employees.location,
        avatar: schema.employees.avatar,
        managerId: schema.employees.managerId,
        managerName: schema.employees.managerName,
      })
      .from(schema.employees)
      .where(eq(schema.employees.companyId, companyId));

    return directory;
  }

  // Keeps the legacy free-text `department` label in sync with `departmentId`
  // whenever a department is (re)assigned, regardless of entry point.
  private async resolveDepartment(companyId: string, departmentId: string) {
    return this.db.query.departments.findFirst({
      where: and(eq(schema.departments.id, departmentId), eq(schema.departments.companyId, companyId)),
    });
  }

  async createForCompany(companyId: string, payload: any) {
    const { emergencyContacts, ...rawEmployeeData } = payload;

    // Convert empty strings to null to avoid constraint errors and normalize data
    const employeeData: any = Object.fromEntries(
      Object.entries(rawEmployeeData).map(([k, v]) => [k, v === '' ? null : v])
    );

    // Auto generate ID if not provided
    if (!employeeData.id) {
      employeeData.id = `EMP-${crypto.randomUUID().split('-')[0].toUpperCase()}`;
    }

    if (employeeData.departmentId) {
      const department = await this.resolveDepartment(companyId, employeeData.departmentId);
      employeeData.department = department ? department.name : employeeData.department;
      if (!department) employeeData.departmentId = null;
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

    // Remove sensitive fields before sending to frontend
    const { passwordHash, passwordSalt, ...safeEmployee } = newEmployee;
    safeEmployee.temporaryPassword = temporaryPassword;

    // Insert emergency contacts if any exist
    if (emergencyContacts && emergencyContacts.length > 0) {
      const validContacts = emergencyContacts.filter((c: any) => c.name && c.name.trim() !== '');
      if (validContacts.length > 0) {
        const contactsToInsert = validContacts.map((c: any) => ({
          ...c,
          id: `EC-${Math.floor(1000 + Math.random() * 9000)}`,
          companyId,
          employeeId: newEmployee.id,
        }));
        await this.db.insert(schema.emergencyContacts).values(contactsToInsert);
      }
    }

    return safeEmployee;
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
        employeeDocuments: true,
      },
    });

    if (!employee) return null;

    // Remove sensitive fields before sending to frontend
    const { passwordHash, passwordSalt, ...safeEmployee } = employee;
    return safeEmployee;
  }

  async updateEmployeeProfile(companyId: string, employeeId: string, data: Partial<typeof schema.employees.$inferInsert>, isAdmin: boolean = false) {
    // Only allow specific self-service fields to be updated if not admin
    let allowedUpdates: any = {
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

    if (isAdmin) {
      // Admins editing their own profile can edit everything except critical ids
      const { id, companyId: cid, passwordHash, passwordSalt, ...rest } = data as any;
      allowedUpdates = { ...allowedUpdates, ...rest };
    }

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

  async updateEmployeeByAdmin(companyId: string, employeeId: string, data: Partial<typeof schema.employees.$inferInsert>) {
    // Admin can update almost anything except id and companyId
    const { id, companyId: cid, passwordHash, passwordSalt, ...rawUpdateData } = data as any;

    // Convert empty strings to null
    const updateData: any = Object.fromEntries(
      Object.entries(rawUpdateData).map(([k, v]) => [k, v === '' ? null : v])
    );

    if ('departmentId' in updateData) {
      if (updateData.departmentId) {
        const department = await this.resolveDepartment(companyId, updateData.departmentId);
        updateData.department = department ? department.name : null;
        if (!department) updateData.departmentId = null;
      } else {
        // Explicitly unassigning the employee from any department
        updateData.department = null;
      }
    }

    if (Object.keys(updateData).length > 0) {
      await this.db
        .update(schema.employees)
        .set({ ...updateData, updatedAt: new Date().toISOString() })
        .where(and(eq(schema.employees.id, employeeId), eq(schema.employees.companyId, companyId)));
    }

    return this.getEmployeeProfile(companyId, employeeId);
  }

  async deleteEmployee(companyId: string, employeeId: string) {
    // Note: In a real system, you might do a soft delete or reassign dependencies.
    // Every table with a `references(() => employees.id)` FK must be cleared
    // first, or the final delete below fails with a FOREIGN KEY constraint error.
    await this.db.delete(schema.emergencyContacts).where(eq(schema.emergencyContacts.employeeId, employeeId));
    await this.db.delete(schema.employeeDocuments).where(eq(schema.employeeDocuments.employeeId, employeeId));
    await this.db.delete(schema.employeeAssets).where(eq(schema.employeeAssets.employeeId, employeeId));
    await this.db.delete(schema.attendanceRecords).where(eq(schema.attendanceRecords.employeeId, employeeId));
    await this.db.delete(schema.overtimeRequests).where(eq(schema.overtimeRequests.employeeId, employeeId));
    await this.db.delete(schema.leaveRequests).where(eq(schema.leaveRequests.employeeId, employeeId));
    await this.db.delete(schema.leaveBalances).where(eq(schema.leaveBalances.employeeId, employeeId));
    await this.db.delete(schema.employeeBenefits).where(eq(schema.employeeBenefits.employeeId, employeeId));
    await this.db.delete(schema.payslips).where(eq(schema.payslips.employeeId, employeeId));

    // Loans have their own dependents (repayments), so those need clearing first too.
    const employeeLoans = await this.db.select({ id: schema.loans.id }).from(schema.loans).where(eq(schema.loans.employeeId, employeeId)).all();
    const loanIds = employeeLoans.map((l: any) => l.id);
    if (loanIds.length > 0) {
      await this.db.delete(schema.loanRepayments).where(inArray(schema.loanRepayments.loanId, loanIds));
    }
    await this.db.delete(schema.loans).where(eq(schema.loans.employeeId, employeeId));

    await this.db
      .delete(schema.employees)
      .where(and(eq(schema.employees.id, employeeId), eq(schema.employees.companyId, companyId)));
    return { success: true };
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

  async addDocument(companyId: string, employeeId: string, bucket: R2Bucket, data: { name: string; type: string; file: File; linkedAssessmentId?: string }) {
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
      linkedAssessmentId: data.linkedAssessmentId || null,
    };

    await this.db.insert(employeeDocuments).values(newDocument);
    return newDocument;
  }

  async deleteDocument(companyId: string, employeeId: string, bucket: R2Bucket, documentId: string) {
    const doc = await this.db.query.employeeDocuments.findFirst({
      where: and(
        eq(schema.employeeDocuments.id, documentId),
        eq(schema.employeeDocuments.companyId, companyId),
        eq(schema.employeeDocuments.employeeId, employeeId)
      )
    });

    if (!doc) throw new Error('Document not found');

    // Attempt to delete from R2
    try {
      if (doc.fileKey) {
        await bucket.delete(doc.fileKey);
      }
    } catch (e) {
      console.error('Failed to delete from R2', e);
    }

    const result = await this.db.delete(schema.employeeDocuments)
      .where(and(
        eq(schema.employeeDocuments.id, documentId),
        eq(schema.employeeDocuments.companyId, companyId),
        eq(schema.employeeDocuments.employeeId, employeeId)
      ))
      .returning();

    return result[0];
  }

  async getAuditLogs(companyId: string, employeeId: string) {
    return this.db.query.auditLogs.findMany({
      where: and(
        eq(schema.auditLogs.companyId, companyId),
        eq(schema.auditLogs.employeeId, employeeId)
      ),
      orderBy: (auditLogs: any, { desc }: any) => [desc(auditLogs.createdAt)],
    });
  }

  async getAssets(companyId: string, employeeId: string) {
    return this.db.query.employeeAssets.findMany({
      where: and(
        eq(schema.employeeAssets.companyId, companyId),
        eq(schema.employeeAssets.employeeId, employeeId)
      )
    });
  }

  async addAsset(companyId: string, employeeId: string, data: any) {
    const id = `AST-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const result = await this.db.insert(schema.employeeAssets).values({
      id,
      companyId,
      employeeId,
      name: data.name,
      category: data.category,
      serialNumber: data.serialNumber,
      status: data.status || 'Assigned',
      condition: data.condition || 'Good',
      purchaseDate: data.purchaseDate,
      value: data.value ? parseInt(data.value, 10) : null,
      image: data.image
    }).returning();
    return result[0];
  }

  async deleteAsset(companyId: string, employeeId: string, assetId: string) {
    const result = await this.db.delete(schema.employeeAssets)
      .where(and(
        eq(schema.employeeAssets.id, assetId),
        eq(schema.employeeAssets.companyId, companyId),
        eq(schema.employeeAssets.employeeId, employeeId)
      ))
      .returning();
    return result[0];
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
