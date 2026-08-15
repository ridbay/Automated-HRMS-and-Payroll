import { D1Database } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, desc, inArray } from 'drizzle-orm';
import * as schema from '../db/schema';

const ADMIN_ROLES = ['SUPER_ADMIN', 'HR_ADMIN'];

export class GoalService {
  private db;

  constructor(dbBinding: D1Database) {
    this.db = drizzle(dbBinding, { schema });
  }

  async getMyGoals(companyId: string, employeeId: string) {
    return this.db
      .select()
      .from(schema.goals)
      .where(and(eq(schema.goals.employeeId, employeeId), eq(schema.goals.companyId, companyId)))
      .orderBy(desc(schema.goals.createdAt))
      .all();
  }

  async createGoal(companyId: string, employeeId: string, data: any, assignedById?: string) {
    const id = `GOAL-${crypto.randomUUID().split('-')[0].toUpperCase()}`;
    await this.db.insert(schema.goals).values({
      id,
      companyId,
      employeeId,
      title: data.title,
      description: data.description || null,
      priority: data.priority || 'medium',
      status: data.status || 'on_track',
      progress: data.progress ?? 0,
      dueDate: data.dueDate || null,
      keyResults: data.keyResults ? JSON.stringify(data.keyResults) : null,
      scope: data.scope || 'individual',
      assignedById: assignedById || null,
      parentGoalId: data.parentGoalId || null,
    });
    return { id };
  }

  // Owner can always edit their own goal. A manager may edit any direct
  // report's goal; SUPER_ADMIN/HR_ADMIN may edit anyone's.
  async updateGoal(companyId: string, callerId: string, callerRole: string | undefined, goalId: string, data: any) {
    const goal = await this.db.query.goals.findFirst({
      where: and(eq(schema.goals.id, goalId), eq(schema.goals.companyId, companyId)),
    });
    if (!goal) return null;

    const isOwner = goal.employeeId === callerId;
    const isAdmin = !!callerRole && ADMIN_ROLES.includes(callerRole);
    if (!isOwner && !isAdmin) {
      const employee = await this.db.query.employees.findFirst({ where: eq(schema.employees.id, goal.employeeId) });
      if (!employee || employee.managerId !== callerId) return null;
    }

    const updateData: any = { updatedAt: new Date().toISOString() };
    if (data.progress !== undefined) updateData.progress = data.progress;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
    if (data.keyResults !== undefined) updateData.keyResults = JSON.stringify(data.keyResults);

    await this.db.update(schema.goals).set(updateData).where(eq(schema.goals.id, goalId));
    return this.db.query.goals.findFirst({ where: eq(schema.goals.id, goalId) });
  }

  // Direct reports' goals, for a manager's team view.
  async getTeamGoals(companyId: string, managerId: string) {
    return this.db
      .select({
        id: schema.goals.id,
        employeeId: schema.goals.employeeId,
        employeeName: schema.employees.name,
        employeeLastName: schema.employees.lastName,
        avatar: schema.employees.avatar,
        title: schema.goals.title,
        description: schema.goals.description,
        priority: schema.goals.priority,
        status: schema.goals.status,
        progress: schema.goals.progress,
        dueDate: schema.goals.dueDate,
        keyResults: schema.goals.keyResults,
        scope: schema.goals.scope,
        assignedById: schema.goals.assignedById,
        createdAt: schema.goals.createdAt,
      })
      .from(schema.goals)
      .innerJoin(schema.employees, eq(schema.goals.employeeId, schema.employees.id))
      .where(and(eq(schema.goals.companyId, companyId), eq(schema.employees.managerId, managerId)))
      .orderBy(desc(schema.goals.createdAt))
      .all();
  }

  // Company-wide browse for HR/Admin, optionally filtered by scope (e.g. only 'company' objectives).
  async getCompanyGoals(companyId: string, scope?: string) {
    const conditions = [eq(schema.goals.companyId, companyId)];
    if (scope) conditions.push(eq(schema.goals.scope, scope));

    return this.db
      .select({
        id: schema.goals.id,
        employeeId: schema.goals.employeeId,
        employeeName: schema.employees.name,
        employeeLastName: schema.employees.lastName,
        avatar: schema.employees.avatar,
        department: schema.employees.department,
        title: schema.goals.title,
        description: schema.goals.description,
        priority: schema.goals.priority,
        status: schema.goals.status,
        progress: schema.goals.progress,
        dueDate: schema.goals.dueDate,
        scope: schema.goals.scope,
        parentGoalId: schema.goals.parentGoalId,
        createdAt: schema.goals.createdAt,
      })
      .from(schema.goals)
      .innerJoin(schema.employees, eq(schema.goals.employeeId, schema.employees.id))
      .where(and(...conditions))
      .orderBy(desc(schema.goals.createdAt))
      .all();
  }

  async getCompletionStats(companyId: string, employeeIds?: string[]) {
    const conditions = [eq(schema.goals.companyId, companyId)];
    if (employeeIds && employeeIds.length > 0) conditions.push(inArray(schema.goals.employeeId, employeeIds));

    const rows = await this.db
      .select({ status: schema.goals.status, progress: schema.goals.progress })
      .from(schema.goals)
      .where(and(...conditions))
      .all();

    const total = rows.length;
    const completed = rows.filter((r) => r.status === 'completed').length;
    const avgProgress = total > 0 ? Math.round(rows.reduce((sum, r) => sum + (r.progress || 0), 0) / total) : 0;

    return { total, completed, completionRate: total > 0 ? Math.round((completed / total) * 100) : 0, avgProgress };
  }
}
