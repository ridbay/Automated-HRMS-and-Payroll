import { D1Database } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, desc } from 'drizzle-orm';
import * as schema from '../db/schema';

const genId = (prefix: string) => `${prefix}_${Math.random().toString(36).substring(2, 9)}`;

// ---------------- Public Holidays ----------------
export class HolidayService {
  private db;
  constructor(dbBinding: D1Database) {
    this.db = drizzle(dbBinding, { schema });
  }

  async list(companyId: string) {
    return this.db.select().from(schema.publicHolidays)
      .where(eq(schema.publicHolidays.companyId, companyId))
      .orderBy(schema.publicHolidays.date)
      .all();
  }

  async create(companyId: string, data: { name: string; date: string }) {
    return this.db.insert(schema.publicHolidays)
      .values({ id: genId('hol'), companyId, name: data.name, date: data.date, createdAt: new Date().toISOString() })
      .returning()
      .get();
  }

  async delete(companyId: string, id: string) {
    return this.db.delete(schema.publicHolidays)
      .where(and(eq(schema.publicHolidays.id, id), eq(schema.publicHolidays.companyId, companyId)))
      .returning()
      .get();
  }
}

// ---------------- Email Templates ----------------
const DEFAULT_EMAIL_TEMPLATES = [
  {
    key: 'welcome_email',
    name: 'Welcome Email',
    subject: 'Welcome to {{company_name}}, {{employee_first_name}}!',
    body: "Hi {{employee_first_name}},\n\nWelcome aboard! We're thrilled to have you join {{company_name}} as {{job_title}}, starting {{start_date}}.\n\nYour manager, {{manager_name}}, will be in touch shortly with your first-week schedule. In the meantime, please complete your onboarding checklist in ZenHR.\n\nWelcome to the team!\n{{company_name}} HR",
  },
  {
    key: 'offer_letter',
    name: 'Offer Letter',
    subject: 'Your Offer from {{company_name}}',
    body: "Dear {{employee_first_name}},\n\nWe are delighted to offer you the position of {{job_title}} at {{company_name}}, reporting to {{manager_name}}, with a proposed start date of {{start_date}}.\n\nPlease review the attached offer details and confirm your acceptance by replying to this email.\n\nCongratulations!\n{{company_name}} HR",
  },
  {
    key: 'payslip_notification',
    name: 'Payslip Notification',
    subject: 'Your payslip for {{pay_period}} is ready',
    body: 'Hi {{employee_first_name}},\n\nYour payslip for {{pay_period}} has been generated and is now available in ZenHR under My Payroll.\n\nNet pay: {{net_pay}}\n\nIf you have any questions, reach out to payroll@{{company_domain}}.',
  },
  {
    key: 'leave_approved',
    name: 'Leave Request Approved',
    subject: 'Your leave request has been approved',
    body: 'Hi {{employee_first_name}},\n\nGood news — your {{leave_type}} request from {{start_date}} to {{end_date}} has been approved by {{approver_name}}.\n\nEnjoy your time off!',
  },
  {
    key: 'leave_rejected',
    name: 'Leave Request Declined',
    subject: 'Update on your leave request',
    body: 'Hi {{employee_first_name}},\n\nYour {{leave_type}} request from {{start_date}} to {{end_date}} could not be approved at this time.\n\nReason: {{rejection_reason}}\n\nPlease reach out to {{approver_name}} if you have questions.',
  },
];

export class EmailTemplateService {
  private db;
  constructor(dbBinding: D1Database) {
    this.db = drizzle(dbBinding, { schema });
  }

  async list(companyId: string) {
    const existing = await this.db.select().from(schema.emailTemplates)
      .where(eq(schema.emailTemplates.companyId, companyId))
      .all();
    if (existing.length > 0) return existing;

    const now = new Date().toISOString();
    const seeded = DEFAULT_EMAIL_TEMPLATES.map((t) => ({
      id: genId('tmpl'),
      companyId,
      key: t.key,
      name: t.name,
      subject: t.subject,
      body: t.body,
      createdAt: now,
    }));
    for (const row of seeded) {
      await this.db.insert(schema.emailTemplates).values(row);
    }
    return this.db.select().from(schema.emailTemplates)
      .where(eq(schema.emailTemplates.companyId, companyId))
      .all();
  }

