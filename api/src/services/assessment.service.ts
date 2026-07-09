import { D1Database } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, desc } from 'drizzle-orm';
import * as schema from '../db/schema';

export class AssessmentService {
  private db;

  constructor(dbBinding: D1Database) {
    this.db = drizzle(dbBinding, { schema });
  }

  async getEmployeeAssessments(companyId: string, employeeId: string) {
    return this.db.query.assessments.findMany({
      where: and(
        eq(schema.assessments.companyId, companyId),
        eq(schema.assessments.employeeId, employeeId)
      ),
      orderBy: [desc(schema.assessments.createdAt)]
    });
  }

  async getAssessmentById(companyId: string, assessmentId: string) {
    return this.db.query.assessments.findFirst({
      where: and(
        eq(schema.assessments.id, assessmentId),
        eq(schema.assessments.companyId, companyId)
      )
    });
  }

  async createAssessment(companyId: string, employeeId: string, data: any) {
    const id = `ASM-${crypto.randomUUID().split('-')[0].toUpperCase()}`;
    
    const result = await this.db.insert(schema.assessments).values({
      id,
      companyId,
      employeeId,
      cycleName: data.cycleName,
      status: 'draft',
      achievements: JSON.stringify(data.achievements || []),
      challenges: JSON.stringify(data.challenges || []),
      goalsProgress: JSON.stringify(data.goalsProgress || []),
      skillRatings: JSON.stringify(data.skillRatings || []),
      selfRating: data.selfRating || null,
      selfComment: data.selfComment || null,
      developmentGoals: JSON.stringify(data.developmentGoals || []),
    }).returning();

    return result[0];
  }

  async updateAssessment(companyId: string, assessmentId: string, data: any) {
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (data.achievements !== undefined) updateData.achievements = JSON.stringify(data.achievements);
    if (data.challenges !== undefined) updateData.challenges = JSON.stringify(data.challenges);
    if (data.goalsProgress !== undefined) updateData.goalsProgress = JSON.stringify(data.goalsProgress);
    if (data.skillRatings !== undefined) updateData.skillRatings = JSON.stringify(data.skillRatings);
    if (data.selfRating !== undefined) updateData.selfRating = data.selfRating;
    if (data.selfComment !== undefined) updateData.selfComment = data.selfComment;
    if (data.developmentGoals !== undefined) updateData.developmentGoals = JSON.stringify(data.developmentGoals);

    const result = await this.db
      .update(schema.assessments)
      .set(updateData)
      .where(and(
        eq(schema.assessments.id, assessmentId),
        eq(schema.assessments.companyId, companyId)
      ))
      .returning();

    return result[0];
  }

  async submitAssessment(companyId: string, assessmentId: string) {
    const result = await this.db
      .update(schema.assessments)
      .set({
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .where(and(
        eq(schema.assessments.id, assessmentId),
        eq(schema.assessments.companyId, companyId)
      ))
      .returning();

    return result[0];
  }

  async getActiveCycleAssessment(companyId: string, employeeId: string, cycleName: string) {
    return this.db.query.assessments.findFirst({
      where: and(
        eq(schema.assessments.companyId, companyId),
        eq(schema.assessments.employeeId, employeeId),
        eq(schema.assessments.cycleName, cycleName)
      )
    });
  }
}
