import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MailgunService } from '../../src/services/mailgun.service';

describe('MailgunService', () => {
  let service: MailgunService;
  let mockDb: any;
  let mockEnv: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDb = {
      query: {
        integrations: {
          findFirst: vi.fn(),
        },
        emailTemplates: {
          findFirst: vi.fn(),
        },
      },
      insert: vi.fn(() => ({
        values: vi.fn().mockResolvedValue([]),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn(() => ({
              get: vi.fn().mockResolvedValue({ status: 'connected' }),
            })),
          })),
        })),
      })),
    };

    mockEnv = {
      MAILGUN_API_KEY: 'test-mg-key',
      MAILGUN_DOMAIN: 'mg.zenhr.test',
      MAILGUN_FROM: 'ZenHR <notifications@mg.zenhr.test>',
      MAILGUN_BASE_URL: 'https://api.mailgun.net/v3',
    };

    service = new MailgunService({} as any, mockEnv);
    (service as any).db = mockDb;
  });

  describe('renderTemplate', () => {
    it('should correctly interpolate template variables', () => {
      const template = 'Hello {{employee_first_name}}, welcome to {{company_name}}!';
      const rendered = service.renderTemplate(template, {
        employee_first_name: 'Amaka',
        company_name: 'Zenith Labs',
      });
      expect(rendered).toBe('Hello Amaka, welcome to Zenith Labs!');
    });

    it('should support spacing inside brackets {{ name }}', () => {
      const template = 'Dear {{ name }}, your net pay is {{ net_pay }}.';
      const rendered = service.renderTemplate(template, {
        name: 'Tunde',
        net_pay: '₦350,000',
      });
      expect(rendered).toBe('Dear Tunde, your net pay is ₦350,000.');
    });

    it('should replace missing variables with empty string', () => {
      const template = 'Hello {{first_name}} {{last_name}}!';
      const rendered = service.renderTemplate(template, { first_name: 'Chioma' });
      expect(rendered).toBe('Hello Chioma !');
    });
  });

  describe('configuration & credentials', () => {
    it('should recognize configured credentials from env', async () => {
      expect(await service.isConfigured()).toBe(true);
      const config = await service.getConfig();
      expect(config.apiKey).toBe('test-mg-key');
      expect(config.domain).toBe('mg.zenhr.test');
      expect(config.from).toBe('ZenHR <notifications@mg.zenhr.test>');
    });

    it('should prioritize company-level integration over env', async () => {
      mockDb.query.integrations.findFirst.mockResolvedValueOnce({
        status: 'connected',
        config: {
          apiKey: 'custom-company-key',
          domain: 'mail.customcompany.com',
          from: 'Custom HR <hr@customcompany.com>',
        },
      });

      const config = await service.getConfig('comp-123');
      expect(config.apiKey).toBe('custom-company-key');
      expect(config.domain).toBe('mail.customcompany.com');
      expect(config.from).toBe('Custom HR <hr@customcompany.com>');
    });

    it('should fail connectMailgun if apiKey or domain is missing', async () => {
      await expect(
        service.connectMailgun('comp-123', { apiKey: '' } as any)
      ).rejects.toThrow('Mailgun API Key and Domain are required.');
    });
  });

  describe('sendEmail simulated & live', () => {
    it('should simulate dispatch when unconfigured', async () => {
      const unconfigured = new MailgunService({} as any, {} as any);
      (unconfigured as any).db = mockDb;

      const result = await unconfigured.sendEmail({
        companyId: 'comp-1',
        to: 'employee@test.com',
        subject: 'Welcome to ZenHR',
        text: 'Welcome!',
      });

      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);
      expect(result.id).toMatch(/^sim_mg_/);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should make an HTTP Basic Auth POST request to Mailgun when configured', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ id: '<mg-msg-123@mailgun.org>', message: 'Queued. Thank you.' }),
      });
      globalThis.fetch = mockFetch;

      const result = await service.sendEmail({
        companyId: 'comp-1',
        to: 'staff@example.com',
        subject: 'Payslip Ready',
        text: 'Your payslip is available.',
      });

      expect(result.success).toBe(true);
      expect(result.id).toBe('<mg-msg-123@mailgun.org>');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.mailgun.net/v3/mg.zenhr.test/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Basic '),
          }),
        })
      );
    });

    it('should format domain convenience methods properly', async () => {
      const spy = vi.spyOn(service, 'sendEmail').mockResolvedValue({ success: true, id: 'test-id' });

      await service.sendWelcomeEmail('comp-1', {
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        jobTitle: 'Developer',
      });

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: 'comp-1',
          to: 'john@example.com',
          templateKey: 'welcome_email',
          eventType: 'employee.welcome',
        })
      );
    });
  });
});
