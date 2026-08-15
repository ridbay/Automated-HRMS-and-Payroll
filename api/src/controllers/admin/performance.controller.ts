import { Context } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, desc } from 'drizzle-orm';
import { assessments } from '../../db/schema';
import { AssessmentService } from '../../services/assessment.service';
import { ReviewCycleService, RATING_SCALE } from '../../services/reviewCycle.service';
import { GoalService } from '../../services/goal.service';
import { PeerReviewService } from '../../services/peerReview.service';
import { AppEnv } from '../../types';

export const getEmployeeAssessments = async (c: Context<AppEnv>) => {
  try {
    const employeeId = c.req.param('id') as string;
    const companyId = c.get('companyId');
    const db = drizzle(c.env.DB);

    const records = await db
      .select()
      .from(assessments)
      .where(and(eq(assessments.employeeId, employeeId), eq(assessments.companyId, companyId)))
      .orderBy(desc(assessments.createdAt));

    return c.json(records);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

// HR/Admin logging a review directly from an employee's profile. If that
// employee already has a self-assessment on file for the given cycle that's
// awaiting a manager rating, this attaches the review to that same row
// instead of creating a disconnected duplicate; otherwise it backfills a new
// completed record (e.g. for a historical review with no self-assessment).
export const addEmployeeAssessment = async (c: Context<AppEnv>) => {
  try {
    const employeeId = c.req.param('id') as string;
    const companyId = c.get('companyId');
    const reviewerId = c.get('employeeId');
    const body = await c.req.json();

    const cycleService = new ReviewCycleService(c.env.DB);
    const service = new AssessmentService(c.env.DB);

    let cycleId: string | null = body.cycleId || null;
    let cycleName: string = body.cycleName || 'Mid-Year Review';
    if (!body.cycleId && !body.cycleName) {
      const active = await cycleService.getActiveCycle(companyId);
      if (active) {
        cycleId = active.id;
        cycleName = active.name;
      }
    }

    const existing = cycleId
      ? await service.getActiveCycleAssessment(companyId, employeeId, cycleId, cycleName)
      : undefined;

    if (existing && existing.status !== 'completed') {
      const updated = await service.submitManagerReview(companyId, existing.id, reviewerId!, c.get('role'), {
        managerRating: body.managerRating,
        managerComment: body.managerComment,
      });
      return c.json(updated);
    }

    // No pending self-assessment to attach to — log a standalone review.
    const db = drizzle(c.env.DB);
    const id = `ASSESS-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const newAssessment = await db.insert(assessments).values({
      id,
      companyId,
      employeeId,
      cycleId,
      cycleName,
      managerRating: body.managerRating,
      managerComment: body.managerComment,
      managerId: reviewerId,
      status: 'completed',
      reviewedAt: new Date().toISOString(),
    }).returning();

    return c.json(newAssessment[0]);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const getCompanyAssessments = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const cycleId = c.req.query('cycleId') || undefined;
  const status = c.req.query('status') || undefined;
  const service = new AssessmentService(c.env.DB);
  const rows = await service.getCompanyAssessments(companyId, { cycleId, status });
  return c.json({ assessments: rows, ratingScale: RATING_SCALE });
};

export const getCompanyAnalytics = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const cycleService = new ReviewCycleService(c.env.DB);
  const service = new AssessmentService(c.env.DB);

  const cycleId = c.req.query('cycleId');
  const cycle = cycleId
    ? await cycleService.getCycleById(companyId, cycleId)
    : await cycleService.getActiveCycle(companyId);

  const analytics = await service.getCompanyAnalytics(companyId, cycle?.id || null);

  const goalService = new GoalService(c.env.DB);
  const goalStats = await goalService.getCompletionStats(companyId);

  return c.json({ ...analytics, goalStats, cycle: cycle || null });
};

// Company-wide goals browse for HR/Admin — e.g. everyone's OKRs, or just the
// top-level 'company' scoped objectives set here to anchor alignment.
export const getCompanyGoals = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const scope = c.req.query('scope') || undefined;
  const departmentId = c.req.query('departmentId') || undefined;
  const service = new GoalService(c.env.DB);
  const rows = await service.getCompanyGoals(companyId, scope, departmentId);
  return c.json(rows.map((g: any) => ({ ...g, keyResults: g.keyResults ? JSON.parse(g.keyResults) : [] })));
};

// HR/Admin setting a top-level company or department objective for teams to
// align under. Department-scoped objectives must name which department they
// belong to — different departments can carry entirely different goals.
export const createCompanyGoal = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const creatorId = c.get('employeeId');
  const body = await c.req.json();

  if (!body.employeeOwnerId || !body.title) {
    return c.json({ error: 'employeeOwnerId and title are required' }, 400);
  }
  const scope = body.scope || 'company';
  if (scope === 'department' && !body.departmentId) {
    return c.json({ error: 'departmentId is required for a department-scoped objective' }, 400);
  }

  const service = new GoalService(c.env.DB);
  const { id } = await service.createGoal(
    companyId,
    body.employeeOwnerId,
    { ...body, scope },
    creatorId
  );
  return c.json({ id, message: 'Objective created' }, 201);
};

// Company-wide browse of 360 (peer + upward) reviews for HR/Admin.
export const getCompanyPeerReviews = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const cycleId = c.req.query('cycleId') || undefined;
  const service = new PeerReviewService(c.env.DB);
  const reviews = await service.getCompanyReviews(companyId, cycleId);
  return c.json({ reviews, ratingScale: RATING_SCALE });
};
