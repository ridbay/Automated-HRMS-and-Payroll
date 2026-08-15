import { Context } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, desc } from 'drizzle-orm';
import * as schema from '../../db/schema';
import { AssessmentService } from '../../services/assessment.service';
import { ReviewCycleService, RATING_SCALE, StageKey } from '../../services/reviewCycle.service';
import { AppEnv } from '../../types';

const parseAssessment = (asm: any) => ({
  ...asm,
  achievements: asm.achievements ? JSON.parse(asm.achievements) : [],
  challenges: asm.challenges ? JSON.parse(asm.challenges) : [],
  goalsProgress: asm.goalsProgress ? JSON.parse(asm.goalsProgress) : [],
  skillRatings: asm.skillRatings ? JSON.parse(asm.skillRatings) : [],
  developmentGoals: asm.developmentGoals ? JSON.parse(asm.developmentGoals) : [],
});

const isAdminRole = (role?: string) => role === 'SUPER_ADMIN' || role === 'HR_ADMIN';

// Strips the manager's rating/comment from an employee-facing assessment
// until the cycle's "manager review release" stage has started. The row
// itself stays `completed` internally the moment the manager submits —
// this only controls what the employee sees.
const withReleaseGating = (asm: any, released: boolean) => {
  if (released || asm.status !== 'completed') {
    return { ...asm, managerReviewReleased: true };
  }
  const { managerRating, managerComment, managerId, reviewedAt, ...rest } = asm;
  return { ...rest, managerReviewReleased: false };
};

// Builds a clear "window closed" error including the configured dates, so
// the employee/manager understands why the write was rejected rather than
// getting a bare 403.
const stageClosedError = async (cycleService: ReviewCycleService, companyId: string, cycleId: string, key: StageKey, label: string) => {
  const stage = await cycleService.getStageByKey(companyId, cycleId, key);
  if (stage?.startDate || stage?.dueDate) {
    return `The ${label} window is ${stage.startDate && new Date() < new Date(stage.startDate) ? 'not open yet' : 'closed'} (${stage.startDate || '—'} to ${stage.dueDate || '—'}).`;
  }
  return `The ${label} window is currently closed.`;
};

export const getMyAssessments = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.get('employeeId');

  if (!employeeId) {
    return c.json({ error: 'Unauthorized: No employee ID found' }, 401);
  }

  const service = new AssessmentService(c.env.DB);
  const cycleService = new ReviewCycleService(c.env.DB);
  const assessments = await service.getEmployeeAssessments(companyId, employeeId);

  // Release gating is per-cycle, so resolve it once per distinct cycle
  // rather than once per assessment row.
  const releaseByCycle = new Map<string, boolean>();
  const withGating = async (asm: any) => {
    if (!asm.cycleId) return { ...parseAssessment(asm), managerReviewReleased: true };
    if (!releaseByCycle.has(asm.cycleId)) {
      releaseByCycle.set(asm.cycleId, await cycleService.isManagerReviewReleased(companyId, asm.cycleId));
    }
    return withReleaseGating(parseAssessment(asm), releaseByCycle.get(asm.cycleId)!);
  };

  const results = await Promise.all(assessments.map(withGating));
  return c.json(results);
};

export const getAssessment = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const assessmentId = c.req.param('id');

  if (!assessmentId) {
    return c.json({ error: 'Assessment ID is required' }, 400);
  }

  const service = new AssessmentService(c.env.DB);
  const assessment = await service.getAssessmentById(companyId, assessmentId);

  if (!assessment) {
    return c.json({ error: 'Assessment not found' }, 404);
  }

  const cycleService = new ReviewCycleService(c.env.DB);
  const released = assessment.cycleId ? await cycleService.isManagerReviewReleased(companyId, assessment.cycleId) : true;

  return c.json(withReleaseGating(parseAssessment(assessment), released));
};

