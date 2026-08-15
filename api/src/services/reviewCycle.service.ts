import { D1Database } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, desc, asc } from 'drizzle-orm';
import * as schema from '../db/schema';

// The canonical 5-point rating scale used across self-assessments, manager
// reviews, peer/upward reviews, and company-wide analytics — keeping this in
// one place is what lets the distribution chart bucket ratings consistently
// everywhere.
export const RATING_SCALE = [
  { value: 'unsatisfactory', label: 'Unsatisfactory', score: 1 },
  { value: 'needs_improvement', label: 'Needs Improvement', score: 2 },
  { value: 'meets_expectations', label: 'Meets Expectations', score: 3 },
  { value: 'exceeds_expectations', label: 'Exceeds Expectations', score: 4 },
  { value: 'exceptional', label: 'Exceptional', score: 5 },
] as const;

export const ratingScore = (rating?: string | null): number | null => {
  if (!rating) return null;
  const found = RATING_SCALE.find((r) => r.value === rating);
  return found ? found.score : null;
};

// The standard named-stage timeline every cycle gets by default, modeled on
// a real multi-stage appraisal window: KPI/evidence + self-review happen
// first, then peer/upward reviews, then manager review, then a distinct
// "release" step that gates when employees can see their manager's rating.
export type StageKey =
  | 'kickoff'
  | 'select_peers'
  | 'peer_approval'
  | 'self_review'
  | 'peer_upward_review'
  | 'manager_review'
  | 'manager_review_release'
  | 'final_submission';

export const STAGE_DEFS: { key: StageKey; name: string }[] = [
  { key: 'kickoff', name: 'Kickoff' },
  { key: 'select_peers', name: 'Select Peer Reviewers' },
  { key: 'peer_approval', name: 'Manager Approves Peer Reviewers' },
  { key: 'self_review', name: 'Self-Review' },
  { key: 'peer_upward_review', name: 'Peer & Upward Reviews' },
  { key: 'manager_review', name: 'Manager Review' },
  { key: 'manager_review_release', name: 'Manager Reviews Available' },
  { key: 'final_submission', name: 'Review & Final Submission' },
];

export class ReviewCycleService {
  private db;

  constructor(dbBinding: D1Database) {
    this.db = drizzle(dbBinding, { schema });
  }

  async getCycles(companyId: string) {
    return this.db.query.reviewCycles.findMany({
      where: eq(schema.reviewCycles.companyId, companyId),
      orderBy: [desc(schema.reviewCycles.createdAt)],
    });
  }

  async getCycleById(companyId: string, id: string) {
    return this.db.query.reviewCycles.findFirst({
      where: and(eq(schema.reviewCycles.id, id), eq(schema.reviewCycles.companyId, companyId)),
    });
  }

  // The one cycle self-assessments/manager reviews are created against.
  // Falls back to the most recently created upcoming cycle so an admin who
  // hasn't explicitly activated one yet still has somewhere for drafts to land.
  async getActiveCycle(companyId: string) {
    const active = await this.db.query.reviewCycles.findFirst({
      where: and(eq(schema.reviewCycles.companyId, companyId), eq(schema.reviewCycles.status, 'active')),
      orderBy: [desc(schema.reviewCycles.createdAt)],
    });
    if (active) return active;

    return this.db.query.reviewCycles.findFirst({
      where: and(eq(schema.reviewCycles.companyId, companyId), eq(schema.reviewCycles.status, 'upcoming')),
      orderBy: [desc(schema.reviewCycles.createdAt)],
    });
  }

  async createCycle(companyId: string, data: any) {
    if (!data.name || !String(data.name).trim()) {
      throw new Error('Cycle name is required');
    }
    const id = `CYC-${crypto.randomUUID().split('-')[0].toUpperCase()}`;
    const result = await this.db
      .insert(schema.reviewCycles)
      .values({
        id,
        companyId,
        name: String(data.name).trim(),
        status: data.status === 'active' ? 'active' : 'upcoming',
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        selfReviewDueDate: data.selfReviewDueDate || null,
        managerReviewDueDate: data.managerReviewDueDate || null,
      })
      .returning();

    await this.createDefaultStages(companyId, id);

    // Enforce a single active cycle per company.
    if (result[0].status === 'active') {
      await this.deactivateOthers(companyId, id);
    }

    return result[0];
  }

  async updateCycle(companyId: string, id: string, data: any) {
    const updateData: any = { updatedAt: new Date().toISOString() };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.startDate !== undefined) updateData.startDate = data.startDate;
    if (data.endDate !== undefined) updateData.endDate = data.endDate;
    if (data.selfReviewDueDate !== undefined) updateData.selfReviewDueDate = data.selfReviewDueDate;
    if (data.managerReviewDueDate !== undefined) updateData.managerReviewDueDate = data.managerReviewDueDate;

