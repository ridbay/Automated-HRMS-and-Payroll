import { D1Database } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, asc } from 'drizzle-orm';
import * as schema from '../db/schema';

export interface TransitionActor {
  id: string;
  name: string;
}

const ONBOARDING_STAGES = ['Pre-boarding', 'Orientation', 'Equipment & Access', 'Training', 'Final Review'];
const OFFBOARDING_STAGES = ['Exit Interview', 'Handover', 'Asset Return', 'Account Deactivation'];

const DAY_MS = 24 * 60 * 60 * 1000;
const addDays = (iso: string, days: number) => new Date(new Date(iso).getTime() + days * DAY_MS).toISOString().split('T')[0];

const deriveStage = (type: string, progress: number) => {
  const stages = type === 'Offboarding' ? OFFBOARDING_STAGES : ONBOARDING_STAGES;
  if (progress <= 0) return stages[0];
  const idx = Math.min(stages.length - 1, Math.floor((progress / 100) * stages.length));
  return stages[idx];
};

// Builds the default checklist for a new journey. Callers can still pass an
// explicit `checklist` to override this entirely (e.g. a custom template).
const buildDefaultTasks = (type: string, ctx: {
  employeeName: string;
  managerName?: string | null;
  startDate: string;
  targetDate?: string | null;
  handoverToName?: string | null;
  exitInterviewScheduled?: boolean;
  assetChecklist?: string[];
}) => {
  if (type === 'Offboarding') {
    const lastDay = ctx.targetDate || ctx.startDate;
    const tasks = [
      { title: 'Confirm Transition Plan with Manager', category: 'HR', assignedTo: ctx.managerName || 'Manager', dueDate: ctx.startDate },
      {
        title: ctx.exitInterviewScheduled ? 'Conduct Exit Interview' : 'Schedule Exit Interview',
        category: 'HR',
        assignedTo: 'HR Dept',
        dueDate: lastDay,
      },
      {
        title: ctx.handoverToName ? `Handover Responsibilities to ${ctx.handoverToName}` : 'Handover Responsibilities',
        category: 'Admin',
        assignedTo: ctx.employeeName,
        dueDate: lastDay,
      },
      { title: 'Revoke IT Access & Accounts', category: 'IT', assignedTo: 'IT Dept', dueDate: lastDay },
      { title: 'Process Final Settlement', category: 'Finance', assignedTo: 'Payroll Dept', dueDate: addDays(lastDay, 7) },
    ];
    for (const item of ctx.assetChecklist || []) {
      tasks.push({ title: `Return ${item}`, category: 'IT', assignedTo: ctx.employeeName, dueDate: lastDay });
    }
    return tasks;
  }

  return [
    { title: 'Sign Offer Letter', category: 'HR', assignedTo: ctx.employeeName, dueDate: ctx.startDate },
    { title: 'Complete Documentation (Bank, Tax, Pension)', category: 'HR', assignedTo: ctx.employeeName, dueDate: addDays(ctx.startDate, 2) },
    { title: 'Provision IT Accounts & Equipment', category: 'IT', assignedTo: 'IT Dept', dueDate: addDays(ctx.startDate, 1) },
    { title: 'HR Orientation Session', category: 'HR', assignedTo: 'HR Dept', dueDate: addDays(ctx.startDate, 3) },
    { title: 'Team Introduction', category: 'Admin', assignedTo: ctx.managerName || 'Manager', dueDate: addDays(ctx.startDate, 3) },
    { title: 'Benefits Enrollment', category: 'HR', assignedTo: ctx.employeeName, dueDate: addDays(ctx.startDate, 7) },
  ];
};

export class TransitionService {
  private db;

  constructor(dbBinding: D1Database) {
    this.db = drizzle(dbBinding, { schema });
  }

