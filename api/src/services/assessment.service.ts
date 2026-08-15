import { D1Database } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, desc, inArray } from 'drizzle-orm';
import * as schema from '../db/schema';
import { ratingScore, RATING_SCALE } from './reviewCycle.service';

const ADMIN_ROLES = ['SUPER_ADMIN', 'HR_ADMIN'];

export class AssessmentService {
  private db;

  constructor(dbBinding: D1Database) {
    this.db = drizzle(dbBinding, { schema });
  }

  async getEmployeeAssessments(companyId: string, employeeId: string) {
    return this.db.query.assessments.findMany({
      where: and(
        eq(schema.assessments.companyId, companyId),
        eq(schema.assessments.employeeId, employeeId)
      ),
      orderBy: [desc(schema.assessments.createdAt)]
    });
  }

  async getAssessmentById(companyId: string, assessmentId: string) {
    return this.db.query.assessments.findFirst({
      where: and(
        eq(schema.assessments.id, assessmentId),
        eq(schema.assessments.companyId, companyId)
      )
    });
  }

  async createAssessment(companyId: string, employeeId: string, data: any) {
    const id = `ASM-${crypto.randomUUID().split('-')[0].toUpperCase()}`;

    const result = await this.db.insert(schema.assessments).values({
      id,
      companyId,
      employeeId,
      cycleId: data.cycleId || null,
      cycleName: data.cycleName,
      status: 'draft',
      achievements: JSON.stringify(data.achievements || []),
      challenges: JSON.stringify(data.challenges || []),
      goalsProgress: JSON.stringify(data.goalsProgress || []),
      skillRatings: JSON.stringify(data.skillRatings || []),
      selfRating: data.selfRating || null,
      selfComment: data.selfComment || null,
      developmentGoals: JSON.stringify(data.developmentGoals || []),
    }).returning();

    return result[0];
  }

  async updateAssessment(companyId: string, assessmentId: string, data: any) {
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (data.achievements !== undefined) updateData.achievements = JSON.stringify(data.achievements);
    if (data.challenges !== undefined) updateData.challenges = JSON.stringify(data.challenges);
    if (data.goalsProgress !== undefined) updateData.goalsProgress = JSON.stringify(data.goalsProgress);
    if (data.skillRatings !== undefined) updateData.skillRatings = JSON.stringify(data.skillRatings);
    if (data.selfRating !== undefined) updateData.selfRating = data.selfRating;
    if (data.selfComment !== undefined) updateData.selfComment = data.selfComment;
    if (data.developmentGoals !== undefined) updateData.developmentGoals = JSON.stringify(data.developmentGoals);

    const result = await this.db
      .update(schema.assessments)
      .set(updateData)
      .where(and(
        eq(schema.assessments.id, assessmentId),
        eq(schema.assessments.companyId, companyId)
      ))
      .returning();

    return result[0];
  }