    const result = await this.db
      .update(schema.reviewCycles)
      .set(updateData)
      .where(and(eq(schema.reviewCycles.id, id), eq(schema.reviewCycles.companyId, companyId)))
      .returning();

    return result[0];
  }

  private async deactivateOthers(companyId: string, exceptId: string) {
    const others = await this.db.query.reviewCycles.findMany({
      where: and(eq(schema.reviewCycles.companyId, companyId), eq(schema.reviewCycles.status, 'active')),
    });
    for (const cycle of others) {
      if (cycle.id === exceptId) continue;
      await this.db
        .update(schema.reviewCycles)
        .set({ status: 'closed', updatedAt: new Date().toISOString() })
        .where(eq(schema.reviewCycles.id, cycle.id));
    }
  }

  async setStatus(companyId: string, id: string, status: 'upcoming' | 'active' | 'closed') {
    const cycle = await this.getCycleById(companyId, id);
    if (!cycle) return null;

    const result = await this.db
      .update(schema.reviewCycles)
      .set({ status, updatedAt: new Date().toISOString() })
      .where(and(eq(schema.reviewCycles.id, id), eq(schema.reviewCycles.companyId, companyId)))
      .returning();

    if (status === 'active') {
      await this.deactivateOthers(companyId, id);
    }

    return result[0];
  }

  async deleteCycle(companyId: string, id: string) {
    const inUse = await this.db.query.assessments.findFirst({
      where: and(eq(schema.assessments.cycleId, id), eq(schema.assessments.companyId, companyId)),
    });
    if (inUse) {
      throw new Error('Cannot delete a cycle that already has assessments logged against it — close it instead');
    }
    await this.db.delete(schema.cycleStages).where(and(eq(schema.cycleStages.cycleId, id), eq(schema.cycleStages.companyId, companyId)));
    const result = await this.db
      .delete(schema.reviewCycles)
      .where(and(eq(schema.reviewCycles.id, id), eq(schema.reviewCycles.companyId, companyId)))
      .returning();
    return result[0];
  }

  // ---------------------------------------------------------------------
  // Stage timeline
  // ---------------------------------------------------------------------

  async createDefaultStages(companyId: string, cycleId: string) {
    const rows = STAGE_DEFS.map((def, idx) => ({
      id: `STG-${crypto.randomUUID().split('-')[0].toUpperCase()}`,
      companyId,
      cycleId,
      key: def.key,
      name: def.name,
      order: idx,
      startDate: null as string | null,
      dueDate: null as string | null,
    }));
    await this.db.insert(schema.cycleStages).values(rows);
    return rows;
  }

  async getStages(companyId: string, cycleId: string) {
    return this.db.query.cycleStages.findMany({
      where: and(eq(schema.cycleStages.companyId, companyId), eq(schema.cycleStages.cycleId, cycleId)),
      orderBy: [asc(schema.cycleStages.order)],
    });
  }

  async getStageByKey(companyId: string, cycleId: string, key: string) {
    return this.db.query.cycleStages.findFirst({
      where: and(
        eq(schema.cycleStages.companyId, companyId),
        eq(schema.cycleStages.cycleId, cycleId),
        eq(schema.cycleStages.key, key)
      ),
    });
  }

  async updateStage(companyId: string, cycleId: string, stageId: string, data: { startDate?: string | null; dueDate?: string | null }) {
    const updateData: any = { updatedAt: new Date().toISOString() };
    if (data.startDate !== undefined) updateData.startDate = data.startDate || null;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate || null;

    const result = await this.db
      .update(schema.cycleStages)
      .set(updateData)
      .where(and(
        eq(schema.cycleStages.id, stageId),
        eq(schema.cycleStages.cycleId, cycleId),
        eq(schema.cycleStages.companyId, companyId)
      ))
      .returning();

    return result[0];
  }

  private todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  // Whether writes for a given stage should be accepted right now. No dates
  // configured on the stage (or the stage/cycle doesn't have one) => open,
  // so cycles that don't use the granular timeline behave exactly as they
  // did before this existed.
  async isStageOpen(companyId: string, cycleId: string, key: StageKey): Promise<boolean> {
    const stage = await this.getStageByKey(companyId, cycleId, key);
    if (!stage || (!stage.startDate && !stage.dueDate)) return true;
    const today = this.todayStr();
    if (stage.startDate && today < stage.startDate) return false;
    if (stage.dueDate && today > stage.dueDate) return false;
    return true;
  }

  // Whether a manager's rating should be visible to the employee it belongs
  // to yet. Released once the "manager_review_release" stage has started;
  // if that stage has no start date configured, treat it as released
  // immediately (matches behavior before release-gating existed).
  async isManagerReviewReleased(companyId: string, cycleId: string): Promise<boolean> {
    const stage = await this.getStageByKey(companyId, cycleId, 'manager_review_release');
    if (!stage || !stage.startDate) return true;
    return this.todayStr() >= stage.startDate;
  }
}
