import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as feedbackController from './feedback.controller';

vi.mock('drizzle-orm/d1', () => ({
  drizzle: vi.fn(() => ({
    insert: vi.fn(() => ({
      values: vi.fn().mockResolvedValue({})
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue([{ id: 'fb-1' }])
          }))
        }))
      }))
    }))
  }))
}));

describe('Employee Feedback Controller', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

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

  it('sendShoutout should send', async () => {
    mockContext.get.mockImplementation((k: string) => {
      if (k === 'companyId') return 'comp-1';
      if (k === 'employeeId') return 'emp-1';
    });
    mockContext.req.json.mockResolvedValue({ toEmployeeName: 'Bob', toEmployeeId: 'emp-2', type: 'kudos', message: 'Good job' });

    const res = await feedbackController.sendShoutout(mockContext);
    expect(res.status).toBe(201);
  });
});
