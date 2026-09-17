import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as performanceSummaryController from '../../../src/controllers/employee/performanceSummary.controller';
import { ReviewCycleService } from '../../../src/services/reviewCycle.service';
import { AssessmentService } from '../../../src/services/assessment.service';
import { GoalService } from '../../../src/services/goal.service';

vi.mock('../../../src/services/reviewCycle.service');
vi.mock('../../../src/services/assessment.service');
vi.mock('../../../src/services/goal.service');

vi.mock('drizzle-orm/d1', () => ({
  drizzle: vi.fn(() => ({
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn().mockResolvedValue([{ id: 'perf-1' }]),
          all: vi.fn().mockResolvedValue([{ id: 'perf-1' }])
        }))
      }))
    })),
  }))
}));

describe('Employee Performance Summary Controller', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    ReviewCycleService.prototype.getActiveCycle = vi.fn();
    AssessmentService.prototype.getEmployeeAssessments = vi.fn();
    AssessmentService.prototype.getTeamPendingAssessments = vi.fn();
    GoalService.prototype.getCompletionStats = vi.fn();

    mockContext = {
      req: {
        param: vi.fn(),
        json: vi.fn(),
        query: vi.fn(),
      },
      env: { DB: {} },
      get: vi.fn((k: string) => {
        if (k === 'companyId') return 'comp-1';
        if (k === 'employeeId') return 'emp-1';
        return undefined;
      }),
      json: vi.fn((data, status) => ({ data, status })),
    };
  });

  it('getPerformanceSummary should return performance summary', async () => {
    (ReviewCycleService.prototype.getActiveCycle as any).mockResolvedValue({ id: 'cyc-1' });
    (AssessmentService.prototype.getEmployeeAssessments as any).mockResolvedValue([{ id: 'ass-1' }]);
    (AssessmentService.prototype.getTeamPendingAssessments as any).mockResolvedValue([{ id: 'ass-2' }]);
    (GoalService.prototype.getCompletionStats as any).mockResolvedValue({ total: 1, completed: 0, completionRate: 0 });
    const res = await performanceSummaryController.getMyPerformanceSummary(mockContext);
    expect(res).toBeDefined();
  });
});
