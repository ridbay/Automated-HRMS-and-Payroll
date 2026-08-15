import { eq, and } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { courses, courseEnrollments } from '../models/learning.model';
import { employees } from '../models/employee.model';
import { D1Database } from '@cloudflare/workers-types';
import * as schema from '../db/schema';

export class LearningService {
  private db;

  constructor(dbBinding: D1Database) {
    this.db = drizzle(dbBinding, { schema });
  }

  // --- Admin Methods ---

  async createCourse(data: {
    companyId: string;
    title: string;
    description?: string;
    url?: string;
    duration: number;
    status?: string;
  }) {
    const courseId = `CRS-${crypto.randomUUID().split('-')[0].toUpperCase()}`;
    
    await this.db.insert(courses).values({
      id: courseId,
      companyId: data.companyId,
      title: data.title,
      description: data.description,
      url: data.url,
      duration: data.duration,
      status: data.status || 'active',
      createdAt: new Date().toISOString(),
    });

    return this.getCourseById(courseId, data.companyId);
  }

  async getAllCourses(companyId: string) {
    return await this.db.select().from(courses).where(eq(courses.companyId, companyId));
  }

  async getCourseById(courseId: string, companyId: string) {
    const arr = await this.db
      .select()
      .from(courses)
      .where(and(eq(courses.id, courseId), eq(courses.companyId, companyId)));
    return arr.length > 0 ? arr[0] : null;
  }

  async updateCourse(courseId: string, companyId: string, data: Partial<typeof courses.$inferInsert>) {
    await this.db
      .update(courses)
      .set(data)
      .where(and(eq(courses.id, courseId), eq(courses.companyId, companyId)));
    return this.getCourseById(courseId, companyId);
  }

  async deleteCourse(courseId: string, companyId: string) {
    const course = await this.getCourseById(courseId, companyId);
    if (!course) return false;

    await this.db.delete(courseEnrollments).where(eq(courseEnrollments.courseId, courseId));
    await this.db.delete(courses).where(and(eq(courses.id, courseId), eq(courses.companyId, companyId)));
    return true;
  }

  async assignCourse(courseId: string, employeeIds: string[]) {
    if (employeeIds.length === 0) return { success: true };

    const records = employeeIds.map(empId => ({
      id: `CEN-${crypto.randomUUID().split('-')[0].toUpperCase()}`,
      courseId,
      employeeId: empId,
      status: 'assigned',
      enrolledAt: new Date().toISOString(),
      progress: 0
    }));

    await this.db.insert(courseEnrollments).values(records);
    return { success: true, count: records.length };
  }

  async getCourseEnrollments(courseId: string) {
    // Basic join between courseEnrollments and employees
    const results = await this.db
      .select({
        enrollment: courseEnrollments,
        employee: {
          id: employees.id,
          name: employees.name,
          lastName: employees.lastName,
          email: employees.email,
        }
      })
      .from(courseEnrollments)
      .leftJoin(employees, eq(courseEnrollments.employeeId, employees.id))
      .where(eq(courseEnrollments.courseId, courseId));

    return results;
  }

  // --- Employee Methods ---

  async getMyCourses(employeeId: string) {
    const results = await this.db
      .select({
        enrollment: courseEnrollments,
        course: courses
      })
      .from(courseEnrollments)
      .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
      .where(eq(courseEnrollments.employeeId, employeeId));

    return results;
  }

  async updateProgress(enrollmentId: string, employeeId: string, progress: number) {
    const status = progress >= 100 ? 'completed' : progress > 0 ? 'in_progress' : 'assigned';
    const completedAt = progress >= 100 ? new Date().toISOString() : null;

    await this.db
      .update(courseEnrollments)
      .set({ progress, status, completedAt })
      .where(and(eq(courseEnrollments.id, enrollmentId), eq(courseEnrollments.employeeId, employeeId)));

    const arr = await this.db
      .select()
      .from(courseEnrollments)
      .where(eq(courseEnrollments.id, enrollmentId));
    
    return arr.length > 0 ? arr[0] : null;
  }
}
