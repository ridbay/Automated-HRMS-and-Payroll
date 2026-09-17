import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmployeeSurveyController } from '../../../src/controllers/employee/survey.controller';
import { SurveyService } from '../../../src/services/survey.service';

vi.mock('../../../src/services/survey.service');

describe('Employee Survey Controller', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    SurveyService.prototype.getActiveSurveys = vi.fn().mockResolvedValue([{ id: 's1', title: 'Q1 Pulse' }]);
    SurveyService.prototype.getSurveyById = vi.fn().mockResolvedValue({ id: 's1', title: 'Q1 Pulse', status: 'active' });
    SurveyService.prototype.submitResponse = vi.fn().mockResolvedValue({ success: true, responseId: 'sr1' });

    mockContext = {
      get: vi.fn((key: string) => {
        if (key === 'tenantId') return 'company1';
        if (key === 'user') return { sub: 'emp123' };
        return null;
      }),
      req: {
        param: vi.fn().mockReturnValue('s1'),
        json: vi.fn().mockResolvedValue({ answers: [{ questionId: 'q1', answer: '5' }] }),
      },
      json: vi.fn((data, status) => ({ data, status })),
      env: { DB: {} },
    };
  });

  it('should get active surveys', async () => {
    const res: any = await EmployeeSurveyController.getActiveSurveys(mockContext);
    expect(res.data.data).toHaveLength(1);
    expect(res.data.data[0].title).toBe('Q1 Pulse');
  });

  it('should get survey details for an active survey', async () => {
    const res: any = await EmployeeSurveyController.getSurveyDetails(mockContext);
    expect(res.data.data.title).toBe('Q1 Pulse');
  });

  it('should submit a survey response', async () => {
    const res: any = await EmployeeSurveyController.submitSurveyResponse(mockContext);
    expect(res.status).toBe(201);
    expect(res.data.data.success).toBe(true);
  });
});
