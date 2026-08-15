import { Context } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and } from 'drizzle-orm';
import * as schema from '../../db/schema';
import { AppEnv } from '../../types';
import { AssessmentService } from '../../services/assessment.service';
import { ReviewCycleService, ratingScore } from '../../services/reviewCycle.service';
import { GoalService } from '../../services/goal.service';

// A single call backing the employee's personal "Analytics" dashboard: their
// own rating, goal completion, recognition counts, active cycle status, and
// (if they manage anyone) how many team reviews are waiting on them.
export const getMyPerformanceSummary = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.get('employeeId');
  if (!employeeId) {
    return c.json({ error: 'Unauthorized: No employee ID found' }, 401);
  }

  const db = drizzle(c.env.DB, { schema });
  const cycleService = new ReviewCycleService(c.env.DB);
  const assessmentService = new AssessmentService(c.env.DB);
  const goalService = new GoalService(c.env.DB);

  const [activeCycle, myAssessments, goalStats, teamPending] = await Promise.all([
    cycleService.getActiveCycle(companyId),
    assessmentService.getEmployeeAssessments(companyId, employeeId),
    goalService.getCompletionStats(companyId, [employeeId]),
    assessmentService.getTeamPendingAssessments(companyId, employeeId),
  ]);

  // Latest rated assessment (manager rating wins over self rating when both exist).
  const rated = myAssessments
    .map((a) => ({ a, score: ratingScore(a.managerRating || a.selfRating) }))
    .filter((x) => x.score !== null)
    .sort((x, y) => new Date(y.a.updatedAt).getTime() - new Date(x.a.updatedAt).getTime());
  const latestScore = rated[0]?.score ?? null;

  const myCycleAssessment = activeCycle
    ? myAssessments.find((a) => a.cycleId === activeCycle.id || a.cycleName === activeCycle.name)
    : undefined;

  const [sentCount, receivedCount] = await Promise.all([
    db.select().from(schema.feedbacks).where(and(eq(schema.feedbacks.companyId, companyId), eq(schema.feedbacks.fromEmployeeId, employeeId))).all(),
    db.select().from(schema.feedbacks).where(and(eq(schema.feedbacks.companyId, companyId), eq(schema.feedbacks.toEmployeeId, employeeId))).all(),
  ]);

  return c.json({
    avgRating: latestScore,
    goalCompletionRate: goalStats.completionRate,
    totalGoals: goalStats.total,
    completedGoals: goalStats.completed,
    shoutoutsSent: sentCount.length,
    shoutoutsReceived: receivedCount.length,
    activeCycle: activeCycle || null,
    myCycleStatus: myCycleAssessment?.status || null,
    pendingTeamReviews: teamPending.length,
  });
};
