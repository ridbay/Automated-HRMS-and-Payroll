import { D1Database } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, desc, inArray } from 'drizzle-orm';
import * as schema from '../db/schema';

export class LeaveService {
  private db;

  constructor(dbBinding: D1Database) {
    this.db = drizzle(dbBinding, { schema });
  }

  async getAllByCompany(companyId: string) {
    return this.db
      .select()
      .from(schema.leaveRequests)
      .where(eq(schema.leaveRequests.companyId, companyId))
      .all();
  }

  async getTeamLeaves(companyId: string, employeeId: string) {
    // "Team Calendar" is scoped to the caller's own department ("colleagues
    // currently on leave") — not company-wide, and not limited to direct
    // reports, since every employee (not just managers) uses this view.
    const caller = await this.db.query.employees.findFirst({
      where: and(eq(schema.employees.id, employeeId), eq(schema.employees.companyId, companyId)),
    });
    // No department on record means no defined cohort to show as "my team".
    if (!caller || !caller.department) return [];

    const requests = await this.db
      .select({
        id: schema.leaveRequests.id,
        employeeId: schema.leaveRequests.employeeId,
        name: schema.employees.name,
        lastName: schema.employees.lastName,
        avatar: schema.employees.avatar,
        type: schema.leaveRequests.type,
        startDate: schema.leaveRequests.startDate,
        endDate: schema.leaveRequests.endDate,
        days: schema.leaveRequests.days,
        status: schema.leaveRequests.status,
      })
      .from(schema.leaveRequests)
      .innerJoin(schema.employees, eq(schema.leaveRequests.employeeId, schema.employees.id))
      .where(
        and(
          eq(schema.leaveRequests.companyId, companyId),
          eq(schema.leaveRequests.status, 'approved'),
          eq(schema.employees.department, caller.department)
        )
      )
      .all();

    return requests;
  }

  async getPendingTeamLeaveRequests(companyId: string, managerId: string) {
    // Pending requests from employees who report directly to this manager
    return this.db
      .select({
        id: schema.leaveRequests.id,
        employeeId: schema.leaveRequests.employeeId,
        name: schema.employees.name,
        lastName: schema.employees.lastName,
        avatar: schema.employees.avatar,
        type: schema.leaveRequests.type,
        startDate: schema.leaveRequests.startDate,
        endDate: schema.leaveRequests.endDate,
        days: schema.leaveRequests.days,
        reason: schema.leaveRequests.reason,
        status: schema.leaveRequests.status,
      })
      .from(schema.leaveRequests)
      .innerJoin(schema.employees, eq(schema.leaveRequests.employeeId, schema.employees.id))
      .where(
        and(
          eq(schema.leaveRequests.companyId, companyId),
          eq(schema.leaveRequests.status, 'pending'),
          eq(schema.employees.managerId, managerId)
        )
      )
      .all();
  }

  async updateTeamLeaveRequestStatus(companyId: string, managerId: string, requestId: string, data: { status: string; managerComment?: string }) {
    const request = await this.db.query.leaveRequests.findFirst({
      where: and(eq(schema.leaveRequests.id, requestId), eq(schema.leaveRequests.companyId, companyId)),
    });
    if (!request) return null;

    const employee = await this.db.query.employees.findFirst({
      where: eq(schema.employees.id, request.employeeId),
    });

    // Only the requester's own manager may act on it — not just anyone with a MANAGER role
    if (!employee || employee.managerId !== managerId) {
      return null;
    }

    return this.updateLeaveRequestStatus(companyId, requestId, {
      status: data.status,
      managerComment: data.managerComment,
      managerId,
    });
  }

  async getEmployeeLeaveRequests(companyId: string, employeeId: string) {
    return this.db.query.leaveRequests.findMany({
      where: and(
        eq(schema.leaveRequests.companyId, companyId),
        eq(schema.leaveRequests.employeeId, employeeId)
      ),
      orderBy: (leaveRequests: any, { desc }: any) => [desc(leaveRequests.appliedOn)]
    });
  }