  async submitAssessment(companyId: string, assessmentId: string) {
    const result = await this.db
      .update(schema.assessments)
      .set({
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .where(and(
        eq(schema.assessments.id, assessmentId),
        eq(schema.assessments.companyId, companyId)
      ))
      .returning();

    return result[0];
  }

  // Resolves by cycleId when we have one (the normal path — every new
  // assessment is created against the company's active cycle). Falls back to
  // matching on the free-text cycleName for legacy rows created before the
  // cycleId column existed.
  async getActiveCycleAssessment(companyId: string, employeeId: string, cycleId: string | null, cycleName?: string) {
    if (cycleId) {
      const byId = await this.db.query.assessments.findFirst({
        where: and(
          eq(schema.assessments.companyId, companyId),
          eq(schema.assessments.employeeId, employeeId),
          eq(schema.assessments.cycleId, cycleId)
        ),
      });
      if (byId) return byId;
    }
    if (!cycleName) return undefined;
    return this.db.query.assessments.findFirst({
      where: and(
        eq(schema.assessments.companyId, companyId),
        eq(schema.assessments.employeeId, employeeId),
        eq(schema.assessments.cycleName, cycleName)
      )
    });
  }

  // Self-assessments from this manager's direct reports that are waiting on
  // a manager rating — the manager's review queue.
  async getTeamPendingAssessments(companyId: string, managerId: string) {
    return this.db
      .select({
        id: schema.assessments.id,
        employeeId: schema.assessments.employeeId,
        employeeName: schema.employees.name,
        employeeLastName: schema.employees.lastName,
        avatar: schema.employees.avatar,
        department: schema.employees.department,
        cycleName: schema.assessments.cycleName,
        cycleId: schema.assessments.cycleId,
        status: schema.assessments.status,
        selfRating: schema.assessments.selfRating,
        selfComment: schema.assessments.selfComment,
        submittedAt: schema.assessments.submittedAt,
      })
      .from(schema.assessments)
      .innerJoin(schema.employees, eq(schema.assessments.employeeId, schema.employees.id))
      .where(
        and(
          eq(schema.assessments.companyId, companyId),
          eq(schema.employees.managerId, managerId),
          inArray(schema.assessments.status, ['submitted', 'under_review'])
        )
      )
      .orderBy(desc(schema.assessments.submittedAt))
      .all();
  }

  // A manager may only review their own direct reports; SUPER_ADMIN/HR_ADMIN
  // may review (or override) anyone's. Returns null when unauthorized so the
  // controller can turn that into a 403 without leaking whether the id exists.
  async submitManagerReview(
    companyId: string,
    assessmentId: string,
    reviewerId: string,
    reviewerRole: string | undefined,
    data: { managerRating: string; managerComment?: string }
  ) {
    const assessment = await this.getAssessmentById(companyId, assessmentId);
    if (!assessment) return null;

    const isAdmin = !!reviewerRole && ADMIN_ROLES.includes(reviewerRole);
    if (!isAdmin) {
      const employee = await this.db.query.employees.findFirst({
        where: eq(schema.employees.id, assessment.employeeId),
      });
      if (!employee || employee.managerId !== reviewerId) return null;
    }

    const result = await this.db
      .update(schema.assessments)
      .set({
        managerRating: data.managerRating,
        managerComment: data.managerComment || null,
        managerId: reviewerId,
        status: 'completed',
        reviewedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(schema.assessments.id, assessmentId), eq(schema.assessments.companyId, companyId)))
      .returning();

    return result[0];
  }

  // Company-wide browse for HR/Admin, optionally scoped to a cycle/status.
  async getCompanyAssessments(companyId: string, filters: { cycleId?: string; status?: string } = {}) {
    const conditions = [eq(schema.assessments.companyId, companyId)];
    if (filters.cycleId) conditions.push(eq(schema.assessments.cycleId, filters.cycleId));
    if (filters.status) conditions.push(eq(schema.assessments.status, filters.status));

    return this.db
      .select({
        id: schema.assessments.id,
        employeeId: schema.assessments.employeeId,
        employeeName: schema.employees.name,
        employeeLastName: schema.employees.lastName,
        avatar: schema.employees.avatar,
        department: schema.employees.department,
        cycleName: schema.assessments.cycleName,
        cycleId: schema.assessments.cycleId,
        status: schema.assessments.status,
        selfRating: schema.assessments.selfRating,
        managerRating: schema.assessments.managerRating,
        managerComment: schema.assessments.managerComment,
        submittedAt: schema.assessments.submittedAt,
        reviewedAt: schema.assessments.reviewedAt,
        createdAt: schema.assessments.createdAt,
      })
      .from(schema.assessments)
      .innerJoin(schema.employees, eq(schema.assessments.employeeId, schema.employees.id))
      .where(and(...conditions))
      .orderBy(desc(schema.assessments.createdAt))
      .all();
  }

  // Same shape as getCompanyAnalytics, but scoped to a single manager's
  // direct reports for the manager-facing Team Performance view.
  async getTeamAnalytics(companyId: string, managerId: string) {
    const rows = await this.db
      .select({
        status: schema.assessments.status,
        selfRating: schema.assessments.selfRating,
        managerRating: schema.assessments.managerRating,
      })
      .from(schema.assessments)
      .innerJoin(schema.employees, eq(schema.assessments.employeeId, schema.employees.id))
      .where(and(eq(schema.assessments.companyId, companyId), eq(schema.employees.managerId, managerId)))
      .all();

    const distribution = RATING_SCALE.map((r) => ({ name: r.label, value: r.value, count: 0 }));
    let ratedCount = 0;
    let ratingSum = 0;

    for (const row of rows) {
      const score = ratingScore(row.managerRating || row.selfRating);
      if (score) {
        distribution[score - 1].count += 1;
        ratedCount += 1;
        ratingSum += score;
      }
    }

    return {
      totalAssessments: rows.length,
      pendingManagerReview: rows.filter((r) => r.status === 'submitted' || r.status === 'under_review').length,
      avgRating: ratedCount > 0 ? Math.round((ratingSum / ratedCount) * 10) / 10 : null,
      distribution,
    };
  }

  // Company-wide performance analytics for the HR/Admin dashboard, scoped to
  // a single cycle (defaults to whatever's active) so the numbers mean
  // something rather than blending every historical cycle together.
  async getCompanyAnalytics(companyId: string, cycleId?: string | null) {
    const conditions = [eq(schema.assessments.companyId, companyId)];
    if (cycleId) conditions.push(eq(schema.assessments.cycleId, cycleId));

    const rows = await this.db
      .select({
        status: schema.assessments.status,
        selfRating: schema.assessments.selfRating,
        managerRating: schema.assessments.managerRating,
      })
      .from(schema.assessments)
      .where(and(...conditions))
      .all();

    const distribution = RATING_SCALE.map((r) => ({ name: r.label, value: r.value, count: 0 }));
    let ratedCount = 0;
    let ratingSum = 0;
    let pendingManagerReview = 0;
    let submittedOrLater = 0;

    for (const row of rows) {
      const effectiveRating = row.managerRating || row.selfRating;
      const score = ratingScore(effectiveRating);
      if (score) {
        distribution[score - 1].count += 1;
        ratedCount += 1;
        ratingSum += score;
      }
      if (row.status === 'submitted' || row.status === 'under_review') pendingManagerReview += 1;
      if (row.status !== 'draft') submittedOrLater += 1;
    }

    return {
      totalAssessments: rows.length,
      submittedOrLater,
      pendingManagerReview,
      completedReviews: rows.filter((r) => r.status === 'completed').length,
      avgRating: ratedCount > 0 ? Math.round((ratingSum / ratedCount) * 10) / 10 : null,
      distribution,
    };
  }
}
