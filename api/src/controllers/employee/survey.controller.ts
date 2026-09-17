import { Context } from 'hono';
import { SurveyService } from '../../services/survey.service';

export class EmployeeSurveyController {
  static async getActiveSurveys(c: Context<any>) {
    const companyId = c.get('tenantId') || c.get('companyId');
    if (!companyId) return c.json({ error: 'Tenant not found' }, 400);

    const surveyService = new SurveyService(c.env.DB);
    const surveys = await surveyService.getActiveSurveys(companyId);
    return c.json({ data: surveys });
  }

  static async getSurveyDetails(c: Context<any>) {
    const companyId = c.get('tenantId') || c.get('companyId');
    if (!companyId) return c.json({ error: 'Tenant not found' }, 400);
    const surveyId = c.req.param('id');
    if (!surveyId) return c.json({ error: 'Survey ID is required' }, 400);

    const surveyService = new SurveyService(c.env.DB);
    const survey = await surveyService.getSurveyById(surveyId, companyId);
    if (!survey || survey.status !== 'active') {
      return c.json({ error: 'Active survey not found' }, 404);
    }
    
    return c.json({ data: survey });
  }

  static async submitSurveyResponse(c: Context<any>) {
    const companyId = c.get('tenantId') || c.get('companyId');
    const employeeId = c.get('user')?.sub || c.get('employeeId');
    if (!companyId) return c.json({ error: 'Tenant not found' }, 400);
    if (!employeeId) return c.json({ error: 'Employee not found' }, 400);
    const surveyId = c.req.param('id');
    if (!surveyId) return c.json({ error: 'Survey ID is required' }, 400);

    const body = await c.req.json();
    if (!body.answers) {
      return c.json({ error: 'Missing answers' }, 400);
    }

    const surveyService = new SurveyService(c.env.DB);
    const survey = await surveyService.getSurveyById(surveyId, companyId);
    if (!survey || survey.status !== 'active') {
      return c.json({ error: 'Active survey not found' }, 404);
    }

    // Optionally handle anonymity based on survey settings
    // Here we pass employeeId but it can be omitted
    const result = await surveyService.submitResponse(surveyId, employeeId, body.answers);
    
    return c.json({ data: result }, 201);
  }
}
