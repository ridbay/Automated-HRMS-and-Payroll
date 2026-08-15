import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsService } from './settings.service';

describe('Settings Service', () => {
  let mockDb: any;
  let service: SettingsService;

  beforeEach(() => {
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue(null), // Default to returning null for get
      all: vi.fn().mockResolvedValue([]),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnThis(),
    };

    service = new SettingsService({} as any);
    (service as any).db = mockDb;
  });

  describe('getSettings', () => {
    it('should return default settings if not found in db', async () => {
      const result = await service.getSettings('comp-1');
      expect(result.companyId).toBe('comp-1');
      expect(result.require2fa).toBe(false);
      expect(result.attendanceGraceMinutes).toBe(15);
      expect(mockDb.get).toHaveBeenCalled();
    });

    it('should return settings if found in db', async () => {
      mockDb.get.mockResolvedValueOnce({ companyId: 'comp-1', require2fa: true });
      const result = await service.getSettings('comp-1');
      expect(result.require2fa).toBe(true);
    });
  });

  describe('updateSettings', () => {
    it('should insert new settings if they do not exist', async () => {
      mockDb.get.mockResolvedValueOnce(null); // No existing settings
      mockDb.get.mockResolvedValueOnce({ companyId: 'comp-1', require2fa: true }); // Returning from insert
      
      const payload = { require2fa: true };
      const result = await service.updateSettings('comp-1', payload);
      
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalled();
      expect(mockDb.update).not.toHaveBeenCalled();
    });

    it('should update existing settings if they exist', async () => {
      mockDb.get.mockResolvedValueOnce({ companyId: 'comp-1', require2fa: false }); // Existing settings
      mockDb.get.mockResolvedValueOnce({ companyId: 'comp-1', require2fa: true }); // Returning from update
      
      const payload = { require2fa: true };
      const result = await service.updateSettings('comp-1', payload);
      
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalled();
      expect(mockDb.insert).not.toHaveBeenCalled();
    });
  });

  describe('API Keys', () => {
    it('should fetch all API keys for a company', async () => {
      mockDb.all.mockResolvedValueOnce([{ id: 'key-1', name: 'Test Key' }]);
      const result = await service.getApiKeys('comp-1');
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Key');
      expect(mockDb.all).toHaveBeenCalled();
    });

    it('should create a new API key', async () => {
      mockDb.get.mockResolvedValueOnce({ id: 'key-1', name: 'Test Key', key: 'zk_test_123' });
      const result = await service.createApiKey('comp-1', 'Test Key');
      
      expect(result.name).toBe('Test Key');
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalled();
      const insertValues = mockDb.values.mock.calls[0][0];
      expect(insertValues.companyId).toBe('comp-1');
      expect(insertValues.name).toBe('Test Key');
      expect(insertValues.key).toMatch(/^zk_test_/);
    });

    it('should delete an API key', async () => {
      mockDb.get.mockResolvedValueOnce({ id: 'key-1' });
      const result = await service.deleteApiKey('comp-1', 'key-1');
      
      expect(mockDb.delete).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
      expect(mockDb.returning).toHaveBeenCalled();
    });
  });
});