export const createAssessment = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.get('employeeId');
  const role = c.get('role');

  if (!employeeId) {
    return c.json({ error: 'Unauthorized: No employee ID found' }, 401);
  }

  const data = await c.req.json();
  const cycleService = new ReviewCycleService(c.env.DB);

  // A cycle is always resolved server-side — employees never choose their
  // own cycle name. If HR hasn't set one up yet, fail clearly rather than
  // silently creating an assessment nothing else will ever find.
  if (!data.cycleId && !data.cycleName) {
    const activeCycle = await cycleService.getActiveCycle(companyId);
    if (!activeCycle) {
      return c.json({ error: 'No review cycle is open yet — ask HR to start one.' }, 400);
    }
    data.cycleId = activeCycle.id;
    data.cycleName = activeCycle.name;
  }

  if (!isAdminRole(role) && data.cycleId) {
    const open = await cycleService.isStageOpen(companyId, data.cycleId, 'self_review');
    if (!open) {
      return c.json({ error: await stageClosedError(cycleService, companyId, data.cycleId, 'self_review', 'self-review') }, 403);
    }
  }

  const service = new AssessmentService(c.env.DB);
  const assessment = await service.createAssessment(companyId, employeeId, data);

  return c.json(parseAssessment(assessment), 201);
};

export const updateAssessment = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const role = c.get('role');
  const assessmentId = c.req.param('id');

  if (!assessmentId) {
    return c.json({ error: 'Assessment ID is required' }, 400);
  }

  const service = new AssessmentService(c.env.DB);
  const existing = await service.getAssessmentById(companyId, assessmentId);
  if (!existing) {
    return c.json({ error: 'Assessment not found' }, 404);
  }

  if (!isAdminRole(role) && existing.cycleId) {
    const cycleService = new ReviewCycleService(c.env.DB);
    const open = await cycleService.isStageOpen(companyId, existing.cycleId, 'self_review');
    if (!open) {
      return c.json({ error: await stageClosedError(cycleService, companyId, existing.cycleId, 'self_review', 'self-review') }, 403);
    }
  }

  const data = await c.req.json();
  const assessment = await service.updateAssessment(companyId, assessmentId, data);

  if (!assessment) {
    return c.json({ error: 'Assessment not found' }, 404);
  }

  return c.json(parseAssessment(assessment));
};

export const submitAssessment = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const role = c.get('role');
  const assessmentId = c.req.param('id');

  if (!assessmentId) {
    return c.json({ error: 'Assessment ID is required' }, 400);
  }

  const service = new AssessmentService(c.env.DB);
  const existing = await service.getAssessmentById(companyId, assessmentId);
  if (!existing) {
    return c.json({ error: 'Assessment not found' }, 404);
  }

  if (!isAdminRole(role) && existing.cycleId) {
    const cycleService = new ReviewCycleService(c.env.DB);
    const open = await cycleService.isStageOpen(companyId, existing.cycleId, 'self_review');
    if (!open) {
      return c.json({ error: await stageClosedError(cycleService, companyId, existing.cycleId, 'self_review', 'self-review') }, 403);
    }
  }

  const assessment = await service.submitAssessment(companyId, assessmentId);

  if (!assessment) {
    return c.json({ error: 'Assessment not found' }, 404);
  }

  return c.json(parseAssessment(assessment));
};

export const getActiveCycleAssessment = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.get('employeeId');

  if (!employeeId) {
    return c.json({ error: 'Unauthorized: No employee ID found' }, 401);
  }

  const cycleService = new ReviewCycleService(c.env.DB);
  const activeCycle = await cycleService.getActiveCycle(companyId);
  const stages = activeCycle ? await cycleService.getStages(companyId, activeCycle.id) : [];
  const cyclePayload = activeCycle ? { ...activeCycle, stages } : null;

  const service = new AssessmentService(c.env.DB);
  const assessment = await service.getActiveCycleAssessment(
    companyId,
    employeeId,
    activeCycle?.id || null,
    c.req.query('cycle') || undefined
  );

  if (!assessment) {
    return c.json({ assessment: null, activeCycle: cyclePayload });
  }

  const released = activeCycle ? await cycleService.isManagerReviewReleased(companyId, activeCycle.id) : true;
  return c.json({ assessment: withReleaseGating(parseAssessment(assessment), released), activeCycle: cyclePayload });
};

