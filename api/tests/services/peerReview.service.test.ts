import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PeerReviewService } from '../../src/services/peerReview.service';

describe('Peer Review Service', () => {
  let mockDb: any;
  let service: PeerReviewService;

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
        peerReviews: { findFirst: vi.fn(), findMany: vi.fn() },
        employees: { findFirst: vi.fn(), findMany: vi.fn() },
      }
    };

    service = new PeerReviewService({} as any);
    (service as any).db = mockDb;
  });

  describe('nominate', () => {
    it('should throw error if no valid peers', async () => {
      await expect(service.nominate('comp-1', 'cyc-1', 'emp-1', [])).rejects.toThrow('Select at least one peer reviewer');
    });

    it('should filter out self-nominations', async () => {
      await expect(service.nominate('comp-1', 'cyc-1', 'emp-1', ['emp-1'])).rejects.toThrow('Select at least one peer reviewer');
    });

    it('should ignore already nominated peers', async () => {
      // Mock existing nomination for peer-1
      mockDb.query.peerReviews.findMany.mockResolvedValueOnce([{ reviewerId: 'peer-1', status: 'nominated' }]);
      
      const result = await service.nominate('comp-1', 'cyc-1', 'emp-1', ['peer-1', 'peer-2']);
      
      expect(result).toHaveLength(1);
      expect(result[0].reviewerId).toBe('peer-2');
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe('approveNomination Permissions', () => {
    it('should deny if nomination not found', async () => {
      mockDb.query.peerReviews.findFirst.mockResolvedValueOnce(undefined);
      const result = await service.approveNomination('comp-1', 'nom-1', 'mgr-1', 'MANAGER', true);
      expect(result).toBeNull();
    });

    it('should allow manager to approve', async () => {
      mockDb.query.peerReviews.findFirst.mockResolvedValueOnce({ id: 'nom-1', revieweeId: 'emp-1' });
      mockDb.query.employees.findFirst.mockResolvedValueOnce({ id: 'emp-1', managerId: 'mgr-1' });
      mockDb.returning.mockResolvedValueOnce([{ id: 'nom-1', status: 'approved' }]);

      const result = await service.approveNomination('comp-1', 'nom-1', 'mgr-1', 'MANAGER', true);
      
      expect(mockDb.update).toHaveBeenCalled();
      expect(result?.status).toBe('approved');
    });
  });

  describe('submitReview', () => {
    it('should deny if review not approved or wrong reviewer', async () => {
      mockDb.query.peerReviews.findFirst.mockResolvedValueOnce({ id: 'nom-1', reviewerId: 'peer-1', status: 'nominated' });
      
      const result = await service.submitReview('comp-1', 'nom-1', 'peer-1', { rating: 'good' });
      expect(result).toBeNull();
      expect(mockDb.update).not.toHaveBeenCalled();
    });

    it('should submit if approved', async () => {
      mockDb.query.peerReviews.findFirst.mockResolvedValueOnce({ id: 'nom-1', reviewerId: 'peer-1', status: 'approved' });
      mockDb.returning.mockResolvedValueOnce([{ id: 'nom-1', status: 'submitted' }]);
      
      const result = await service.submitReview('comp-1', 'nom-1', 'peer-1', { rating: 'good' });
      expect(mockDb.update).toHaveBeenCalled();
      expect(result?.status).toBe('submitted');
    });
  });

  describe('submitUpwardReview', () => {
    it('should upsert upward review', async () => {
      mockDb.query.peerReviews.findFirst.mockResolvedValueOnce(undefined); // No existing
      mockDb.returning.mockResolvedValueOnce([{ id: 'UR-1', direction: 'upward' }]);
      
      const result = await service.submitUpwardReview('comp-1', 'cyc-1', 'emp-1', 'mgr-1', { rating: 'good' });
      expect(mockDb.insert).toHaveBeenCalled();
      expect(result?.direction).toBe('upward');
    });

    it('should update existing upward review if it exists', async () => {
      mockDb.query.peerReviews.findFirst.mockResolvedValueOnce({ id: 'UR-1', direction: 'upward' }); // Existing
      mockDb.returning.mockResolvedValueOnce([{ id: 'UR-1', rating: 'better' }]);
      
      const result = await service.submitUpwardReview('comp-1', 'cyc-1', 'emp-1', 'mgr-1', { rating: 'better' });
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.insert).not.toHaveBeenCalled();
    });
  });
});
