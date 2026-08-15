import { Context } from 'hono';
import { AssessmentService } from '../../services/assessment.service';
import { ReviewCycleService, RATING_SCALE } from '../../services/reviewCycle.service';
import { AppEnv } from '../../types';

const parseAssessment = (asm: any) => ({
  ...asm,
  achievements: asm.achievements ? JSON.parse(asm.achievements) : [],
  challenges: asm.challenges ? JSON.parse(asm.challenges) : [],
  goalsProgress: asm.goalsProgress ? JSON.parse(asm.goalsProgress) : [],
  skillRatings: asm.skillRatings ? JSON.parse(asm.skillRatings) : [],
  developmentGoals: asm.developmentGoals ? JSON.parse(asm.developmentGoals) : [],
});

export const getMyAssessments = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.get('employeeId');

  if (!employeeId) {
    return c.json({ error: 'Unauthorized: No employee ID found' }, 401);
  }

  const service = new AssessmentService(c.env.DB);
  const assessments = await service.getEmployeeAssessments(companyId, employeeId);

  return c.json(assessments.map(parseAssessment));
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

  return c.json(parseAssessment(assessment));
};

export const createAssessment = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.get('employeeId');

  if (!employeeId) {
    return c.json({ error: 'Unauthorized: No employee ID found' }, 401);
  }

  const data = await c.req.json();

  // A cycle is always resolved server-side — employees never choose their
  // own cycle name. If HR hasn't set one up yet, fail clearly rather than
  // silently creating an assessment nothing else will ever find.
  if (!data.cycleId && !data.cycleName) {
    const cycleService = new ReviewCycleService(c.env.DB);
    const activeCycle = await cycleService.getActiveCycle(companyId);
    if (!activeCycle) {
      return c.json({ error: 'No review cycle is open yet — ask HR to start one.' }, 400);
    }
    data.cycleId = activeCycle.id;
    data.cycleName = activeCycle.name;
  }

  const service = new AssessmentService(c.env.DB);
  const assessment = await service.createAssessment(companyId, employeeId, data);

  return c.json(parseAssessment(assessment), 201);
};

export const updateAssessment = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const assessmentId = c.req.param('id');

  if (!assessmentId) {
    return c.json({ error: 'Assessment ID is required' }, 400);
  }

  const service = new AssessmentService(c.env.DB);
  const data = await c.req.json();
  const assessment = await service.updateAssessment(companyId, assessmentId, data);

  if (!assessment) {
    return c.json({ error: 'Assessment not found' }, 404);
  }

  return c.json(parseAssessment(assessment));
};

export const submitAssessment = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const assessmentId = c.req.param('id');

  if (!assessmentId) {
    return c.json({ error: 'Assessment ID is required' }, 400);
  }

  const service = new AssessmentService(c.env.DB);
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

  const service = new AssessmentService(c.env.DB);
  const assessment = await service.getActiveCycleAssessment(
    companyId,
    employeeId,
    activeCycle?.id || null,
    c.req.query('cycle') || undefined
  );

  if (!assessment) {
    return c.json({ assessment: null, activeCycle: activeCycle || null });
  }

  return c.json({ assessment: parseAssessment(assessment), activeCycle: activeCycle || null });
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
  const assessment = await service.submitManagerReview(companyId, assessmentId, employeeId, role, {
    managerRating,
    managerComment,
  });

  if (!assessment) {
    return c.json({ error: 'Assessment not found, or you are not this employee\'s manager' }, 404);
  }

  return c.json(parseAssessment(assessment));
};
