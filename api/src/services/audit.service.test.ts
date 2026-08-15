import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditService } from './audit.service';

describe('Audit Service', () => {
  let mockDb: any;
  let service: AuditService;

  beforeEach(() => {
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      all: vi.fn().mockResolvedValue([]),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue({ id: 'audit-1' }),
      query: {
        employees: { findFirst: vi.fn() },
      }
    };

    service = new AuditService({} as any);
    (service as any).db = mockDb;
  });

  describe('log', () => {
    it('should log action with System as actor if no actorId provided', async () => {
      await service.log('comp-1', { action: 'Test Action', module: 'company' });
      
      expect(mockDb.insert).toHaveBeenCalled();
      const values = mockDb.values.mock.calls[0][0];
      expect(values.actorName).toBe('System');
      expect(values.employeeId).toBe('system');
      expect(values.module).toBe('company');
      expect(values.action).toBe('Test Action');
    });

    it('should lookup actor name if actorId is provided', async () => {
      mockDb.query.employees.findFirst.mockResolvedValueOnce({ name: 'John', lastName: 'Doe' });
      
      await service.log('comp-1', { action: 'Updated settings', module: 'settings', actorId: 'emp-1' });
      
      expect(mockDb.query.employees.findFirst).toHaveBeenCalled();
      const values = mockDb.values.mock.calls[0][0];
      expect(values.actorName).toBe('John Doe');
      expect(values.employeeId).toBe('emp-1'); // Default subject is actor
    });

    it('should use subjectId if provided', async () => {
      await service.log('comp-1', { action: 'Edited profile', module: 'workforce', actorId: 'admin-1', subjectId: 'emp-1' });
      
      const values = mockDb.values.mock.calls[0][0];
      expect(values.employeeId).toBe('emp-1');
    });
  });

  describe('getCompanyLogs', () => {
    it('should fetch logs without filters', async () => {
      mockDb.all.mockResolvedValueOnce([{ id: 'audit-1' }, { id: 'audit-2' }]);
      const result = await service.getCompanyLogs('comp-1');
      expect(result).toHaveLength(2);
      expect(mockDb.limit).toHaveBeenCalledWith(200);
    });

    it('should fetch logs with search filter', async () => {
      mockDb.all.mockResolvedValueOnce([
        { id: 'audit-1', action: 'Created user', actorName: 'Admin', details: '' },
        { id: 'audit-2', action: 'Deleted user', actorName: 'Admin', details: '' },
      ]);
      const result = await service.getCompanyLogs('comp-1', { search: 'deleted' });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('audit-2');
    });
  });
});