  async update(companyId: string, key: string, data: { subject?: string; body?: string }) {
    return this.db.update(schema.emailTemplates)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(and(eq(schema.emailTemplates.companyId, companyId), eq(schema.emailTemplates.key, key)))
      .returning()
      .get();
  }
}

// ---------------- Integrations ----------------
// Slack is the one real integration (see connectSlack/NotificationService
// below) — it now seeds as 'available' like everything else, since actually
// reaching 'connected' requires an admin to paste a real webhook URL rather
// than being pre-faked on. The rest of the catalog stays exactly what it
// was: an on/off state with no live handshake behind it yet.
const DEFAULT_INTEGRATIONS = [
  { key: 'google_calendar', name: 'Google Calendar', category: 'Scheduling', status: 'connected' },
  { key: 'slack', name: 'Slack Notifications', category: 'Communication', status: 'available' },
  { key: 'paystack', name: 'Paystack Bank', category: 'Fintech', status: 'connected' },
  { key: 'outlook', name: 'Microsoft Outlook', category: 'Communications', status: 'available' },
  { key: 'zoom', name: 'Zoom Conferencing', category: 'Video', status: 'available' },
  { key: 'quickbooks', name: 'QuickBooks Accounting', category: 'Finance', status: 'available' },
];

export class IntegrationService {
  private db;
  constructor(dbBinding: D1Database) {
    this.db = drizzle(dbBinding, { schema });
  }

  async list(companyId: string) {
    const existing = await this.db.select().from(schema.integrations)
      .where(eq(schema.integrations.companyId, companyId))
      .all();
    if (existing.length > 0) return existing;

    const now = new Date().toISOString();
    const seeded = DEFAULT_INTEGRATIONS.map((i) => ({
      id: genId('intg'),
      companyId,
      key: i.key,
      name: i.name,
      category: i.category,
      status: i.status,
      connectedAt: i.status === 'connected' ? now : null,
      createdAt: now,
    }));
    for (const row of seeded) {
      await this.db.insert(schema.integrations).values(row);
    }
    return this.db.select().from(schema.integrations)
      .where(eq(schema.integrations.companyId, companyId))
      .all();
  }

  async toggle(companyId: string, key: string) {
    const current = await this.db.query.integrations.findFirst({
      where: and(eq(schema.integrations.companyId, companyId), eq(schema.integrations.key, key)),
    });
    if (!current) return null;
    // Slack's "connected" state requires a real webhook URL — routed through
    // connectSlack/disconnect below, not the generic toggle.
    if (key === 'slack') throw new Error('Use the Slack connect flow (a webhook URL is required) instead of toggle');

    const nextStatus = current.status === 'connected' ? 'available' : 'connected';
    return this.db.update(schema.integrations)
      .set({
        status: nextStatus,
        connectedAt: nextStatus === 'connected' ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(schema.integrations.companyId, companyId), eq(schema.integrations.key, key)))
      .returning()
      .get();
  }

  async connectSlack(companyId: string, webhookUrl: string) {
    if (!/^https:\/\/hooks\.slack\.com\/services\/.+/.test(webhookUrl)) {
      throw new Error('That doesn\'t look like a Slack Incoming Webhook URL (should start with https://hooks.slack.com/services/...)');
    }
    await this.list(companyId); // ensure the row exists (seeds on first read)
    return this.db.update(schema.integrations)
      .set({
        status: 'connected',
        connectedAt: new Date().toISOString(),
        config: { webhookUrl },
        lastError: null,
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(schema.integrations.companyId, companyId), eq(schema.integrations.key, 'slack')))
      .returning()
      .get();
  }

  async disconnect(companyId: string, key: string) {
    return this.db.update(schema.integrations)
      .set({ status: 'available', connectedAt: null, config: null, lastError: null, updatedAt: new Date().toISOString() })
      .where(and(eq(schema.integrations.companyId, companyId), eq(schema.integrations.key, key)))
      .returning()
      .get();
  }