// The caller's review queue: direct reports' self-assessments awaiting a
// manager rating. Naturally self-scoped by employeeId — a non-manager simply
// has no direct reports and gets an empty list back.
export const getTeamPendingAssessments = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.get('employeeId');

  if (!employeeId) {
    return c.json({ error: 'Unauthorized: No employee ID found' }, 401);
  }

  const service = new AssessmentService(c.env.DB);
  const pending = await service.getTeamPendingAssessments(companyId, employeeId);
  return c.json({ pending, ratingScale: RATING_SCALE });
};

// A manager's own team rating distribution / pending-review count — the
// manager-scoped counterpart to the admin's company-wide analytics.
export const getTeamAnalytics = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.get('employeeId');
  if (!employeeId) {
    return c.json({ error: 'Unauthorized: No employee ID found' }, 401);
  }

  const service = new AssessmentService(c.env.DB);
  const analytics = await service.getTeamAnalytics(companyId, employeeId);
  return c.json(analytics);
};

// KPI/appraisal evidence attached to a self-assessment — visible to the
// owner, the owner's manager (so they can validate scores against it before
// the Manager Review window), and admins.
export const getAssessmentEvidence = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const callerId = c.get('employeeId');
  const role = c.get('role');
  const assessmentId = c.req.param('id');
  if (!callerId) return c.json({ error: 'Unauthorized: No employee ID found' }, 401);
  if (!assessmentId) return c.json({ error: 'Assessment ID is required' }, 400);

  const service = new AssessmentService(c.env.DB);
  const assessment = await service.getAssessmentById(companyId, assessmentId);
  if (!assessment) return c.json({ error: 'Assessment not found' }, 404);

  if (!isAdminRole(role) && assessment.employeeId !== callerId) {
    const db = drizzle(c.env.DB, { schema });
    const owner = await db.query.employees.findFirst({ where: eq(schema.employees.id, assessment.employeeId) });
    if (!owner || owner.managerId !== callerId) {
      return c.json({ error: 'Forbidden' }, 403);
    }
  }

  const db = drizzle(c.env.DB, { schema });
  const evidence = await db
    .select()
    .from(schema.employeeDocuments)
    .where(and(eq(schema.employeeDocuments.companyId, companyId), eq(schema.employeeDocuments.linkedAssessmentId, assessmentId)))
    .orderBy(desc(schema.employeeDocuments.createdAt))
    .all();

  return c.json(evidence);
};

export const submitManagerReview = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.get('employeeId');
  const role = c.get('role');
  const assessmentId = c.req.param('id');

  if (!employeeId) {
    return c.json({ error: 'Unauthorized: No employee ID found' }, 401);
  }
  if (!assessmentId) {
    return c.json({ error: 'Assessment ID is required' }, 400);
  }

  const { managerRating, managerComment } = await c.req.json();
  if (!managerRating) {
    return c.json({ error: 'A manager rating is required' }, 400);
  }

  const service = new AssessmentService(c.env.DB);

  if (!isAdminRole(role)) {
    const existing = await service.getAssessmentById(companyId, assessmentId);
    if (existing?.cycleId) {
      const cycleService = new ReviewCycleService(c.env.DB);
      const open = await cycleService.isStageOpen(companyId, existing.cycleId, 'manager_review');
      if (!open) {
        return c.json({ error: await stageClosedError(cycleService, companyId, existing.cycleId, 'manager_review', 'manager review') }, 403);
      }
    }
  }

  const assessment = await service.submitManagerReview(companyId, assessmentId, employeeId, role, {
    managerRating,
    managerComment,
  });

  if (!assessment) {
    return c.json({ error: 'Assessment not found, or you are not this employee\'s manager' }, 404);
  }

  return c.json(parseAssessment(assessment));
};
