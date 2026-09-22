import { D1Database } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, inArray } from 'drizzle-orm';
import * as schema from '../db/schema';

const DAY_MS = 24 * 60 * 60 * 1000;

// `daysOpen` is stored but always recomputed on read from `dateOpened` so it
// stays accurate without needing a cron job to tick it forward.
const withComputedDaysOpen = <T extends { dateOpened: string }>(row: T) => {
  const opened = new Date(row.dateOpened).getTime();
  const daysOpen = Number.isFinite(opened)
    ? Math.max(0, Math.floor((Date.now() - opened) / DAY_MS))
    : 0;
  return { ...row, daysOpen };
};

export interface RequisitionActor {
  id: string;
  name: string;
  avatar?: string | null;
  role?: string;
}

export class RequisitionService {
  private db;

  constructor(dbBinding: D1Database) {
    this.db = drizzle(dbBinding, { schema });
  }

  // Real, server-computed candidate-per-stage counts (from the ATS
  // `candidates` table) instead of the zero-padded shape the frontend used
  // to fabricate client-side (src/api/client.ts's withEmptyPipeline) before
  // candidates existed. Queried directly here (both tables share the same
  // drizzle instance/schema) rather than via a separate AtsService instance,
  // to avoid re-deriving a raw D1Database binding out of an existing
  // drizzle wrapper.
  private async getPipelineCounts(companyId: string, requisitionIds: string[]) {
    const empty = { applied: 0, screening: 0, interview: 0, offer: 0, hired: 0 };
    const counts = new Map<string, typeof empty>();
    if (requisitionIds.length === 0) return counts;

    const candidateRows = await this.db.query.candidates.findMany({
      where: and(eq(schema.candidates.companyId, companyId), inArray(schema.candidates.requisitionId, requisitionIds)),
      columns: { requisitionId: true, status: true },
    });

    for (const c of candidateRows) {
      if (!c.requisitionId) continue;
      const bucket = counts.get(c.requisitionId) || { ...empty };
      if (c.status in bucket) (bucket as any)[c.status] += 1;
      counts.set(c.requisitionId, bucket);
    }
    return counts;
  }

  async getAllByCompany(companyId: string) {
    const rows = await this.db.query.jobRequisitions.findMany({
      where: eq(schema.jobRequisitions.companyId, companyId),
      orderBy: (jobRequisitions, { desc }) => [desc(jobRequisitions.createdAt)],
    });
    const empty = { applied: 0, screening: 0, interview: 0, offer: 0, hired: 0 };
    const counts = await this.getPipelineCounts(companyId, rows.map((r) => r.id));
    return rows.map((r) => ({ ...withComputedDaysOpen(r), applicantsByStage: counts.get(r.id) || empty }));
  }

  async getPendingByCompany(companyId: string) {
    const rows = await this.db.query.jobRequisitions.findMany({
      where: and(
        eq(schema.jobRequisitions.companyId, companyId),
        eq(schema.jobRequisitions.status, 'Pending Approval')
      ),
      orderBy: (jobRequisitions: any, { asc }: any) => [asc(jobRequisitions.createdAt)],
    });
    return rows.map(withComputedDaysOpen);
  }

  async getMineByCompany(companyId: string, employeeId: string) {
    const rows = await this.db.query.jobRequisitions.findMany({
      where: and(
        eq(schema.jobRequisitions.companyId, companyId),
        eq(schema.jobRequisitions.requestedById, employeeId)
      ),
      orderBy: (jobRequisitions: any, { desc }: any) => [desc(jobRequisitions.createdAt)],
    });
    return rows.map(withComputedDaysOpen);
  }

  async create(companyId: string, requester: RequisitionActor, data: any) {
    const id = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
    const today = new Date().toISOString().split('T')[0];
    // HR Admin / Super Admin can open a position directly without a separate
    // approval step; Managers (and anyone else) go through the review queue.
    const autoApprove = requester.role === 'SUPER_ADMIN' || requester.role === 'HR_ADMIN';
    const nowIso = new Date().toISOString();

    const result = await this.db
      .insert(schema.jobRequisitions)
      .values({
        id,
        companyId,
        title: data.title,
        department: data.department,
        location: data.location,
        employmentType: data.employmentType || null,
        hiringManager: data.hiringManager || requester.name,
        managerAvatar: data.managerAvatar || requester.avatar || null,
        priority: data.priority || 'Medium',
        status: autoApprove ? 'Open' : 'Pending Approval',
        dateOpened: today,
        targetHireDate: data.targetHireDate || today,
        daysOpen: 0,
        justification: data.justification || null,
        budgetRange: data.budgetRange || null,
        requestedById: requester.id,
        requestedByName: requester.name,
        reviewedById: autoApprove ? requester.id : null,
        reviewedByName: autoApprove ? requester.name : null,
        reviewedAt: autoApprove ? nowIso : null,
        isPubliclyListed: data.isPubliclyListed === false ? false : true,
      })
      .returning();

    return withComputedDaysOpen(result[0]);
  }

  async approve(companyId: string, id: string, reviewer: RequisitionActor) {
    const nowIso = new Date().toISOString();
    const result = await this.db
      .update(schema.jobRequisitions)
      .set({
        status: 'Open',
        // The position is "opened" as of the approval, so time-to-fill tracking
        // starts here rather than at the original request date.
        dateOpened: nowIso.split('T')[0],
        reviewedById: reviewer.id,
        reviewedByName: reviewer.name,
        reviewedAt: nowIso,
        rejectionReason: null,
      })
      .where(and(eq(schema.jobRequisitions.companyId, companyId), eq(schema.jobRequisitions.id, id)))
      .returning();

    return result[0] ? withComputedDaysOpen(result[0]) : null;
  }

  async reject(companyId: string, id: string, reviewer: RequisitionActor, reason?: string) {
    const nowIso = new Date().toISOString();
    const result = await this.db
      .update(schema.jobRequisitions)
      .set({
        status: 'Rejected',
        reviewedById: reviewer.id,
        reviewedByName: reviewer.name,
        reviewedAt: nowIso,
        rejectionReason: reason || null,
      })
      .where(and(eq(schema.jobRequisitions.companyId, companyId), eq(schema.jobRequisitions.id, id)))
      .returning();

    return result[0] ? withComputedDaysOpen(result[0]) : null;
  }

  async updateStatus(companyId: string, id: string, status: string) {
    const result = await this.db
      .update(schema.jobRequisitions)
      .set({ status })
      .where(and(eq(schema.jobRequisitions.companyId, companyId), eq(schema.jobRequisitions.id, id)))
      .returning();

    return result[0] ? withComputedDaysOpen(result[0]) : null;
  }

  async remove(companyId: string, id: string) {
    const result = await this.db
      .delete(schema.jobRequisitions)
      .where(and(eq(schema.jobRequisitions.companyId, companyId), eq(schema.jobRequisitions.id, id)))
      .returning();

    return result[0] || null;
  }
}
