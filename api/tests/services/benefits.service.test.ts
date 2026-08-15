import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BenefitsService } from '../../src/services/benefits.service';

describe('Benefits Service', () => {
  let mockDb: any;
  let service: BenefitsService;

  beforeEach(() => {
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
    };

    service = new BenefitsService({} as any);
    (service as any).db = mockDb;
  });

  describe('ensureBenefitsRecord', () => {
    it('should return existing benefits record', async () => {
      const mockRecord = { id: 'BEN-1', wellnessBudget: 150000 };
      // Two mock resolutions: one for the check, one is not needed since it doesn't insert
      const selectMock = vi.fn().mockResolvedValue([mockRecord]);
      mockDb.where = vi.fn().mockImplementation(() => ({
         then: (res: any) => res([mockRecord])
      }));

      const result = await service.ensureBenefitsRecord('comp-1', 'emp-1');
      expect(result.id).toBe('BEN-1');
    });

    it('should create new record if none exists', async () => {
      // First where() call returns empty array (no record)
      // Second where() call (after insert) returns the new record
      let callCount = 0;
      mockDb.where = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return Promise.resolve([]);
        return Promise.resolve([{ id: 'BEN-NEW', wellnessBudget: 150000 }]);
      });

      const result = await service.ensureBenefitsRecord('comp-1', 'emp-1');
      
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalled();
      expect(result.id).toBe('BEN-NEW');
    });
  });

  describe('Enrollments', () => {
    it('should fail to enroll if plan not found', async () => {
      mockDb.where = vi.fn().mockResolvedValue([]); // getPlan returns nothing
      await expect(service.enroll('comp-1', 'emp-1', 'plan-1')).rejects.toThrow('Plan not found');
    });

    it('should fail to enroll if plan is inactive', async () => {
      mockDb.where = vi.fn().mockResolvedValue([{ id: 'plan-1', status: 'draft' }]); // getPlan returns draft
      await expect(service.enroll('comp-1', 'emp-1', 'plan-1')).rejects.toThrow('not currently open for enrollment');
    });

    it('should enroll employee in active plan', async () => {
      let whereCallCount = 0;
      mockDb.where = vi.fn().mockImplementation(() => {
        whereCallCount++;
        if (whereCallCount === 1) return Promise.resolve([{ id: 'plan-1', status: 'active' }]); // getPlan
        if (whereCallCount === 2) return Promise.resolve([]); // check existing enrollment
        return Promise.resolve();
      });
      
      mockDb.returning = vi.fn().mockResolvedValue([{ id: 'ENR-1', status: 'enrolled' }]);

      const result = await service.enroll('comp-1', 'emp-1', 'plan-1');
      expect(result.status).toBe('enrolled');
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe('Claims', () => {
    it('should fail if wellness claim exceeds remaining budget', async () => {
      // ensureBenefitsRecord will check existing record
      mockDb.where = vi.fn().mockResolvedValue([{ id: 'BEN-1', wellnessBudget: 1000, wellnessUsed: 500 }]);
      
      await expect(
        service.submitClaim('comp-1', 'emp-1', { kind: 'wellness', category: 'gym', amount: 600 })
      ).rejects.toThrow('exceeds your remaining wellness budget');
    });

    it('should submit claim successfully', async () => {
      // First where() for ensureBenefitsRecord
      mockDb.where = vi.fn().mockResolvedValue([{ id: 'BEN-1', wellnessBudget: 1000, wellnessUsed: 500 }]);
      mockDb.returning = vi.fn().mockResolvedValue([{ id: 'CLM-1', status: 'pending' }]);
      
      const result = await service.submitClaim('comp-1', 'emp-1', { kind: 'wellness', category: 'gym', amount: 400 });
      expect(result.id).toBe('CLM-1');
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });
});
