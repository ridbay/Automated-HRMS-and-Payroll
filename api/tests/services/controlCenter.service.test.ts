import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  HolidayService,
  EmailTemplateService,
  IntegrationService,
  WorkflowService,
  DataExportService,
  NotificationService,
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
      // 'slack' is excluded here — it now requires the dedicated connectSlack
      // flow (a webhook URL) rather than a bare toggle; see the Slack-specific
      // tests below.
      mockDb.query.integrations.findFirst.mockResolvedValueOnce({ key: 'zoom', status: 'connected' });
      mockDb.get.mockResolvedValueOnce({ key: 'zoom', status: 'available' });

      const result = await service.toggle('comp-1', 'zoom');
      expect(mockDb.update).toHaveBeenCalled();
      const setArgs = mockDb.set.mock.calls[0][0];
      expect(setArgs.status).toBe('available');
      expect(setArgs.connectedAt).toBeNull();
    });

    it('should toggle integration status from available to connected', async () => {
      mockDb.query.integrations.findFirst.mockResolvedValueOnce({ key: 'zoom', status: 'available' });
      mockDb.get.mockResolvedValueOnce({ key: 'zoom', status: 'connected' });

      const result = await service.toggle('comp-1', 'zoom');
      expect(mockDb.update).toHaveBeenCalled();
      const setArgs = mockDb.set.mock.calls[0][0];
      expect(setArgs.status).toBe('connected');
      expect(setArgs.connectedAt).not.toBeNull();
    });

    it('rejects toggling slack directly, pointing at the dedicated connect flow', async () => {
      mockDb.query.integrations.findFirst.mockResolvedValueOnce({ key: 'slack', status: 'available' });
      await expect(service.toggle('comp-1', 'slack')).rejects.toThrow('Use the Slack connect flow');
    });

    it('connectSlack validates the webhook URL shape', async () => {
      await expect(service.connectSlack('comp-1', 'https://example.com/not-slack')).rejects.toThrow(
        "doesn't look like a Slack Incoming Webhook URL"
      );
    });

    it('connectSlack stores the webhook URL and marks the integration connected', async () => {
      mockDb.all.mockResolvedValueOnce([{ key: 'slack', status: 'available' }]); // list() sees an existing row, skips reseeding

      await service.connectSlack('comp-1', 'https://hooks.slack.com/services/T000/B000/XXXX');
      expect(mockDb.update).toHaveBeenCalled();
      const setArgs = mockDb.set.mock.calls[0][0];
      expect(setArgs.status).toBe('connected');
      expect(setArgs.config).toEqual({ webhookUrl: 'https://hooks.slack.com/services/T000/B000/XXXX' });
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

  describe('NotificationService', () => {
    let service: NotificationService;
    beforeEach(() => {
      service = new NotificationService({} as any);
      (service as any).db = mockDb;
      vi.stubGlobal('fetch', vi.fn());
    });

    it('does nothing when Slack is not connected', async () => {
      mockDb.query.integrations.findFirst.mockResolvedValueOnce(undefined);
      await service.notify('comp-1', 'test', 'hello');
      expect(global.fetch).not.toHaveBeenCalled();
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('posts to the stored webhook and logs a "sent" event on success', async () => {
      mockDb.query.integrations.findFirst.mockResolvedValueOnce({
        key: 'slack',
        status: 'connected',
        config: { webhookUrl: 'https://hooks.slack.com/services/T000/B000/XXXX' },
      });
      (global.fetch as any).mockResolvedValueOnce({ ok: true, status: 200 });

      await service.notify('comp-1', 'payroll.paid', 'Payroll paid');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://hooks.slack.com/services/T000/B000/XXXX',
        expect.objectContaining({ method: 'POST', body: JSON.stringify({ text: 'Payroll paid' }) })
      );
      const eventValues = mockDb.values.mock.calls[0][0];
      expect(eventValues.status).toBe('sent');
      expect(eventValues.eventType).toBe('payroll.paid');
      expect(mockDb.update).not.toHaveBeenCalled(); // no lastError to record
    });

    it('logs a "failed" event and records lastError without throwing, on a non-2xx response', async () => {
      mockDb.query.integrations.findFirst.mockResolvedValueOnce({
        key: 'slack',
        status: 'connected',
        config: { webhookUrl: 'https://hooks.slack.com/services/T000/B000/XXXX' },
      });
      (global.fetch as any).mockResolvedValueOnce({ ok: false, status: 404 });

      await expect(service.notify('comp-1', 'test', 'hello')).resolves.not.toThrow();

      const eventValues = mockDb.values.mock.calls[0][0];
      expect(eventValues.status).toBe('failed');
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set.mock.calls[0][0].lastError).toContain('404');
    });

    it('logs a "failed" event and never throws when the fetch itself rejects (network error)', async () => {
      mockDb.query.integrations.findFirst.mockResolvedValueOnce({
        key: 'slack',
        status: 'connected',
        config: { webhookUrl: 'https://hooks.slack.com/services/T000/B000/XXXX' },
      });
      (global.fetch as any).mockRejectedValueOnce(new Error('network down'));

      await expect(service.notify('comp-1', 'test', 'hello')).resolves.not.toThrow();

      const eventValues = mockDb.values.mock.calls[0][0];
      expect(eventValues.status).toBe('failed');
      expect(mockDb.set.mock.calls[0][0].lastError).toBe('network down');
    });
  });
});
