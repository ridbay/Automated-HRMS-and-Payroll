import { D1Database } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, desc, inArray } from 'drizzle-orm';
import * as schema from '../db/schema';

const ADMIN_ROLES = ['SUPER_ADMIN', 'HR_ADMIN'];

export class PeerReviewService {
  private db;

  constructor(dbBinding: D1Database) {
    this.db = drizzle(dbBinding, { schema });
  }

  // Employee nominates one or more colleagues to peer-review them this cycle.
  async nominate(companyId: string, cycleId: string, revieweeId: string, peerIds: string[]) {
    const uniquePeers = [...new Set(peerIds)].filter((id) => id && id !== revieweeId);
    if (uniquePeers.length === 0) {
      throw new Error('Select at least one peer reviewer');
    }

    // Don't re-nominate someone already nominated (any non-rejected state) this cycle.
    const existing = await this.db.query.peerReviews.findMany({
      where: and(
        eq(schema.peerReviews.companyId, companyId),
        eq(schema.peerReviews.cycleId, cycleId),
        eq(schema.peerReviews.revieweeId, revieweeId),
        eq(schema.peerReviews.direction, 'peer')
      ),
    });
    const alreadyNominated = new Set(existing.filter((r) => r.status !== 'rejected').map((r) => r.reviewerId));
    const toInsert = uniquePeers.filter((id) => !alreadyNominated.has(id));

    if (toInsert.length === 0) return [];

    const rows = toInsert.map((peerId) => ({
      id: `PR-${crypto.randomUUID().split('-')[0].toUpperCase()}`,
      companyId,
      cycleId,
      revieweeId,
      reviewerId: peerId,
      direction: 'peer' as const,
      status: 'nominated' as const,
      nominatedById: revieweeId,
    }));
    await this.db.insert(schema.peerReviews).values(rows);
    return rows;
  }

  // Everyone I've nominated to review me this cycle, with their status.
  async getMyNominations(companyId: string, revieweeId: string, cycleId: string) {
    return this.db
      .select({
        id: schema.peerReviews.id,
        reviewerId: schema.peerReviews.reviewerId,
        reviewerName: schema.employees.name,
        reviewerLastName: schema.employees.lastName,
        avatar: schema.employees.avatar,
        status: schema.peerReviews.status,
        submittedAt: schema.peerReviews.submittedAt,
      })
      .from(schema.peerReviews)
      .innerJoin(schema.employees, eq(schema.peerReviews.reviewerId, schema.employees.id))
      .where(and(
        eq(schema.peerReviews.companyId, companyId),
        eq(schema.peerReviews.revieweeId, revieweeId),
        eq(schema.peerReviews.cycleId, cycleId),
        eq(schema.peerReviews.direction, 'peer')
      ))
      .orderBy(desc(schema.peerReviews.createdAt))
      .all();
  }

  // Nominations awaiting this manager's approval, for their direct reports.
  async getTeamPendingApprovals(companyId: string, managerId: string) {
    const reviewee = schema.employees;
    return this.db
      .select({
        id: schema.peerReviews.id,
        revieweeId: schema.peerReviews.revieweeId,
        revieweeName: reviewee.name,
        revieweeLastName: reviewee.lastName,
        reviewerId: schema.peerReviews.reviewerId,
        cycleId: schema.peerReviews.cycleId,
        createdAt: schema.peerReviews.createdAt,
      })
      .from(schema.peerReviews)
      .innerJoin(reviewee, eq(schema.peerReviews.revieweeId, reviewee.id))
      .where(and(
        eq(schema.peerReviews.companyId, companyId),
        eq(schema.peerReviews.status, 'nominated'),
        eq(schema.peerReviews.direction, 'peer'),
        eq(reviewee.managerId, managerId)
      ))
      .orderBy(desc(schema.peerReviews.createdAt))
      .all();
  }

  // Reviewer names attached separately (small helper) since the query above
  // already joins on reviewee — callers that need reviewer identity too can
  // batch-resolve via this.
  async getReviewerNames(companyId: string, reviewerIds: string[]): Promise<Map<string, { name: string; lastName: string }>> {
    const map = new Map<string, { name: string; lastName: string }>();
    if (reviewerIds.length === 0) return map;
    const rows = await this.db.query.employees.findMany({
      where: and(eq(schema.employees.companyId, companyId), inArray(schema.employees.id, reviewerIds)),
    });
    for (const r of rows) map.set(r.id, { name: r.name, lastName: r.lastName });
    return map;
  }

  async approveNomination(companyId: string, id: string, approverId: string, approverRole: string | undefined, approve: boolean) {
    const nomination = await this.db.query.peerReviews.findFirst({
      where: and(eq(schema.peerReviews.id, id), eq(schema.peerReviews.companyId, companyId)),
    });
    if (!nomination) return null;

    const isAdmin = !!approverRole && ADMIN_ROLES.includes(approverRole);
    if (!isAdmin) {
      const reviewee = await this.db.query.employees.findFirst({ where: eq(schema.employees.id, nomination.revieweeId) });
      if (!reviewee || reviewee.managerId !== approverId) return null;
    }

    const result = await this.db
      .update(schema.peerReviews)
      .set({
        status: approve ? 'approved' : 'rejected',
        approvedById: approverId,
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.peerReviews.id, id))
      .returning();

    return result[0];
  }