  async getEvents(companyId: string, key: string, limit = 20) {
    return this.db.select().from(schema.integrationEvents)
      .where(and(eq(schema.integrationEvents.companyId, companyId), eq(schema.integrationEvents.integrationKey, key)))
      .orderBy(desc(schema.integrationEvents.createdAt))
      .limit(limit)
      .all();
  }
}

// Central dispatcher for outbound integration notifications. Called from
// controllers right after a mutation succeeds (requisition approval,
// payroll paid, offer sent/accepted) — always fire-and-forget from the
// caller's perspective: a broken webhook logs a failed delivery and sets
// `lastError` but never throws, so it can't break the underlying HR action.
export class NotificationService {
  private db;
  constructor(dbBinding: D1Database) {
    this.db = drizzle(dbBinding, { schema });
  }

  async notify(companyId: string, eventType: string, message: string) {
    const slack = await this.db.query.integrations.findFirst({
      where: and(eq(schema.integrations.companyId, companyId), eq(schema.integrations.key, 'slack'), eq(schema.integrations.status, 'connected')),
    });
    const webhookUrl = (slack?.config as any)?.webhookUrl;
    if (!webhookUrl) return; // not connected — nothing to do, not an error

    let status: 'sent' | 'failed' = 'sent';
    let responseCode: number | null = null;
    let errorMessage: string | null = null;

    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message }),
      });
      responseCode = res.status;
      if (!res.ok) {
        status = 'failed';
        errorMessage = `Slack responded ${res.status}`;
      }
    } catch (err: any) {
      status = 'failed';
      errorMessage = err?.message || 'Network error delivering to Slack';
    }

    await this.db.insert(schema.integrationEvents).values({
      id: genId('evt'),
      companyId,
      integrationKey: 'slack',
      eventType,
      payloadSummary: message.slice(0, 500),
      status,
      responseCode,
    });

    if (status === 'failed') {
      await this.db.update(schema.integrations)
        .set({ lastError: errorMessage, updatedAt: new Date().toISOString() })
        .where(and(eq(schema.integrations.companyId, companyId), eq(schema.integrations.key, 'slack')));
    }
  }
}

// ---------------- Workflows ----------------
type WorkflowStep = { id: string; name: string; assignee: string };

const DEFAULT_WORKFLOWS: { key: string; name: string; description: string; steps: WorkflowStep[] }[] = [
  {
    key: 'onboarding',
    name: 'Onboarding Pipeline',
    description: 'Automated steps, triggers, and assignees for new hires.',
    steps: [
      { id: 's1', name: 'Send offer & welcome email', assignee: 'HR Admin' },
      { id: 's2', name: 'Collect statutory documents (TIN, PFA, bank details)', assignee: 'HR Admin' },
      { id: 's3', name: 'Provision system access & equipment', assignee: 'IT Admin' },
      { id: 's4', name: 'Assign onboarding buddy & schedule orientation', assignee: 'Manager' },
      { id: 's5', name: '5-day access verification check-in', assignee: 'Line Manager' },
    ],
  },
  {
    key: 'offboarding',
    name: 'Offboarding Pipeline',
    description: 'Handover, access revocation, and final settlement steps for exits.',
    steps: [
      { id: 's1', name: 'Confirm last working day & handover plan', assignee: 'Manager' },
      { id: 's2', name: 'Conduct exit interview', assignee: 'HR Admin' },
      { id: 's3', name: 'Revoke system access & collect assets', assignee: 'IT Admin' },
      { id: 's4', name: 'Process final settlement & documentation', assignee: 'Payroll Officer' },
    ],
  },
  {
    key: 'leave_approvals',
    name: 'Leave Approvals',
    description: 'Routing and sign-off chain for employee leave requests.',
    steps: [
      { id: 's1', name: 'Employee submits request', assignee: 'Employee' },
      { id: 's2', name: 'Line manager reviews & approves', assignee: 'Manager' },
      { id: 's3', name: 'HR verifies balance & confirms', assignee: 'HR Admin' },
    ],
  },
  {
    key: 'payroll_locking',
    name: 'Payroll Locking',
    description: 'Month-end lock sequence before a payroll run is disbursed.',
    steps: [
      { id: 's1', name: 'Attendance & timesheets lock at month end', assignee: 'System' },
      { id: 's2', name: 'Payroll officer reviews & submits run', assignee: 'Payroll Officer' },
      { id: 's3', name: 'Admin approves before disbursement', assignee: 'HR Admin' },
    ],
  },
];

