import { D1Database } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema';
import { Bindings } from '../types';

const genId = (prefix: string) => `${prefix}_${Math.random().toString(36).substring(2, 9)}`;

export interface MailgunConfig {
  apiKey?: string;
  domain?: string;
  from?: string;
  baseUrl?: string;
}

export interface SendEmailOptions {
  companyId: string;
  to: string | string[];
  subject?: string;
  text?: string;
  html?: string;
  templateKey?: string;
  variables?: Record<string, any>;
  eventType?: string;
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  message?: string;
  simulated?: boolean;
  error?: string;
}

export class MailgunService {
  private db;

  constructor(private dbBinding: D1Database, private env?: Bindings) {
    this.db = drizzle(dbBinding, { schema });
  }

  /**
   * Resolves effective Mailgun credentials, preferring company-level integration settings
   * and falling back to Worker environment bindings.
   */
  async getConfig(companyId?: string): Promise<MailgunConfig> {
    let companyConfig: MailgunConfig = {};

    if (companyId) {
      try {
        const row = await this.db.query.integrations.findFirst({
          where: and(
            eq(schema.integrations.companyId, companyId),
            eq(schema.integrations.key, 'mailgun'),
            eq(schema.integrations.status, 'connected')
          ),
        });
        if (row?.config && typeof row.config === 'object') {
          companyConfig = row.config as MailgunConfig;
        }
      } catch {
        // Table or query failure falls back to env
      }
    }

    const apiKey = companyConfig.apiKey || this.env?.MAILGUN_API_KEY;
    const domain = companyConfig.domain || this.env?.MAILGUN_DOMAIN;
    const baseUrl = (companyConfig.baseUrl || this.env?.MAILGUN_BASE_URL || 'https://api.mailgun.net/v3').replace(/\/+$/, '');
    const from =
      companyConfig.from ||
      this.env?.MAILGUN_FROM ||
      (domain ? `ZenHR <notifications@${domain}>` : 'ZenHR <notifications@mg.zenhr.app>');

    return { apiKey, domain, from, baseUrl };
  }

  /**
   * Returns true if valid Mailgun API credentials are configured.
   */
  async isConfigured(companyId?: string): Promise<boolean> {
    const config = await this.getConfig(companyId);
    return Boolean(config.apiKey && config.domain);
  }

