import { D1Database } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, desc } from 'drizzle-orm';
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
    // Fetch all approved requests to subtract from base balances
    const requests = await this.db.query.leaveRequests.findMany({
      where: and(
        eq(schema.leaveRequests.companyId, companyId),
        eq(schema.leaveRequests.employeeId, employeeId),
        eq(schema.leaveRequests.status, 'approved')
      )
    });

    const usedAnnual = requests.filter((r: any) => r.type === 'Annual Leave').reduce((sum: number, r: any) => sum + r.days, 0);
    const usedSick = requests.filter((r: any) => r.type === 'Sick Leave').reduce((sum: number, r: any) => sum + r.days, 0);
    const usedMaternity = requests.filter((r: any) => r.type === 'Maternity Leave').reduce((sum: number, r: any) => sum + r.days, 0);

    return [
      { type: 'Annual Leave', total: 20, used: usedAnnual, color: 'indigo' },
      { type: 'Sick Leave', total: 10, used: usedSick, color: 'rose' },
      { type: 'Maternity Leave', total: 90, used: usedMaternity, color: 'emerald' },
    ];
  }

  async createLeaveRequest(companyId: string, employeeId: string, data: any) {
    const id = `LR-${Math.floor(1000 + Math.random() * 9000)}`;
    const appliedOn = new Date().toISOString().split('T')[0];

    const result = await this.db.insert(schema.leaveRequests).values({
      id,
      companyId,
      employeeId,
      type: data.type,
      startDate: data.startDate,
      endDate: data.endDate || data.startDate,
      days: data.days,
      reason: data.reason,
      status: 'pending',
      appliedOn,
    }).returning();

    return result[0];
  }
}
