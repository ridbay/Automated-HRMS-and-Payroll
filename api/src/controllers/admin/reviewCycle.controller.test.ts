import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as reviewCycleController from './reviewCycle.controller';
import { ReviewCycleService } from '../../services/reviewCycle.service';

vi.mock('../../services/reviewCycle.service');

describe('Admin Review Cycle Controller', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    ReviewCycleService.prototype.getCycles = vi.fn();
    ReviewCycleService.prototype.createCycle = vi.fn();
    ReviewCycleService.prototype.updateCycle = vi.fn();
    ReviewCycleService.prototype.activateCycle = vi.fn();
    ReviewCycleService.prototype.closeCycle = vi.fn();

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

  it('getCycles should fetch cycles', async () => {
    mockContext.get.mockReturnValue('comp-1');
    (ReviewCycleService.prototype.getCycles as any).mockResolvedValue([{ id: 'cyc-1' }]);

    await reviewCycleController.getCycles(mockContext);
    expect(ReviewCycleService.prototype.getCycles).toHaveBeenCalled();
  });

  it('createCycle should create cycle', async () => {
    mockContext.get.mockReturnValue('comp-1');
    mockContext.req.json.mockResolvedValue({ name: '2023 Review' });
    (ReviewCycleService.prototype.createCycle as any).mockResolvedValue({ id: 'cyc-1' });

    const res = await reviewCycleController.createCycle(mockContext);
    expect(ReviewCycleService.prototype.createCycle).toHaveBeenCalledWith('comp-1', { name: '2023 Review' });
    expect(res.status).toBe(201);
  });
});
