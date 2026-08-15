import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as transitionController from './transition.controller';
import { TransitionService } from '../../services/transition.service';

vi.mock('../../services/transition.service');

describe('Admin Transition Controller', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    TransitionService.prototype.getAllByCompany = vi.fn();
    TransitionService.prototype.getTransition = vi.fn();
    TransitionService.prototype.createTransition = vi.fn();

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

  it('getTransitions should return transitions', async () => {
    (TransitionService.prototype.getAllByCompany as any).mockResolvedValue([{ id: 'tran-1' }]);
    const res = await transitionController.getTransitions(mockContext);
    expect(TransitionService.prototype.getAllByCompany).toHaveBeenCalled();
  });
});
