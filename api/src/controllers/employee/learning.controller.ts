import { Context } from 'hono';
import { LearningService } from '../../services/learning.service';

export class EmployeeLearningController {
  static async getMyCourses(c: Context<any>) {
    const employeeId = c.get('user')?.sub || c.get('employeeId');
    if (!employeeId) return c.json({ error: 'Employee not found' }, 400);

    const learningService = new LearningService(c.env.DB);
    const courses = await learningService.getMyCourses(employeeId);
    return c.json({ data: courses });
  }

  static async updateCourseProgress(c: Context<any>) {
    const employeeId = c.get('user')?.sub || c.get('employeeId');
    if (!employeeId) return c.json({ error: 'Employee not found' }, 400);
    const enrollmentId = c.req.param('id');
    if (!enrollmentId) return c.json({ error: 'Enrollment ID is required' }, 400);
    const body = await c.req.json();

    if (body.progress === undefined) {
      return c.json({ error: 'progress is required' }, 400);
    }

    const learningService = new LearningService(c.env.DB);
    const enrollment = await learningService.updateProgress(enrollmentId, employeeId, body.progress);
    if (!enrollment) return c.json({ error: 'Enrollment not found' }, 404);

    return c.json({ data: enrollment });
  }

  static async getTeamCourses(c: Context<any>) {
    const employeeId = c.get('user')?.sub || c.get('employeeId');
    const companyId = c.get('tenantId') || c.get('companyId');
    if (!employeeId || !companyId) return c.json({ error: 'Missing employee or company context' }, 400);

    const learningService = new LearningService(c.env.DB);
    const teamCourses = await learningService.getTeamCourses(employeeId, companyId);
    return c.json({ data: teamCourses });
  }
}
