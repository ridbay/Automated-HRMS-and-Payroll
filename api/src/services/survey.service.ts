import { eq, and } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { surveys, surveyQuestions, surveyResponses, surveyAnswers } from '../models/survey.model';
import { D1Database } from '@cloudflare/workers-types';
import * as schema from '../db/schema';

export class SurveyService {
  private db;

  constructor(dbBinding: D1Database) {
    this.db = drizzle(dbBinding, { schema });
  }

  // --- Admin Methods ---

  async createSurvey(data: {
    companyId: string;
    title: string;
    description?: string;
    type: string;
    status?: string;
    targetAudience?: string;
    expiresAt?: string;
    questions: any[];
  }) {
    const surveyId = `SRV-${crypto.randomUUID().split('-')[0].toUpperCase()}`;
    
    // Insert the main survey record
    await this.db.insert(surveys).values({
      id: surveyId,
      companyId: data.companyId,
      title: data.title,
      description: data.description,
      type: data.type,
      status: data.status || 'draft',
      targetAudience: data.targetAudience || 'all',
      createdAt: new Date().toISOString(),
      expiresAt: data.expiresAt,
    });

    // Insert questions
    if (data.questions && data.questions.length > 0) {
      const questionRecords = data.questions.map((q, idx) => ({
        id: `SQ-${crypto.randomUUID().split('-')[0].toUpperCase()}`,
        surveyId,
        question: q.question,
        type: q.type,
        options: q.options ? JSON.stringify(q.options) : null,
        orderIndex: idx,
      }));
      await this.db.insert(surveyQuestions).values(questionRecords);
    }

    return this.getSurveyById(surveyId, data.companyId);
  }

  async getAllSurveys(companyId: string) {
    return await this.db.select().from(surveys).where(eq(surveys.companyId, companyId));
  }

  async getSurveyById(surveyId: string, companyId: string) {
    const surveyArr = await this.db
      .select()
      .from(surveys)
      .where(and(eq(surveys.id, surveyId), eq(surveys.companyId, companyId)));
      
    if (surveyArr.length === 0) return null;
    const survey = surveyArr[0];

    const questions = await this.db
      .select()
      .from(surveyQuestions)
      .where(eq(surveyQuestions.surveyId, surveyId));

    return { ...survey, questions };
  }

  async getSurveyResults(surveyId: string, companyId: string) {
    const survey = await this.getSurveyById(surveyId, companyId);
    if (!survey) return null;

    const responses = await this.db
      .select()
      .from(surveyResponses)
      .where(eq(surveyResponses.surveyId, surveyId));

    const responseIds = responses.map(r => r.id);
    let answers: any[] = [];
    
    // SQLite D1 IN clause workaround for empty arrays
    if (responseIds.length > 0) {
        // Need to loop or build dynamic query, but for simplicity we fetch all answers for these responses
        // Drizzle supports `inArray`
        const { inArray } = await import('drizzle-orm');
        answers = await this.db
            .select()
            .from(surveyAnswers)
            .where(inArray(surveyAnswers.responseId, responseIds));
    }

    return {
      survey,
      responses,
      answers,
    };
  }

  async deleteSurvey(surveyId: string, companyId: string) {
    const survey = await this.getSurveyById(surveyId, companyId);
    if (!survey) return false;

    // Due to simple cascading lacking, manually delete children
    await this.db.delete(surveyQuestions).where(eq(surveyQuestions.surveyId, surveyId));
    
    const responses = await this.db.select().from(surveyResponses).where(eq(surveyResponses.surveyId, surveyId));
    if (responses.length > 0) {
      const responseIds = responses.map(r => r.id);
      const { inArray } = await import('drizzle-orm');
      await this.db.delete(surveyAnswers).where(inArray(surveyAnswers.responseId, responseIds));
      await this.db.delete(surveyResponses).where(eq(surveyResponses.surveyId, surveyId));
    }

    await this.db.delete(surveys).where(and(eq(surveys.id, surveyId), eq(surveys.companyId, companyId)));
    return true;
  }

  // --- Employee Methods ---

  async getActiveSurveys(companyId: string) {
    return await this.db
      .select()
      .from(surveys)
      .where(and(eq(surveys.companyId, companyId), eq(surveys.status, 'active')));
  }

  async submitResponse(surveyId: string, employeeId: string | null, answers: { questionId: string; answer: string }[]) {
    const responseId = `SR-${crypto.randomUUID().split('-')[0].toUpperCase()}`;
    
    await this.db.insert(surveyResponses).values({
      id: responseId,
      surveyId,
      employeeId,
      submittedAt: new Date().toISOString(),
    });

    if (answers && answers.length > 0) {
      const answerRecords = answers.map((a) => ({
        id: `SA-${crypto.randomUUID().split('-')[0].toUpperCase()}`,
        responseId,
        questionId: a.questionId,
        answer: a.answer,
      }));
      await this.db.insert(surveyAnswers).values(answerRecords);
    }

    return { success: true, responseId };
  }
}
