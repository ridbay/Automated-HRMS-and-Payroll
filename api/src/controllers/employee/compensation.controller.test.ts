import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as compensationController from './compensation.controller';

vi.mock('drizzle-orm/d1', () => ({
  drizzle: vi.fn(() => ({
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn().mockResolvedValue([{ id: 'comp-1' }])
        }))
      }))
    })),
  }))
}));

describe('Employee Compensation Controller', () => {
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
        if (k === 'employeeId') return 'emp-1';
        if (k === 'db') return {
          select: vi.fn(() => ({
            from: vi.fn(() => ({
              where: vi.fn(() => ({
                orderBy: vi.fn().mockResolvedValue([{ id: 'comp-1' }])
              }))
            }))
          }))
        };
        return undefined;
      }),
      json: vi.fn((data, status) => ({ data, status })),
    };
  });

  it('getMyCompensation should return compensation data', async () => {
    const res = await compensationController.getMyCompensation(mockContext);
    expect(res.data).toBeDefined();
  });
});