  // Peer/upward reviews this employee has been asked to write (approved,
  // not yet submitted) — their "Reviews To Write" queue.
  async getAssignedToMe(companyId: string, reviewerId: string, cycleId: string) {
    return this.db
      .select({
        id: schema.peerReviews.id,
        revieweeId: schema.peerReviews.revieweeId,
        revieweeName: schema.employees.name,
        revieweeLastName: schema.employees.lastName,
        avatar: schema.employees.avatar,
        direction: schema.peerReviews.direction,
        status: schema.peerReviews.status,
      })
      .from(schema.peerReviews)
      .innerJoin(schema.employees, eq(schema.peerReviews.revieweeId, schema.employees.id))
      .where(and(
        eq(schema.peerReviews.companyId, companyId),
        eq(schema.peerReviews.reviewerId, reviewerId),
        eq(schema.peerReviews.cycleId, cycleId),
        eq(schema.peerReviews.status, 'approved')
      ))
      .orderBy(desc(schema.peerReviews.createdAt))
      .all();
  }

  async submitReview(companyId: string, id: string, reviewerId: string, data: { rating: string; strengths?: string; improvements?: string; comment?: string }) {
    const review = await this.db.query.peerReviews.findFirst({
      where: and(eq(schema.peerReviews.id, id), eq(schema.peerReviews.companyId, companyId)),
    });
    if (!review || review.reviewerId !== reviewerId || review.status !== 'approved') return null;

    const result = await this.db
      .update(schema.peerReviews)
      .set({
        rating: data.rating,
        strengths: data.strengths || null,
        improvements: data.improvements || null,
        comment: data.comment || null,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.peerReviews.id, id))
      .returning();

    return result[0];
  }

  // Upward review: no nomination/approval gate — an employee reviews their
  // own manager directly. Upserts so re-submitting during the window edits
  // the same row instead of piling up duplicates.
  async submitUpwardReview(companyId: string, cycleId: string, employeeId: string, managerId: string, data: { rating: string; strengths?: string; improvements?: string; comment?: string }) {
    const existing = await this.db.query.peerReviews.findFirst({
      where: and(
        eq(schema.peerReviews.companyId, companyId),
        eq(schema.peerReviews.cycleId, cycleId),
        eq(schema.peerReviews.reviewerId, employeeId),
        eq(schema.peerReviews.revieweeId, managerId),
        eq(schema.peerReviews.direction, 'upward')
      ),
    });

    const values = {
      rating: data.rating,
      strengths: data.strengths || null,
      improvements: data.improvements || null,
      comment: data.comment || null,
      status: 'submitted' as const,
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existing) {
      const result = await this.db.update(schema.peerReviews).set(values).where(eq(schema.peerReviews.id, existing.id)).returning();
      return result[0];
    }

    const id = `UR-${crypto.randomUUID().split('-')[0].toUpperCase()}`;
    const result = await this.db.insert(schema.peerReviews).values({
      id,
      companyId,
      cycleId,
      revieweeId: managerId,
      reviewerId: employeeId,
      direction: 'upward',
      ...values,
    }).returning();
    return result[0];
  }

  // Submitted reviews written about me (anonymized on the reviewer side by
  // the caller/controller — this just returns the raw rows).
  async getReceivedReviews(companyId: string, revieweeId: string, cycleId: string) {
    return this.db.query.peerReviews.findMany({
      where: and(
        eq(schema.peerReviews.companyId, companyId),
        eq(schema.peerReviews.revieweeId, revieweeId),
        eq(schema.peerReviews.cycleId, cycleId),
        eq(schema.peerReviews.status, 'submitted')
      ),
    });
  }

  async getCompanyReviews(companyId: string, cycleId?: string) {
    const conditions = [eq(schema.peerReviews.companyId, companyId)];
    if (cycleId) conditions.push(eq(schema.peerReviews.cycleId, cycleId));

    const reviewee = schema.employees;
    return this.db
      .select({
        id: schema.peerReviews.id,
        revieweeId: schema.peerReviews.revieweeId,
        revieweeName: reviewee.name,
        revieweeLastName: reviewee.lastName,
        reviewerId: schema.peerReviews.reviewerId,
        direction: schema.peerReviews.direction,
        status: schema.peerReviews.status,
        rating: schema.peerReviews.rating,
        submittedAt: schema.peerReviews.submittedAt,
        createdAt: schema.peerReviews.createdAt,
      })
      .from(schema.peerReviews)
      .innerJoin(reviewee, eq(schema.peerReviews.revieweeId, reviewee.id))
      .where(and(...conditions))
      .orderBy(desc(schema.peerReviews.createdAt))
      .all();
  }
}
