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
    const result = await learningService.assignCourse(courseId, companyId, body.employeeIds);
    if (!result) return c.json({ error: 'Course not found' }, 404);
    if ('error' in result && result.error) return c.json({ error: result.error }, 400);

    return c.json({ data: result }, 201);
  }

  static async getCourseEnrollments(c: Context<any>) {
    const companyId = c.get('tenantId') || c.get('companyId');
    if (!companyId) return c.json({ error: 'Tenant not found' }, 400);
    const courseId = c.req.param('id');
    if (!courseId) return c.json({ error: 'Course ID is required' }, 400);

    const learningService = new LearningService(c.env.DB);
    const enrollments = await learningService.getCourseEnrollments(courseId, companyId);
    if (enrollments === null) return c.json({ error: 'Course not found' }, 404);
    return c.json({ data: enrollments });
  }

  static async getOverview(c: Context<any>) {
    const companyId = c.get('tenantId') || c.get('companyId');
    if (!companyId) return c.json({ error: 'Tenant not found' }, 400);

    const learningService = new LearningService(c.env.DB);
    const overview = await learningService.getLMSOverview(companyId);
    return c.json({ data: overview });
  }

  static async unassignCourse(c: Context<any>) {
    const companyId = c.get('tenantId') || c.get('companyId');
    if (!companyId) return c.json({ error: 'Tenant not found' }, 400);
    const courseId = c.req.param('id');
    const enrollmentId = c.req.param('enrollmentId');
    if (!enrollmentId) return c.json({ error: 'Enrollment ID is required' }, 400);

    const learningService = new LearningService(c.env.DB);
    const result = await learningService.unassignCourse(enrollmentId, companyId, courseId);
    if (!result) return c.json({ error: 'Enrollment or course not found' }, 404);
    return c.json({ success: true });
  }

  static async assignByDepartment(c: Context<any>) {
    const companyId = c.get('tenantId') || c.get('companyId');
    if (!companyId) return c.json({ error: 'Tenant not found' }, 400);
    const courseId = c.req.param('id');
    if (!courseId) return c.json({ error: 'Course ID is required' }, 400);
    const body = await c.req.json();

    if (!body.department) {
      return c.json({ error: 'department is required' }, 400);
    }

    const learningService = new LearningService(c.env.DB);
    const result = await learningService.assignDepartment(courseId, companyId, body.department);
    return c.json({ data: result }, 201);
  }
}