  private async withDetail(row: typeof schema.transitions.$inferSelect) {
    const [tasks, employee] = await Promise.all([
      this.db.query.transitionTasks.findMany({
        where: eq(schema.transitionTasks.transitionId, row.id),
        orderBy: (t: any, { asc: ascFn }: any) => [ascFn(t.sortOrder)],
      }),
      this.db.query.employees.findFirst({ where: eq(schema.employees.id, row.employeeId) }),
    ]);

    return {
      ...row,
      employeeName: employee ? [employee.name, employee.lastName].filter(Boolean).join(' ') : 'Unknown',
      employee: employee
        ? {
            id: employee.id,
            name: employee.name,
            lastName: employee.lastName,
            avatar: employee.avatar,
            role: employee.role,
            department: employee.department,
            status: employee.status,
          }
        : null,
      progress: tasks.length ? Math.round((tasks.filter((t: any) => t.status === 'completed').length / tasks.length) * 100) : 0,
      tasks,
    };
  }

  async getAllByCompany(companyId: string, type?: string) {
    const conditions = [eq(schema.transitions.companyId, companyId)];
    if (type) conditions.push(eq(schema.transitions.type, type));

    const rows = await this.db.query.transitions.findMany({
      where: and(...conditions),
      orderBy: (t: any, { desc }: any) => [desc(t.createdAt)],
    });

    return Promise.all(rows.map((row: any) => this.withDetail(row)));
  }

  async getById(companyId: string, id: string) {
    const row = await this.db.query.transitions.findFirst({
      where: and(eq(schema.transitions.companyId, companyId), eq(schema.transitions.id, id)),
    });
    if (!row) return null;
    return this.withDetail(row);
  }

