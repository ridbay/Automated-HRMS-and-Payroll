import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as trainingController from '../../../src/controllers/admin/training.controller';

vi.mock('drizzle-orm/d1', () => ({
  drizzle: vi.fn(() => ({
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn().mockResolvedValue([{ id: 'train-1' }])
        }))
      }))
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([{ id: 'train-1' }])
      }))
    }))
  }))
}));

describe('Admin Training Controller', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockContext = {
      req: {
        param: vi.fn(),
        json: vi.fn(),
      },
      env: { DB: {} },
      get: vi.fn((key: string) => {
        if (key === 'companyId') return 'comp-1';
        if (key === 'db') return {
          select: vi.fn(() => ({
            from: vi.fn(() => ({
              where: vi.fn(() => ({
                orderBy: vi.fn().mockResolvedValue([{ id: 'train-1' }])
              }))
            }))
          })),
          insert: vi.fn(() => ({
            values: vi.fn(() => ({
              returning: vi.fn().mockResolvedValue([{ id: 'train-1' }])
            }))
          }))
        };
      }),
      json: vi.fn((data, status) => ({ data, status })),
    };
  });

  it('getEmployeeTrainings should return trainings', async () => {
    mockContext.req.param.mockReturnValue('emp-1');
    const res = await trainingController.getEmployeeTrainings(mockContext);
    expect(res.data).toEqual([{ id: 'train-1' }]);
  });

  it('addEmployeeTraining should add training', async () => {
    mockContext.req.param.mockReturnValue('emp-1');
    mockContext.req.json.mockResolvedValue({ name: 'Course' });
    const res = await trainingController.addEmployeeTraining(mockContext);
    expect(res.data).toEqual({ id: 'train-1' });
  });
});