  /**
   * Simple variable interpolator replacing {{variable}} or {{ variable }} in text.
   */
  renderTemplate(content: string, variables: Record<string, any> = {}): string {
    return content.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key) => {
      const val = variables[key];
      return val !== undefined && val !== null ? String(val) : '';
    });
  }

  /**
   * Connects or updates company-level Mailgun integration configuration.
   */
  async connectMailgun(companyId: string, config: MailgunConfig) {
    if (!config.apiKey || !config.domain) {
      throw new Error('Mailgun API Key and Domain are required.');
    }

    return this.db
      .update(schema.integrations)
      .set({
        status: 'connected',
        connectedAt: new Date().toISOString(),
        config: {
          apiKey: config.apiKey,
          domain: config.domain,
          from: config.from,
          baseUrl: config.baseUrl,
        },
        lastError: null,
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(schema.integrations.companyId, companyId), eq(schema.integrations.key, 'mailgun')))
      .returning()
      .get();
  }

  /**
   * Core email dispatch method.
   * Renders email templates if templateKey is passed, supports raw HTML/text,
   * dispatches via Mailgun REST API with Basic Auth, or falls back to simulation in dev/sandbox.
   */
  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    const { companyId, to, templateKey, variables = {}, eventType = 'email.sent' } = options;
    const recipientList = Array.isArray(to) ? to : [to];
    const toHeader = recipientList.join(', ');

    let subject = options.subject || '';
    let bodyText = options.text || '';
    let bodyHtml = options.html || '';

    // If templateKey is provided, lookup template from database
    if (templateKey) {
      try {
        const tmpl = await this.db.query.emailTemplates.findFirst({
          where: and(eq(schema.emailTemplates.companyId, companyId), eq(schema.emailTemplates.key, templateKey)),
        });
        if (tmpl) {
          subject = this.renderTemplate(tmpl.subject, variables);
          bodyText = this.renderTemplate(tmpl.body, variables);
        }
      } catch {
        // Fallback to in-memory defaults if DB query fails
      }

      if (!bodyHtml && bodyText) {
        bodyHtml = bodyText
          .split('\n\n')
          .map((p) => `<p style="margin-bottom: 16px; line-height: 1.5;">${p.replace(/\n/g, '<br/>')}</p>`)
          .join('');
        bodyHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <div style="margin-bottom: 24px; border-bottom: 2px solid #6366f1; padding-bottom: 12px;">
              <h2 style="margin: 0; color: #4338ca; font-size: 20px;">ZenHR</h2>
            </div>
            ${bodyHtml}
            <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
              This is an automated notification sent from ZenHR Automated HRMS & Payroll.
            </div>
          </div>
        `;
      }
    }

    const config = await this.getConfig(companyId);
    const isLive = Boolean(config.apiKey && config.domain);

    // Simulated dispatch when API key or domain is not configured
    if (!isLive) {
      const simulatedId = `sim_mg_${genId('msg')}`;
      const payloadSummary = `[SIMULATED] To: ${toHeader} | Subject: ${subject}`;

      try {
        await this.db.insert(schema.integrationEvents).values({
          id: genId('evt'),
          companyId,
          integrationKey: 'mailgun',
          eventType,
          payloadSummary: payloadSummary.slice(0, 500),
          status: 'sent',
          responseCode: 200,
        });
      } catch {
        // Logging failure should not break caller
      }

      return {
        success: true,
        id: simulatedId,
        message: 'Email simulated (Mailgun credentials not configured)',
        simulated: true,
      };
    }

    // Live dispatch to Mailgun API
    try {
      const authHeader = `Basic ${btoa(`api:${config.apiKey}`)}`;
      const formData = new FormData();
      formData.append('from', config.from || `ZenHR <notifications@${config.domain}>`);
      formData.append('to', toHeader);
      formData.append('subject', subject);
      if (bodyText) formData.append('text', bodyText);
      if (bodyHtml) formData.append('html', bodyHtml);

      const endpoint = `${config.baseUrl}/${config.domain}/messages`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
        },
        body: formData,
      });

      const responseBody = await response.text();
      let parsed: any = {};
      try {
        parsed = JSON.parse(responseBody);
      } catch {
        parsed = { message: responseBody };
      }

      const status = response.ok ? 'sent' : 'failed';
      const summary = `To: ${toHeader} | Subject: ${subject}`;

      try {
        await this.db.insert(schema.integrationEvents).values({
          id: genId('evt'),
          companyId,
          integrationKey: 'mailgun',
          eventType,
          payloadSummary: summary.slice(0, 500),
          status,
          responseCode: response.status,
        });

        if (!response.ok) {
          await this.db
            .update(schema.integrations)
            .set({ lastError: `Mailgun HTTP ${response.status}: ${parsed.message || responseBody}` })
            .where(and(eq(schema.integrations.companyId, companyId), eq(schema.integrations.key, 'mailgun')));
        }
      } catch {
        // Best effort event logging
      }

      if (!response.ok) {
        return {
          success: false,
          error: `Mailgun returned ${response.status}: ${parsed.message || responseBody}`,
        };
      }

      return {
        success: true,
        id: parsed.id,
        message: parsed.message || 'Queued. Thank you.',
      };
    } catch (err: any) {
      try {
        await this.db.insert(schema.integrationEvents).values({
          id: genId('evt'),
          companyId,
          integrationKey: 'mailgun',
          eventType,
          payloadSummary: `To: ${toHeader} | Error: ${err.message}`.slice(0, 500),
          status: 'failed',
          responseCode: 500,
        });
      } catch {
        // Best effort
      }

      return {
        success: false,
        error: err.message || 'Network error communicating with Mailgun API',
      };
    }
  }

  // --- Domain-Specific Convenience Methods ---

  async sendWelcomeEmail(companyId: string, employee: {
    email: string;
    firstName: string;
    lastName: string;
    jobTitle: string;
    startDate?: string;
    managerName?: string;
    companyName?: string;
  }) {
    return this.sendEmail({
      companyId,
      to: employee.email,
      templateKey: 'welcome_email',
      eventType: 'employee.welcome',
      variables: {
        employee_first_name: employee.firstName,
        employee_last_name: employee.lastName,
        job_title: employee.jobTitle,
        start_date: employee.startDate || 'soon',
        manager_name: employee.managerName || 'your manager',
        company_name: employee.companyName || 'the company',
      },
    });
  }

  async sendLeaveStatusEmail(companyId: string, details: {
    email: string;
    firstName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    approverName: string;
    status: 'approved' | 'rejected';
    rejectionReason?: string;
  }) {
    const templateKey = details.status === 'approved' ? 'leave_approved' : 'leave_rejected';
    return this.sendEmail({
      companyId,
      to: details.email,
      templateKey,
      eventType: `leave.${details.status}`,
      variables: {
        employee_first_name: details.firstName,
        leave_type: details.leaveType,
        start_date: details.startDate,
        end_date: details.endDate,
        approver_name: details.approverName,
        rejection_reason: details.rejectionReason || 'Operational constraints',
      },
    });
  }

  async sendPayslipNotification(companyId: string, details: {
    email: string;
    firstName: string;
    payPeriod: string;
    netPay: string;
    companyDomain?: string;
  }) {
    return this.sendEmail({
      companyId,
      to: details.email,
      templateKey: 'payslip_notification',
      eventType: 'payroll.payslip_ready',
      variables: {
        employee_first_name: details.firstName,
        pay_period: details.payPeriod,
        net_pay: details.netPay,
        company_domain: details.companyDomain || 'zenhr.app',
      },
    });
  }

  async sendOfferLetter(companyId: string, candidate: {
    email: string;
    firstName: string;
    jobTitle: string;
    managerName?: string;
    startDate?: string;
    companyName?: string;
  }) {
    return this.sendEmail({
      companyId,
      to: candidate.email,
      templateKey: 'offer_letter',
      eventType: 'candidate.offer_sent',
      variables: {
        employee_first_name: candidate.firstName,
        job_title: candidate.jobTitle,
        manager_name: candidate.managerName || 'the team lead',
        start_date: candidate.startDate || 'TBD',
        company_name: candidate.companyName || 'our company',
      },
    });
  }
}
