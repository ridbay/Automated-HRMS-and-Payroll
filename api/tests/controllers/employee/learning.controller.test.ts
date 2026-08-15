import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmployeeLearningController } from '../../../../src/controllers/employee/learning.controller';
import { LearningService } from '../../../../src/services/learning.service';

vi.mock('../../../../src/services/learning.service');

describe('Employee Learning Controller', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    LearningService.prototype.getMyCourses = vi.fn().mockResolvedValue([{ enrollment: { id: 'e1' }, course: { title: 'React Basics' } }]);
    LearningService.prototype.updateProgress = vi.fn().mockResolvedValue({ id: 'e1', progress: 50 });

    mockContext = {
      get: vi.fn((key: string) => {
        if (key === 'user') return { sub: 'emp1' };
        return null;
      }),
      req: {
        param: vi.fn().mockReturnValue('e1'),
        json: vi.fn().mockResolvedValue({ progress: 50 }),
      },
      json: vi.fn((data, status) => ({ data, status })),
      env: { DB: {} },
    };
  });

  it('should get my courses', async () => {
    const res = await EmployeeLearningController.getMyCourses(mockContext);
    expect(res.data.data).toHaveLength(1);
    expect(res.data.data[0].course.title).toBe('React Basics');
  });

  it('should update course progress', async () => {
    const res = await EmployeeLearningController.updateCourseProgress(mockContext);
    expect(res.data.data.progress).toBe(50);
  });
});
