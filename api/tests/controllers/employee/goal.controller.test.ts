import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as goalController from '../../../src/controllers/employee/goal.controller';
import { GoalService } from '../../../src/services/goal.service';

vi.mock('../../../src/services/goal.service');

describe('Employee Goal Controller', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    GoalService.prototype.getMyGoals = vi.fn();
    GoalService.prototype.createGoal = vi.fn();
    GoalService.prototype.updateGoalProgress = vi.fn();
    GoalService.prototype.getTeamGoals = vi.fn();
    GoalService.prototype.getMyObjectives = vi.fn();

    mockContext = {
      req: {
        query: vi.fn(),
        param: vi.fn(),
        json: vi.fn(),
      },
      env: { DB: {} },
      get: vi.fn(),
      json: vi.fn((data, status) => ({ data, status })),
    };
  });

  it('getMyGoals should fetch goals', async () => {
    mockContext.get.mockReturnValue('comp-1');
    (GoalService.prototype.getMyGoals as any).mockResolvedValue([{ id: 'g-1' }]);

    await goalController.getMyGoals(mockContext);
    expect(GoalService.prototype.getMyGoals).toHaveBeenCalled();
  });

  it('createGoal should create', async () => {
    mockContext.get.mockReturnValue('comp-1');
    mockContext.req.json.mockResolvedValue({ title: 'Goal' });
    (GoalService.prototype.createGoal as any).mockResolvedValue({ id: 'g-1' });

    const res = await goalController.createGoal(mockContext);
    expect(GoalService.prototype.createGoal).toHaveBeenCalled();
    expect(res.status).toBe(201);
  });
});
