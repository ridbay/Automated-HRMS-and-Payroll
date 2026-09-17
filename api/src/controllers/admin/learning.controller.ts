import { Context } from 'hono';
import { LearningService } from '../../services/learning.service';

export class AdminLearningController {
  static async createCourse(c: Context<any>) {
    const companyId = c.get('tenantId') || c.get('companyId');
    if (!companyId) return c.json({ error: 'Tenant not found' }, 400);

    const body = await c.req.json();
    if (!body.title || body.duration === undefined) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const learningService = new LearningService(c.env.DB);
    const course = await learningService.createCourse({
      companyId,
      ...body,
    });
    return c.json({ data: course }, 201);
  }

  static async getAllCourses(c: Context<any>) {
    const companyId = c.get('tenantId') || c.get('companyId');
    if (!companyId) return c.json({ error: 'Tenant not found' }, 400);

    const learningService = new LearningService(c.env.DB);
    const courses = await learningService.getAllCourses(companyId);
    return c.json({ data: courses });
  }

  static async getCourseById(c: Context<any>) {
    const companyId = c.get('tenantId') || c.get('companyId');
    if (!companyId) return c.json({ error: 'Tenant not found' }, 400);
    const courseId = c.req.param('id');
    if (!courseId) return c.json({ error: 'Course ID is required' }, 400);

    const learningService = new LearningService(c.env.DB);
    const course = await learningService.getCourseById(courseId, companyId);
    if (!course) return c.json({ error: 'Course not found' }, 404);
    
    return c.json({ data: course });
  }

  static async updateCourse(c: Context<any>) {
    const companyId = c.get('tenantId') || c.get('companyId');
    if (!companyId) return c.json({ error: 'Tenant not found' }, 400);
    const courseId = c.req.param('id');
    if (!courseId) return c.json({ error: 'Course ID is required' }, 400);
    const body = await c.req.json();

    const learningService = new LearningService(c.env.DB);
    const course = await learningService.updateCourse(courseId, companyId, body);
    if (!course) return c.json({ error: 'Course not found' }, 404);

    return c.json({ data: course });
  }

  static async deleteCourse(c: Context<any>) {
    const companyId = c.get('tenantId') || c.get('companyId');
    if (!companyId) return c.json({ error: 'Tenant not found' }, 400);
    const courseId = c.req.param('id');
    if (!courseId) return c.json({ error: 'Course ID is required' }, 400);

    const learningService = new LearningService(c.env.DB);
    const success = await learningService.deleteCourse(courseId, companyId);
    if (!success) return c.json({ error: 'Course not found' }, 404);

    return c.json({ success: true });
  }

  static async assignCourse(c: Context<any>) {
    const companyId = c.get('tenantId') || c.get('companyId');
    if (!companyId) return c.json({ error: 'Tenant not found' }, 400);
    const courseId = c.req.param('id');
    if (!courseId) return c.json({ error: 'Course ID is required' }, 400);
    const body = await c.req.json();

    if (!body.employeeIds || !Array.isArray(body.employeeIds)) {
      return c.json({ error: 'employeeIds array is required' }, 400);
    }

    const learningService = new LearningService(c.env.DB);
    
    // Validate course exists
    const course = await learningService.getCourseById(courseId, companyId);
    if (!course) return c.json({ error: 'Course not found' }, 404);

    const result = await learningService.assignCourse(courseId, body.employeeIds);
    return c.json({ data: result }, 201);
  }

  static async getCourseEnrollments(c: Context<any>) {
    const companyId = c.get('tenantId') || c.get('companyId');
    if (!companyId) return c.json({ error: 'Tenant not found' }, 400);
    const courseId = c.req.param('id');
    if (!courseId) return c.json({ error: 'Course ID is required' }, 400);

    const learningService = new LearningService(c.env.DB);
    const enrollments = await learningService.getCourseEnrollments(courseId);
    return c.json({ data: enrollments });
  }
}
