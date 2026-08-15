import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminSurveyController } from '../../../../src/controllers/admin/survey.controller';
import { SurveyService } from '../../../../src/services/survey.service';

vi.mock('../../../../src/services/survey.service');

describe('Admin Survey Controller', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    SurveyService.prototype.createSurvey = vi.fn().mockResolvedValue({ id: 's1', title: 'Q1 Pulse' });
    SurveyService.prototype.getAllSurveys = vi.fn().mockResolvedValue([{ id: 's1', title: 'Q1 Pulse' }]);
    SurveyService.prototype.getSurveyById = vi.fn().mockResolvedValue({ id: 's1', title: 'Q1 Pulse' });
    SurveyService.prototype.getSurveyResults = vi.fn().mockResolvedValue({ survey: { id: 's1' }, responses: [], answers: [] });
    SurveyService.prototype.deleteSurvey = vi.fn().mockResolvedValue(true);

    mockContext = {
      get: vi.fn().mockReturnValue('company1'),
      req: {
        param: vi.fn().mockReturnValue('s1'),
        json: vi.fn().mockResolvedValue({ title: 'Q1 Pulse', type: 'pulse', questions: [] }),
      },
      json: vi.fn((data, status) => ({ data, status })),
      env: { DB: {} },
    };
  });

  it('should return all surveys', async () => {
    const res = await AdminSurveyController.getAllSurveys(mockContext);
    expect(res.data.data).toHaveLength(1);
    expect(res.data.data[0].title).toBe('Q1 Pulse');
  });

  it('should create a survey', async () => {
    const res = await AdminSurveyController.createSurvey(mockContext);
    expect(res.status).toBe(201);
    expect(res.data.data.title).toBe('Q1 Pulse');
  });

  it('should get survey by id', async () => {
    const res = await AdminSurveyController.getSurveyById(mockContext);
    expect(res.data.data.title).toBe('Q1 Pulse');
  });

  it('should get survey results', async () => {
    const res = await AdminSurveyController.getSurveyResults(mockContext);
    expect(res.data.data.survey.id).toBe('s1');
  });

  it('should delete a survey', async () => {
    const res = await AdminSurveyController.deleteSurvey(mockContext);
    expect(res.data.success).toBe(true);
  });
});
