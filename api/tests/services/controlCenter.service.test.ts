import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  HolidayService, 
  EmailTemplateService, 
  IntegrationService, 
  WorkflowService, 
  DataExportService 
} from '../../src/services/controlCenter.service';

describe('Control Center Services', () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      all: vi.fn().mockResolvedValue([]),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnThis(),
      get: vi.fn(),
      query: {
        integrations: { findFirst: vi.fn() },
      }
    };
  });

  describe('HolidayService', () => {
    let service: HolidayService;
    beforeEach(() => {
      service = new HolidayService({} as any);
      (service as any).db = mockDb;
    });

    it('should list holidays', async () => {
      mockDb.all.mockResolvedValueOnce([{ id: 'hol-1' }]);
      const result = await service.list('comp-1');
      expect(result).toHaveLength(1);
    });

    it('should create holiday', async () => {
      mockDb.get.mockResolvedValueOnce({ id: 'hol-2' });
      const result = await service.create('comp-1', { name: 'Christmas', date: '2023-12-25' });
      expect(mockDb.insert).toHaveBeenCalled();
      expect(result.id).toBe('hol-2');
    });

    it('should delete holiday', async () => {
      mockDb.get.mockResolvedValueOnce({ id: 'hol-1' });
      await service.delete('comp-1', 'hol-1');
      expect(mockDb.delete).toHaveBeenCalled();
    });
  });

  describe('EmailTemplateService', () => {
    let service: EmailTemplateService;
    beforeEach(() => {
      service = new EmailTemplateService({} as any);
      (service as any).db = mockDb;
    });

    it('should seed default templates if empty', async () => {
      mockDb.all.mockResolvedValueOnce([]); // Empty first time
      mockDb.all.mockResolvedValueOnce([{ key: 'welcome_email' }]); // Seeded
      
      const result = await service.list('comp-1');
      expect(mockDb.insert).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('should not seed if templates already exist', async () => {
      mockDb.all.mockResolvedValueOnce([{ key: 'welcome_email' }]);
      
      const result = await service.list('comp-1');
      expect(mockDb.insert).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('IntegrationService', () => {
    let service: IntegrationService;
    beforeEach(() => {
      service = new IntegrationService({} as any);
      (service as any).db = mockDb;
    });

    it('should toggle integration status from connected to available', async () => {
      mockDb.query.integrations.findFirst.mockResolvedValueOnce({ key: 'slack', status: 'connected' });
      mockDb.get.mockResolvedValueOnce({ key: 'slack', status: 'available' });
      
      const result = await service.toggle('comp-1', 'slack');
      expect(mockDb.update).toHaveBeenCalled();
      const setArgs = mockDb.set.mock.calls[0][0];
      expect(setArgs.status).toBe('available');
      expect(setArgs.connectedAt).toBeNull();
    });

    it('should toggle integration status from available to connected', async () => {
      mockDb.query.integrations.findFirst.mockResolvedValueOnce({ key: 'slack', status: 'available' });
      mockDb.get.mockResolvedValueOnce({ key: 'slack', status: 'connected' });
      
      const result = await service.toggle('comp-1', 'slack');
      expect(mockDb.update).toHaveBeenCalled();
      const setArgs = mockDb.set.mock.calls[0][0];
      expect(setArgs.status).toBe('connected');
      expect(setArgs.connectedAt).not.toBeNull();
    });
  });

  describe('DataExportService', () => {
    let service: DataExportService;
    beforeEach(() => {
      service = new DataExportService({} as any);
      (service as any).db = mockDb;
    });

    it('should strip passwordHash and passwordSalt from employees on export', async () => {
      mockDb.get.mockResolvedValue({}); // for company, settings
      mockDb.all.mockResolvedValueOnce([{ id: 'emp-1', passwordHash: 'hash', passwordSalt: 'salt', name: 'John' }]); // for employees
      mockDb.all.mockResolvedValue([]); // for the rest
      
      const result = await service.exportAll('comp-1');
      expect(result.employees).toHaveLength(1);
      expect((result.employees[0] as any).passwordHash).toBeUndefined();
      expect((result.employees[0] as any).passwordSalt).toBeUndefined();
      expect(result.employees[0].name).toBe('John');
    });
  });
});
