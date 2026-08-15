import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReviewCycleService } from '../../src/services/reviewCycle.service';

describe('Review Cycle Service', () => {
  let mockDb: any;
  let service: ReviewCycleService;

  beforeEach(() => {
    mockDb = {
      query: {
        reviewCycles: {
          findMany: vi.fn(),
          findFirst: vi.fn(),
        },
        cycleStages: {
          findMany: vi.fn(),
          findFirst: vi.fn(),
        },
      },
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnThis(),
    };

    service = new ReviewCycleService({} as any);
    (service as any).db = mockDb;
  });

  describe('getActiveCycle', () => {
    it('should return active cycle if one exists', async () => {
      mockDb.query.reviewCycles.findFirst.mockResolvedValueOnce({ id: 'cycle-1', status: 'active' });
      const result = await service.getActiveCycle('comp-1');
      expect(result?.id).toBe('cycle-1');
    });

    it('should fallback to upcoming cycle if no active cycle exists', async () => {
      mockDb.query.reviewCycles.findFirst.mockResolvedValueOnce(undefined); // No active
      mockDb.query.reviewCycles.findFirst.mockResolvedValueOnce({ id: 'cycle-2', status: 'upcoming' }); // Upcoming fallback
      const result = await service.getActiveCycle('comp-1');
      expect(result?.id).toBe('cycle-2');
    });
  });

  describe('createCycle', () => {
    it('should create cycle and default stages', async () => {
      mockDb.returning.mockResolvedValueOnce([{ id: 'CYC-1', status: 'upcoming' }]);
      
      const result = await service.createCycle('comp-1', { name: '2023 Q4 Review', status: 'upcoming' });
      
      expect(result.id).toBe('CYC-1');
      expect(mockDb.insert).toHaveBeenCalledTimes(2); // One for cycle, one for stages
      // We know STAGE_DEFS has 8 items
      const stagesValues = mockDb.values.mock.calls[1][0];
      expect(stagesValues).toHaveLength(8);
    });

    it('should deactivate other active cycles if new cycle is active', async () => {
      mockDb.returning.mockResolvedValueOnce([{ id: 'CYC-1', status: 'active' }]);
      mockDb.query.reviewCycles.findMany.mockResolvedValueOnce([{ id: 'CYC-OLD' }]); // other active cycle
      
      await service.createCycle('comp-1', { name: 'New Cycle', status: 'active' });
      
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({ status: 'closed' }));
    });
  });

  describe('Stage timelines', () => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

    it('should return true if stage has no dates', async () => {
      mockDb.query.cycleStages.findFirst.mockResolvedValueOnce({ key: 'self_review', startDate: null, dueDate: null });
      const isOpen = await service.isStageOpen('comp-1', 'cyc-1', 'self_review');
      expect(isOpen).toBe(true);
    });

    it('should return false if stage has not started', async () => {
      mockDb.query.cycleStages.findFirst.mockResolvedValueOnce({ key: 'self_review', startDate: tomorrow });
      const isOpen = await service.isStageOpen('comp-1', 'cyc-1', 'self_review');
      expect(isOpen).toBe(false);
    });

    it('should return false if stage is past due', async () => {
      mockDb.query.cycleStages.findFirst.mockResolvedValueOnce({ key: 'self_review', dueDate: yesterday });
      const isOpen = await service.isStageOpen('comp-1', 'cyc-1', 'self_review');
      expect(isOpen).toBe(false);
    });

    it('should return true if today is within stage dates', async () => {
      mockDb.query.cycleStages.findFirst.mockResolvedValueOnce({ key: 'self_review', startDate: yesterday, dueDate: tomorrow });
      const isOpen = await service.isStageOpen('comp-1', 'cyc-1', 'self_review');
      expect(isOpen).toBe(true);
    });
  });

  describe('isManagerReviewReleased', () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    
    it('should return true if no stage date configured', async () => {
      mockDb.query.cycleStages.findFirst.mockResolvedValueOnce({ startDate: null });
      const released = await service.isManagerReviewReleased('comp-1', 'cyc-1');
      expect(released).toBe(true);
    });

    it('should return false if release date is in the future', async () => {
      mockDb.query.cycleStages.findFirst.mockResolvedValueOnce({ startDate: tomorrow });
      const released = await service.isManagerReviewReleased('comp-1', 'cyc-1');
      expect(released).toBe(false);
    });
  });
});