  async calculateLeaveBalances(companyId: string, employeeId: string) {
    const requests = await this.db.query.leaveRequests.findMany({
      where: and(
        eq(schema.leaveRequests.companyId, companyId),
        eq(schema.leaveRequests.employeeId, employeeId),
        eq(schema.leaveRequests.status, 'approved')
      )
    });

    // Sum approved days per leave type generically — not just the three
    // built-in defaults — so a custom type (HR can add one via the employee
    // profile) has its usage tracked too, instead of always reading as 0.
    const usedByType = new Map<string, number>();
    for (const r of requests as any[]) {
      usedByType.set(r.type, (usedByType.get(r.type) || 0) + r.days);
    }

    let balances: any[] = await this.db.query.leaveBalances.findMany({
      where: and(
        eq(schema.leaveBalances.companyId, companyId),
        eq(schema.leaveBalances.employeeId, employeeId)
      )
    });

    if (!balances || balances.length === 0) {
      balances = [
        { type: 'Annual Leave', total: 20, color: 'indigo' },
        { type: 'Sick Leave', total: 10, color: 'rose' },
        { type: 'Maternity Leave', total: 90, color: 'emerald' },
      ];
    }

    return balances.map((b: any) => ({
      ...b,
      used: usedByType.get(b.type) || 0,
    }));
  }

  async createLeaveRequest(companyId: string, employeeId: string, data: any) {
    const days = Number(data.days) || 0;
    const startDate = data.startDate;
    const endDate = data.endDate || data.startDate;

    // Don't let a request exceed the employee's remaining balance for that type.
    if (days > 0) {
      const balances = await this.calculateLeaveBalances(companyId, employeeId);
      const balance = balances.find((b: any) => b.type === data.type);
      if (balance) {
        const remaining = balance.total - balance.used;
        if (days > remaining) {
          throw new Error(`Insufficient ${data.type} balance: ${remaining} day(s) remaining, requested ${days}.`);
        }
      }
    }

    // Don't let a new request overlap an existing pending/approved request —
    // no double-booking the same days across two leave requests.
    const existing = await this.db.query.leaveRequests.findMany({
      where: and(
        eq(schema.leaveRequests.companyId, companyId),
        eq(schema.leaveRequests.employeeId, employeeId),
        inArray(schema.leaveRequests.status, ['pending', 'approved'])
      ),
    });
    const newStart = new Date(startDate).getTime();
    const newEnd = new Date(endDate).getTime();
    const overlaps = (existing as any[]).some((r) => {
      const rStart = new Date(r.startDate).getTime();
      const rEnd = new Date(r.endDate).getTime();
      return newStart <= rEnd && rStart <= newEnd;
    });
    if (overlaps) {
      throw new Error('You already have a pending or approved leave request that overlaps these dates.');
    }

    const id = `LR-${Math.floor(1000 + Math.random() * 9000)}`;
    const appliedOn = new Date().toISOString().split('T')[0];

    const result = await this.db.insert(schema.leaveRequests).values({
      id,
      companyId,
      employeeId,
      type: data.type,
      startDate,
      endDate,
      days: data.days,
      reason: data.reason,
      status: 'pending',
      appliedOn,
    }).returning();

    return result[0];
  }

  async updateLeaveRequestStatus(companyId: string, requestId: string, data: { status: string; days?: number; managerComment?: string; managerId?: string }) {
    const updateData: any = {
      status: data.status,
      managerId: data.managerId,
      managerComment: data.managerComment,
    };
    if (data.days !== undefined) {
      updateData.days = data.days;
    }

    // Only a still-pending request can be decided — scoping the WHERE to
    // status='pending' makes this a compare-and-swap, so a request already
    // approved/rejected can't be silently re-decided or flipped back.
    const result = await this.db
      .update(schema.leaveRequests)
      .set(updateData)
      .where(and(
        eq(schema.leaveRequests.companyId, companyId),
        eq(schema.leaveRequests.id, requestId),
        eq(schema.leaveRequests.status, 'pending')
      ))
      .returning();

    return result[0];
  }

  async updateEmployeeLeaveBalances(companyId: string, employeeId: string, balances: any[]) {
    // Delete existing balances
    await this.db.delete(schema.leaveBalances).where(
      and(
        eq(schema.leaveBalances.companyId, companyId),
        eq(schema.leaveBalances.employeeId, employeeId)
      )
    );

    // Insert new balances
    if (balances.length > 0) {
      const inserts = balances.map((b: any) => ({
        id: `LB-${Math.floor(1000 + Math.random() * 9000)}`,
        companyId,
        employeeId,
        type: b.type,
        total: b.total,
        color: b.color || 'indigo',
      }));
      await this.db.insert(schema.leaveBalances).values(inserts);
    }
    
    return balances;
  }
}
