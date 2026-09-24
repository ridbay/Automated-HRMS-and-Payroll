import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminLearningController } from '../../../src/controllers/admin/learning.controller';
import { LearningService } from '../../../src/services/learning.service';

vi.mock('../../../src/services/learning.service');

describe('Admin Learning Controller', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    LearningService.prototype.createCourse = vi.fn().mockResolvedValue({ id: 'c1', title: 'React Basics' });
    LearningService.prototype.getAllCourses = vi.fn().mockResolvedValue([{ id: 'c1', title: 'React Basics' }]);
    LearningService.prototype.getCourseById = vi.fn().mockResolvedValue({ id: 'c1', title: 'React Basics' });
    LearningService.prototype.updateCourse = vi.fn().mockResolvedValue({ id: 'c1', title: 'React Advanced' });
    LearningService.prototype.deleteCourse = vi.fn().mockResolvedValue(true);
    LearningService.prototype.assignCourse = vi.fn().mockResolvedValue({ success: true, count: 1 });
    LearningService.prototype.getCourseEnrollments = vi.fn().mockResolvedValue([{ enrollment: {}, employee: {} }]);

    mockContext = {
      get: vi.fn().mockReturnValue('company1'),
      req: {
        param: vi.fn().mockReturnValue('c1'),
        json: vi.fn().mockResolvedValue({ title: 'React Basics', duration: 120, employeeIds: ['emp1'] }),
      },
      json: vi.fn((data, status) => ({ data, status })),
      env: { DB: {} },
    };
  });

  it('should return all courses', async () => {
    const res: any = await AdminLearningController.getAllCourses(mockContext);
    expect(res.data.data).toHaveLength(1);
    expect(res.data.data[0].title).toBe('React Basics');
  });

  it('should create a course', async () => {
    const res: any = await AdminLearningController.createCourse(mockContext);
    expect(res.status).toBe(201);
    expect(res.data.data.title).toBe('React Basics');
  });

  it('should get course by id', async () => {
    const res: any = await AdminLearningController.getCourseById(mockContext);
    expect(res.data.data.title).toBe('React Basics');
  });

  it('should update a course', async () => {
    const res: any = await AdminLearningController.updateCourse(mockContext);
    expect(res.data.data.title).toBe('React Advanced');
  });

  it('should assign a course', async () => {
    const res: any = await AdminLearningController.assignCourse(mockContext);
    expect(res.status).toBe(201);
    expect(res.data.data.success).toBe(true);
  });

  it('should delete a course', async () => {
    const res: any = await AdminLearningController.deleteCourse(mockContext);
    expect(res.data.success).toBe(true);
  });

  it('should get LMS overview', async () => {
    LearningService.prototype.getLMSOverview = vi.fn().mockResolvedValue({ stats: { totalCourses: 1 }, courses: [], enrollments: [] });
    const res: any = await AdminLearningController.getOverview(mockContext);
    expect(res.data.data.stats.totalCourses).toBe(1);
  });

  it('should unassign a course', async () => {
    LearningService.prototype.unassignCourse = vi.fn().mockResolvedValue({ success: true });
    mockContext.req.param.mockReturnValue('enr1');
    const res: any = await AdminLearningController.unassignCourse(mockContext);
    expect(res.data.success).toBe(true);
  });

  it('should assign course by department', async () => {
    LearningService.prototype.assignDepartment = vi.fn().mockResolvedValue({ success: true, count: 5 });
    mockContext.req.json.mockResolvedValue({ department: 'Engineering' });
    const res: any = await AdminLearningController.assignByDepartment(mockContext);
    expect(res.status).toBe(201);
    expect(res.data.data.count).toBe(5);
  });
});
