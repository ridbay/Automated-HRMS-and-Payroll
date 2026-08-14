import { D1Database } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema';

// Lightweight, password-free projection used for department member/manager/lead display
const employeeSummaryColumns = {
  id: schema.employees.id,
  name: schema.employees.name,
  lastName: schema.employees.lastName,
  email: schema.employees.email,
  role: schema.employees.role,
  avatar: schema.employees.avatar,
  departmentId: schema.employees.departmentId,
};

type EmployeeSummary = {
  id: string;
  name: string;
  lastName: string;
  email: string;
  role: string | null;
  avatar: string | null;
  departmentId: string | null;
};

export class OrgService {
  private db;

  constructor(dbBinding: D1Database) {
    this.db = drizzle(dbBinding, { schema });
  }

  async getDepartments(companyId: string) {
    const [departments, employees] = await Promise.all([
      this.db.select().from(schema.departments).where(eq(schema.departments.companyId, companyId)).all(),
      this.db.select(employeeSummaryColumns).from(schema.employees).where(eq(schema.employees.companyId, companyId)).all(),
    ]);

    const employeesById = new Map(employees.map((e) => [e.id, e]));
    const memberCounts = new Map<string, number>();
    for (const emp of employees) {
      if (!emp.departmentId) continue;
      memberCounts.set(emp.departmentId, (memberCounts.get(emp.departmentId) || 0) + 1);
    }

    const toSummary = (emp?: any) =>
      emp ? { id: emp.id, name: `${emp.name} ${emp.lastName}`.trim(), avatar: emp.avatar } : null;

    return departments.map((d) => ({
      ...d,
      memberCount: memberCounts.get(d.id) || 0,
      manager: toSummary(d.managerId ? employeesById.get(d.managerId) : undefined),
      teamLead: toSummary(d.teamLeadId ? employeesById.get(d.teamLeadId) : undefined),
    }));
  }

  async createDepartment(companyId: string, data: { name: string, description?: string, managerId?: string, teamLeadId?: string }) {
    const id = `dept_${Math.random().toString(36).substring(2, 9)}`;
    return this.db.insert(schema.departments)
      .values({
        id,
        companyId,
        name: data.name,
        description: data.description,
        managerId: data.managerId || null,
        teamLeadId: data.teamLeadId || null,
        createdAt: new Date().toISOString(),
      })
      .returning()
      .get();
  }

  async updateDepartment(companyId: string, id: string, data: Partial<{ name: string, description: string, managerId: string | null, teamLeadId: string | null }>) {
    return this.db.update(schema.departments)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(and(eq(schema.departments.id, id), eq(schema.departments.companyId, companyId)))
      .returning()
      .get();
  }

  async deleteDepartment(companyId: string, id: string) {
    // Un-assign members first so no employee is left pointing at a deleted department
    await this.db.update(schema.employees)
      .set({ departmentId: null, department: null, updatedAt: new Date().toISOString() })
      .where(and(eq(schema.employees.companyId, companyId), eq(schema.employees.departmentId, id)));

    return this.db.delete(schema.departments)
      .where(and(eq(schema.departments.id, id), eq(schema.departments.companyId, companyId)))
      .returning()
      .get();
  }

  async getDepartmentMembers(companyId: string, departmentId: string) {
    return this.db.select(employeeSummaryColumns)
      .from(schema.employees)
      .where(and(eq(schema.employees.companyId, companyId), eq(schema.employees.departmentId, departmentId)))
      .all();
  }

  async assignEmployeeToDepartment(companyId: string, departmentId: string, employeeId: string) {
    const department = await this.db.query.departments.findFirst({
      where: and(eq(schema.departments.id, departmentId), eq(schema.departments.companyId, companyId)),
    });
    if (!department) return null;

    const updated = await this.db.update(schema.employees)
      .set({ departmentId, department: department.name, updatedAt: new Date().toISOString() })
      .where(and(eq(schema.employees.id, employeeId), eq(schema.employees.companyId, companyId)))
      .returning()
      .get();
    if (!updated) return null;

    const { passwordHash, passwordSalt, ...safeEmployee } = updated as any;
    return safeEmployee;
  }

  async removeEmployeeFromDepartment(companyId: string, departmentId: string, employeeId: string) {
    const updated = await this.db.update(schema.employees)
      .set({ departmentId: null, department: null, updatedAt: new Date().toISOString() })
      .where(and(
        eq(schema.employees.id, employeeId),
        eq(schema.employees.companyId, companyId),
        eq(schema.employees.departmentId, departmentId)
      ))
      .returning()
      .get();
    if (!updated) return null;

    const { passwordHash, passwordSalt, ...safeEmployee } = updated as any;
    return safeEmployee;
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