  async create(companyId: string, actor: TransitionActor, payload: any) {
    const employee = await this.db.query.employees.findFirst({
      where: and(eq(schema.employees.id, payload.employeeId), eq(schema.employees.companyId, companyId)),
    });
    if (!employee) throw new Error('Employee not found');

    const type = payload.type === 'Offboarding' ? 'Offboarding' : 'Onboarding';
    const id = `TRN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const startDate = payload.startDate || new Date().toISOString().split('T')[0];
    const employeeName = [employee.name, employee.lastName].filter(Boolean).join(' ');

    const manager = employee.managerId
      ? await this.db.query.employees.findFirst({ where: eq(schema.employees.id, employee.managerId) })
      : null;

    const baseTasks = Array.isArray(payload.checklist) && payload.checklist.length > 0
      ? payload.checklist
      : buildDefaultTasks(type, {
          employeeName,
          managerName: manager ? [manager.name, manager.lastName].filter(Boolean).join(' ') : employee.managerName,
          startDate,
          targetDate: payload.targetDate,
          handoverToName: payload.handoverToName,
          exitInterviewScheduled: !!payload.exitInterviewScheduled,
          assetChecklist: payload.assetChecklist,
        });
    // Extra tasks an HR admin adds on top of the generated/override checklist
    // in the wizard's review step (e.g. a one-off task specific to this hire).
    const extraTasks = Array.isArray(payload.extraTasks) ? payload.extraTasks.filter((t: any) => t?.title?.trim()) : [];
    const taskDefs = [...baseTasks, ...extraTasks];

    await this.db.insert(schema.transitions).values({
      id,
      companyId,
      employeeId: employee.id,
      type,
      stage: deriveStage(type, 0),
      status: 'Active',
      startDate,
      targetDate: payload.targetDate || null,
      reason: type === 'Offboarding' ? payload.reason || null : null,
      handoverToId: payload.handoverToId || null,
      handoverToName: payload.handoverToName || null,
      exitInterviewScheduled: !!payload.exitInterviewScheduled,
      initiatedById: actor.id,
      initiatedByName: actor.name,
    });

    if (taskDefs.length > 0) {
      await this.db.insert(schema.transitionTasks).values(
        taskDefs.map((t: any, idx: number) => ({
          id: `TSK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          companyId,
          transitionId: id,
          title: t.title,
          category: t.category || 'Admin',
          assignedTo: t.assignedTo || null,
          dueDate: t.dueDate || null,
          status: 'pending',
          sortOrder: idx,
        }))
      );
    }

    // Reflect the journey on the employee record without stomping a status
    // that's already further along (e.g. re-running onboarding on an active
    // employee shouldn't demote them back to "onboarding").
    if (type === 'Onboarding' && employee.status !== 'active') {
      await this.db.update(schema.employees).set({ status: 'onboarding', updatedAt: new Date().toISOString() })
        .where(eq(schema.employees.id, employee.id));
    } else if (type === 'Offboarding' && employee.status !== 'terminated') {
      await this.db.update(schema.employees).set({ status: 'notice', updatedAt: new Date().toISOString() })
        .where(eq(schema.employees.id, employee.id));
    }

    const created = await this.db.query.transitions.findFirst({ where: eq(schema.transitions.id, id) });
    return this.withDetail(created!);
  }

  async addTask(companyId: string, transitionId: string, data: any) {
    const transition = await this.db.query.transitions.findFirst({
      where: and(eq(schema.transitions.companyId, companyId), eq(schema.transitions.id, transitionId)),
    });
    if (!transition) return null;

    const existing = await this.db.query.transitionTasks.findMany({ where: eq(schema.transitionTasks.transitionId, transitionId) });

    await this.db.insert(schema.transitionTasks).values({
      id: `TSK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      companyId,
      transitionId,
      title: data.title,
      category: data.category || 'Admin',
      assignedTo: data.assignedTo || null,
      dueDate: data.dueDate || null,
      status: 'pending',
      sortOrder: existing.length,
    });

    return this.recompute(companyId, transitionId);
  }

  async setTaskStatus(companyId: string, transitionId: string, taskId: string, status: 'pending' | 'completed') {
    const task = await this.db.query.transitionTasks.findFirst({
      where: and(
        eq(schema.transitionTasks.id, taskId),
        eq(schema.transitionTasks.companyId, companyId),
        eq(schema.transitionTasks.transitionId, transitionId)
      ),
    });
    if (!task) return null;

    await this.db.update(schema.transitionTasks)
      .set({ status, completedAt: status === 'completed' ? new Date().toISOString() : null })
      .where(eq(schema.transitionTasks.id, taskId));

    return this.recompute(companyId, transitionId);
  }

  // Recomputes stage/progress/status from the current task list and keeps
  // the linked employee's status in sync when a journey completes.
  private async recompute(companyId: string, transitionId: string) {
    const transition = await this.db.query.transitions.findFirst({
      where: and(eq(schema.transitions.companyId, companyId), eq(schema.transitions.id, transitionId)),
    });
    if (!transition) return null;
    if (transition.status === 'Cancelled') return this.withDetail(transition);

    const tasks = await this.db.query.transitionTasks.findMany({ where: eq(schema.transitionTasks.transitionId, transitionId) });
    const total = tasks.length;
    const completed = tasks.filter((t: any) => t.status === 'completed').length;
    const progress = total ? Math.round((completed / total) * 100) : 0;
    const isComplete = total > 0 && completed === total;
    const wasComplete = transition.status === 'Completed';

    await this.db.update(schema.transitions)
      .set({
        stage: deriveStage(transition.type, progress),
        status: isComplete ? 'Completed' : 'Active',
        completedAt: isComplete ? (transition.completedAt || new Date().toISOString()) : null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.transitions.id, transitionId));

    if (isComplete && !wasComplete) {
      const employee = await this.db.query.employees.findFirst({ where: eq(schema.employees.id, transition.employeeId) });
      if (employee) {
        if (transition.type === 'Onboarding' && employee.status === 'onboarding') {
          await this.db.update(schema.employees).set({ status: 'active', updatedAt: new Date().toISOString() })
            .where(eq(schema.employees.id, employee.id));
        } else if (transition.type === 'Offboarding' && employee.status !== 'terminated') {
          await this.db.update(schema.employees).set({ status: 'terminated', updatedAt: new Date().toISOString() })
            .where(eq(schema.employees.id, employee.id));
        }
      }
    }

    const updated = await this.db.query.transitions.findFirst({ where: eq(schema.transitions.id, transitionId) });
    return this.withDetail(updated!);
  }

  async cancel(companyId: string, id: string) {
    const transition = await this.db.query.transitions.findFirst({
      where: and(eq(schema.transitions.companyId, companyId), eq(schema.transitions.id, id)),
    });
    if (!transition) return null;

    await this.db.update(schema.transitions)
      .set({ status: 'Cancelled', cancelledAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
      .where(eq(schema.transitions.id, id));

    const updated = await this.db.query.transitions.findFirst({ where: eq(schema.transitions.id, id) });
    return this.withDetail(updated!);
  }
}
