import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AssessmentService } from './assessment.service';

describe('Assessment Service', () => {
  let mockDb: any;
  let service: AssessmentService;

  beforeEach(() => {
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      all: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnThis(),
      query: {
        assessments: { findFirst: vi.fn(), findMany: vi.fn() },
        employees: { findFirst: vi.fn() },
      }
    };

    service = new AssessmentService({} as any);
    (service as any).db = mockDb;
  });

  describe('createAssessment', () => {
    it('should create an assessment in draft status', async () => {
      mockDb.returning.mockResolvedValueOnce([{ id: 'ASM-1', status: 'draft' }]);
      
      const result = await service.createAssessment('comp-1', 'emp-1', { cycleName: 'Q4 Review', selfRating: 'meets_expectations' });
      
      expect(result.id).toBe('ASM-1');
      expect(mockDb.insert).toHaveBeenCalled();
      const values = mockDb.values.mock.calls[0][0];
      expect(values.status).toBe('draft');
      expect(values.selfRating).toBe('meets_expectations');
    });
  });

  describe('submitManagerReview Permissions', () => {
    it('should deny if assessment not found', async () => {
      mockDb.query.assessments.findFirst.mockResolvedValueOnce(undefined);
      const result = await service.submitManagerReview('comp-1', 'asm-1', 'mgr-1', 'MANAGER', { managerRating: 'meets_expectations' });
      expect(result).toBeNull();
    });

    it('should allow manager of the employee to review', async () => {
      mockDb.query.assessments.findFirst.mockResolvedValueOnce({ id: 'asm-1', employeeId: 'emp-1' });
      mockDb.query.employees.findFirst.mockResolvedValueOnce({ id: 'emp-1', managerId: 'mgr-1' });
      mockDb.returning.mockResolvedValueOnce([{ id: 'asm-1', status: 'completed' }]);

      const result = await service.submitManagerReview('comp-1', 'asm-1', 'mgr-1', 'MANAGER', { managerRating: 'meets_expectations' });
      
      expect(mockDb.update).toHaveBeenCalled();
      expect(result?.status).toBe('completed');
    });

    it('should allow admin to review any assessment', async () => {
      mockDb.query.assessments.findFirst.mockResolvedValueOnce({ id: 'asm-1', employeeId: 'emp-1' });
      // Admin doesn't need to be the manager, employees query is skipped
      mockDb.returning.mockResolvedValueOnce([{ id: 'asm-1', status: 'completed' }]);

      const result = await service.submitManagerReview('comp-1', 'asm-1', 'admin-1', 'HR_ADMIN', { managerRating: 'exceptional' });
      
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.query.employees.findFirst).not.toHaveBeenCalled();
    });

    it('should deny non-manager and non-admin', async () => {
      mockDb.query.assessments.findFirst.mockResolvedValueOnce({ id: 'asm-1', employeeId: 'emp-1' });
      mockDb.query.employees.findFirst.mockResolvedValueOnce({ id: 'emp-1', managerId: 'mgr-1' });

      const result = await service.submitManagerReview('comp-1', 'asm-1', 'emp-2', 'EMPLOYEE', { managerRating: 'exceptional' });
      
      expect(result).toBeNull();
      expect(mockDb.update).not.toHaveBeenCalled();
    });
  });
});
