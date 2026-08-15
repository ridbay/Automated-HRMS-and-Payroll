import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as assessmentController from '../../../src/controllers/employee/assessment.controller';
import { AssessmentService } from '../../../src/services/assessment.service';

vi.mock('../../../src/services/assessment.service');

describe('Employee Assessment Controller', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    AssessmentService.prototype.getEmployeeAssessments = vi.fn();
    AssessmentService.prototype.getAssessment = vi.fn();
    AssessmentService.prototype.getAssessmentById = vi.fn();
    AssessmentService.prototype.createAssessment = vi.fn();
    AssessmentService.prototype.updateAssessment = vi.fn();
    AssessmentService.prototype.submitAssessment = vi.fn();
    AssessmentService.prototype.getActiveCycleAssessment = vi.fn();

    mockContext = {
      req: {
        query: vi.fn(),
        param: vi.fn(),
        json: vi.fn(),
      },
      env: { DB: {} },
      get: vi.fn(),
      json: vi.fn((data, status) => ({ data, status })),
    };
  });

  it('getMyAssessments should fetch assessments', async () => {
    mockContext.get.mockReturnValue('comp-1');
    (AssessmentService.prototype.getEmployeeAssessments as any).mockResolvedValue([{ id: 'ass-1' }]);

    await assessmentController.getMyAssessments(mockContext);
    expect(AssessmentService.prototype.getEmployeeAssessments).toHaveBeenCalled();
  });

  it('submitAssessment should submit', async () => {
    mockContext.get.mockImplementation((k: string) => {
      if (k === 'companyId') return 'comp-1';
      if (k === 'employeeId') return 'emp-1';
      if (k === 'role') return 'ADMIN';
    });
    mockContext.req.param.mockReturnValue('ass-1');
    (AssessmentService.prototype.getAssessmentById as any).mockResolvedValue({ id: 'ass-1' });
    (AssessmentService.prototype.submitAssessment as any).mockResolvedValue({ id: 'ass-1', status: 'Submitted' });

    await assessmentController.submitAssessment(mockContext);
    expect(AssessmentService.prototype.submitAssessment).toHaveBeenCalled();
  });
});
