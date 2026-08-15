import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as performanceController from './performance.controller';
import { AssessmentService } from '../../services/assessment.service';
import { ReviewCycleService } from '../../services/reviewCycle.service';
import { GoalService } from '../../services/goal.service';
import { PeerReviewService } from '../../services/peerReview.service';

vi.mock('../../services/assessment.service');
vi.mock('../../services/reviewCycle.service');
vi.mock('../../services/goal.service');
vi.mock('../../services/peerReview.service');
vi.mock('drizzle-orm/d1', () => ({
  drizzle: vi.fn(() => ({
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn().mockResolvedValue([{ id: 'ass-1' }])
        }))
      }))
    })),
    insert: vi.fn(() => ({
      values: vi.fn().mockResolvedValue({})
    }))
  }))
}));

describe('Admin Performance Controller', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockContext = {
      req: {
        param: vi.fn(),
        json: vi.fn(),
        query: vi.fn(),
      },
      env: { DB: {} },
      get: vi.fn((k: string) => {
        if (k === 'companyId') return 'comp-1';
        return undefined;
      }),
      json: vi.fn((data, status) => ({ data, status })),
    };
  });

  it('getEmployeeAssessments should return assessments', async () => {
    mockContext.req.param.mockReturnValue('emp-1');
    const res = await performanceController.getEmployeeAssessments(mockContext);
    expect(res.data).toEqual([{ id: 'ass-1' }]);
  });
});
