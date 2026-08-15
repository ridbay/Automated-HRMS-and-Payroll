import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RequisitionService } from '../../src/services/requisition.service';

describe('Requisition Service', () => {
  let mockDb: any;
  let service: RequisitionService;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2023-10-20T10:00:00'));

    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnThis(),
      query: {
        jobRequisitions: { findMany: vi.fn() },
      }
    };

    service = new RequisitionService({} as any);
    (service as any).db = mockDb;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Queries & daysOpen computation', () => {
    it('should compute daysOpen on fetch', async () => {
      mockDb.query.jobRequisitions.findMany.mockResolvedValueOnce([
        { id: 'req-1', dateOpened: '2023-10-15' } // 5 days ago from 2023-10-20
      ]);
      const result = await service.getAllByCompany('comp-1');
      
      expect(result).toHaveLength(1);
      expect(result[0].daysOpen).toBe(5);
    });
  });

  describe('create', () => {
    it('should create as Pending Approval if requester is not admin', async () => {
      mockDb.returning.mockResolvedValueOnce([{ id: 'REQ-1', dateOpened: '2023-10-20' }]);
      
      const requester = { id: 'emp-1', name: 'John Doe', role: 'EMPLOYEE' };
      await service.create('comp-1', requester, { title: 'Engineer' });
      
      expect(mockDb.insert).toHaveBeenCalled();
      const values = mockDb.values.mock.calls[0][0];
      expect(values.status).toBe('Pending Approval');
      expect(values.reviewedById).toBeNull();
    });

    it('should auto-approve (Open) if requester is HR_ADMIN', async () => {
      mockDb.returning.mockResolvedValueOnce([{ id: 'REQ-1', dateOpened: '2023-10-20' }]);
      
      const requester = { id: 'hr-1', name: 'HR Admin', role: 'HR_ADMIN' };
      await service.create('comp-1', requester, { title: 'Engineer' });
      
      const values = mockDb.values.mock.calls[0][0];
      expect(values.status).toBe('Open');
      expect(values.reviewedById).toBe('hr-1');
      expect(values.reviewedAt).toBeDefined();
    });
  });

  describe('approve / reject', () => {
    it('should approve and reset dateOpened', async () => {
      mockDb.returning.mockResolvedValueOnce([{ id: 'REQ-1', dateOpened: '2023-10-20' }]);
      
      const reviewer = { id: 'hr-1', name: 'HR Admin' };
      const result = await service.approve('comp-1', 'req-1', reviewer);
      
      expect(mockDb.update).toHaveBeenCalled();
      const setArgs = mockDb.set.mock.calls[0][0];
      expect(setArgs.status).toBe('Open');
      expect(setArgs.dateOpened).toBe('2023-10-20');
      expect(setArgs.reviewedById).toBe('hr-1');
    });

    it('should reject and record reason', async () => {
      mockDb.returning.mockResolvedValueOnce([{ id: 'REQ-1', dateOpened: '2023-10-15' }]);
      
      const reviewer = { id: 'hr-1', name: 'HR Admin' };
      const result = await service.reject('comp-1', 'req-1', reviewer, 'Budget constraints');
      
      expect(mockDb.update).toHaveBeenCalled();
      const setArgs = mockDb.set.mock.calls[0][0];
      expect(setArgs.status).toBe('Rejected');
      expect(setArgs.rejectionReason).toBe('Budget constraints');
    });
  });
});