export class WorkflowService {
  private db;
  constructor(dbBinding: D1Database) {
    this.db = drizzle(dbBinding, { schema });
  }

  async list(companyId: string) {
    const existing = await this.db.select().from(schema.workflows)
      .where(eq(schema.workflows.companyId, companyId))
      .all();
    if (existing.length > 0) return existing;

    const now = new Date().toISOString();
    const seeded = DEFAULT_WORKFLOWS.map((w) => ({
      id: genId('wf'),
      companyId,
      key: w.key,
      name: w.name,
      description: w.description,
      steps: w.steps,
      enabled: true,
      createdAt: now,
    }));
    for (const row of seeded) {
      await this.db.insert(schema.workflows).values(row);
    }
    return this.db.select().from(schema.workflows)
      .where(eq(schema.workflows.companyId, companyId))
      .all();
  }

  async update(companyId: string, key: string, data: { steps?: WorkflowStep[]; enabled?: boolean; description?: string }) {
    return this.db.update(schema.workflows)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(and(eq(schema.workflows.companyId, companyId), eq(schema.workflows.key, key)))
      .returning()
      .get();
  }
}

// ---------------- Data & Backup ----------------
export class DataExportService {
  private db;
  constructor(dbBinding: D1Database) {
    this.db = drizzle(dbBinding, { schema });
  }

  async getStats(companyId: string) {
    const [employees, departments, locations, documents, payrollRuns, requisitions] = await Promise.all([
      this.db.select().from(schema.employees).where(eq(schema.employees.companyId, companyId)).all(),
      this.db.select().from(schema.departments).where(eq(schema.departments.companyId, companyId)).all(),
      this.db.select().from(schema.locations).where(eq(schema.locations.companyId, companyId)).all(),
      this.db.select().from(schema.employeeDocuments).where(eq(schema.employeeDocuments.companyId, companyId)).all(),
      this.db.select().from(schema.payrollRuns).where(eq(schema.payrollRuns.companyId, companyId)).all(),
      this.db.select().from(schema.jobRequisitions).where(eq(schema.jobRequisitions.companyId, companyId)).all(),
    ]);

    return {
      employees: employees.length,
      activeEmployees: employees.filter((e: any) => e.status === 'active').length,
      departments: departments.length,
      locations: locations.length,
      documents: documents.length,
      payrollRuns: payrollRuns.length,
      jobRequisitions: requisitions.length,
    };
  }

  // Sanitized JSON snapshot of the company's core records — no password
  // hashes/salts, no raw document file bytes (R2 keys only).
  async exportAll(companyId: string) {
    const [company, settings, employees, departments, locations, roles, payrollRuns] = await Promise.all([
      this.db.select().from(schema.companies).where(eq(schema.companies.id, companyId)).get(),
      this.db.select().from(schema.companySettings).where(eq(schema.companySettings.companyId, companyId)).get(),
      this.db.select().from(schema.employees).where(eq(schema.employees.companyId, companyId)).all(),
      this.db.select().from(schema.departments).where(eq(schema.departments.companyId, companyId)).all(),
      this.db.select().from(schema.locations).where(eq(schema.locations.companyId, companyId)).all(),
      this.db.select().from(schema.roles).where(eq(schema.roles.companyId, companyId)).all(),
      this.db.select().from(schema.payrollRuns).where(eq(schema.payrollRuns.companyId, companyId)).all(),
    ]);

    const safeEmployees = employees.map(({ passwordHash, passwordSalt, ...rest }: any) => rest);

    return {
      exportedAt: new Date().toISOString(),
      company,
      settings,
      employees: safeEmployees,
      departments,
      locations,
      roles,
      payrollRuns,
    };
  }
}
