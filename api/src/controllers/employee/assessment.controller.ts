import { Context } from 'hono';
import { AssessmentService } from '../../services/assessment.service';
import { AppEnv } from '../../types';

export const getMyAssessments = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.get('employeeId');

  if (!employeeId) {
    return c.json({ error: 'Unauthorized: No employee ID found' }, 401);
  }

  const service = new AssessmentService(c.env.DB);
  const assessments = await service.getEmployeeAssessments(companyId, employeeId);

  // Parse JSON fields
  const parsedAssessments = assessments.map(asm => ({
    ...asm,
    achievements: asm.achievements ? JSON.parse(asm.achievements) : [],
    challenges: asm.challenges ? JSON.parse(asm.challenges) : [],
    goalsProgress: asm.goalsProgress ? JSON.parse(asm.goalsProgress) : [],
    skillRatings: asm.skillRatings ? JSON.parse(asm.skillRatings) : [],
    developmentGoals: asm.developmentGoals ? JSON.parse(asm.developmentGoals) : [],
  }));

  return c.json(parsedAssessments);
};

export const getAssessment = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const assessmentId = c.req.param('id');

  if (!assessmentId) {
    return c.json({ error: 'Assessment ID is required' }, 400);
  }

  const service = new AssessmentService(c.env.DB);
  const assessment = await service.getAssessmentById(companyId, assessmentId);

  if (!assessment) {
    return c.json({ error: 'Assessment not found' }, 404);
  }

  // Parse JSON fields
  const parsedAssessment = {
    ...assessment,
    achievements: assessment.achievements ? JSON.parse(assessment.achievements) : [],
    challenges: assessment.challenges ? JSON.parse(assessment.challenges) : [],
    goalsProgress: assessment.goalsProgress ? JSON.parse(assessment.goalsProgress) : [],
    skillRatings: assessment.skillRatings ? JSON.parse(assessment.skillRatings) : [],
    developmentGoals: assessment.developmentGoals ? JSON.parse(assessment.developmentGoals) : [],
  };

  return c.json(parsedAssessment);
};

export const createAssessment = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.get('employeeId');

  if (!employeeId) {
    return c.json({ error: 'Unauthorized: No employee ID found' }, 401);
  }

  const service = new AssessmentService(c.env.DB);
  const data = await c.req.json();
  const assessment = await service.createAssessment(companyId, employeeId, data);

  return c.json(assessment, 201);
};

export const updateAssessment = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const assessmentId = c.req.param('id');

  if (!assessmentId) {
    return c.json({ error: 'Assessment ID is required' }, 400);
  }

  const service = new AssessmentService(c.env.DB);
  const data = await c.req.json();
  const assessment = await service.updateAssessment(companyId, assessmentId, data);

  if (!assessment) {
    return c.json({ error: 'Assessment not found' }, 404);
  }

  return c.json(assessment);
};

export const submitAssessment = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const assessmentId = c.req.param('id');

  if (!assessmentId) {
    return c.json({ error: 'Assessment ID is required' }, 400);
  }

  const service = new AssessmentService(c.env.DB);
  const assessment = await service.submitAssessment(companyId, assessmentId);

  if (!assessment) {
    return c.json({ error: 'Assessment not found' }, 404);
  }

  return c.json(assessment);
};

export const getActiveCycleAssessment = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.get('employeeId');
  const cycleName = c.req.query('cycle') || 'H2 2024';

  if (!employeeId) {
    return c.json({ error: 'Unauthorized: No employee ID found' }, 401);
  }

  const service = new AssessmentService(c.env.DB);
  const assessment = await service.getActiveCycleAssessment(companyId, employeeId, cycleName);

  if (!assessment) {
    return c.json(null);
  }

  // Parse JSON fields
  const parsedAssessment = {
    ...assessment,
    achievements: assessment.achievements ? JSON.parse(assessment.achievements) : [],
    challenges: assessment.challenges ? JSON.parse(assessment.challenges) : [],
    goalsProgress: assessment.goalsProgress ? JSON.parse(assessment.goalsProgress) : [],
    skillRatings: assessment.skillRatings ? JSON.parse(assessment.skillRatings) : [],
    developmentGoals: assessment.developmentGoals ? JSON.parse(assessment.developmentGoals) : [],
  };

  return c.json(parsedAssessment);
};
