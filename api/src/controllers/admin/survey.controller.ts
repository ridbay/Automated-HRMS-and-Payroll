import { Context } from 'hono';
import { SurveyService } from '../../services/survey.service';

export class AdminSurveyController {
  static async createSurvey(c: Context<any>) {
    const companyId = c.get('tenantId') || c.get('companyId');
    if (!companyId) return c.json({ error: 'Tenant not found' }, 400);

    const body = await c.req.json();
    if (!body.title || !body.type || !body.questions) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const surveyService = new SurveyService(c.env.DB);
    const survey = await surveyService.createSurvey({
      companyId,
      ...body,
    });
    return c.json({ data: survey }, 201);
  }

  static async getAllSurveys(c: Context<any>) {
    const companyId = c.get('tenantId') || c.get('companyId');
    if (!companyId) return c.json({ error: 'Tenant not found' }, 400);

    const surveyService = new SurveyService(c.env.DB);
    const surveys = await surveyService.getAllSurveys(companyId);
    return c.json({ data: surveys });
  }

  static async getSurveyById(c: Context<any>) {
    const companyId = c.get('tenantId') || c.get('companyId');
    if (!companyId) return c.json({ error: 'Tenant not found' }, 400);
    const surveyId = c.req.param('id');

    const surveyService = new SurveyService(c.env.DB);
    const survey = await surveyService.getSurveyById(surveyId, companyId);
    if (!survey) return c.json({ error: 'Survey not found' }, 404);
    
    return c.json({ data: survey });
  }

  static async getSurveyResults(c: Context<any>) {
    const companyId = c.get('tenantId') || c.get('companyId');
    if (!companyId) return c.json({ error: 'Tenant not found' }, 400);
    const surveyId = c.req.param('id');

    const surveyService = new SurveyService(c.env.DB);
    const results = await surveyService.getSurveyResults(surveyId, companyId);
    if (!results) return c.json({ error: 'Survey not found' }, 404);
    
    return c.json({ data: results });
  }

  static async deleteSurvey(c: Context<any>) {
    const companyId = c.get('tenantId') || c.get('companyId');
    if (!companyId) return c.json({ error: 'Tenant not found' }, 400);
    const surveyId = c.req.param('id');

    const surveyService = new SurveyService(c.env.DB);
    const success = await surveyService.deleteSurvey(surveyId, companyId);
    if (!success) return c.json({ error: 'Survey not found' }, 404);

    return c.json({ success: true });
  }
}
