import { D1Database } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, desc } from 'drizzle-orm';
import * as schema from '../db/schema';

export type AuditModule =
  | 'company'
  | 'settings'
  | 'roles'
  | 'departments'
  | 'locations'
  | 'workforce'
  | 'integrations'
  | 'workflows'
  | 'api'
  | 'holidays'
  | 'email'
  | 'payroll';

interface LogParams {
  // The employee who performed the action. Omit for system-initiated events.
  actorId?: string | null;
  // Who this entry is filed under. Defaults to actorId — pass a different
  // employeeId for actions taken *on* another employee (e.g. admin edits a
  // profile) so it also shows up on that employee's own Audit tab.
  subjectId?: string | null;
  action: string;
  module: AuditModule;
  details?: string;
  severity?: 'info' | 'warning';
  ip?: string | null;
}

// Company-wide, immutable trail of administrative actions. Writers call
// `log()` right after a mutation succeeds; readers hit `getCompanyLogs()`
// (Control Center > Audit Logs) or the existing per-employee query in
// EmployeeService (Employee Detail > Audit tab) — both read the same table.
export class AuditService {
  private db;

  constructor(dbBinding: D1Database) {
    this.db = drizzle(dbBinding, { schema });
  }

  async log(companyId: string, params: LogParams) {
    let actorName = 'System';
    if (params.actorId) {
      const actor = await this.db.query.employees.findFirst({
        where: eq(schema.employees.id, params.actorId),
      });
      if (actor) actorName = `${actor.name} ${actor.lastName}`.trim();
    }

    const id = `audit_${Math.random().toString(36).substring(2, 9)}${Date.now().toString(36)}`;
    return this.db.insert(schema.auditLogs).values({
      id,
      companyId,
      employeeId: params.subjectId || params.actorId || 'system',
      actorName,
      action: params.action,
      module: params.module,
      details: params.details || '',
      severity: params.severity || 'info',
      ipAddress: params.ip || null,
      createdAt: new Date().toISOString(),
    }).returning().get();
  }

  async getCompanyLogs(companyId: string, filters: { module?: string; search?: string; limit?: number } = {}) {
    const conditions = [eq(schema.auditLogs.companyId, companyId)];
    if (filters.module) conditions.push(eq(schema.auditLogs.module, filters.module));

    const rows = await this.db.select().from(schema.auditLogs)
      .where(and(...conditions))
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(filters.limit || 200)
      .all();

    if (!filters.search) return rows;
    const needle = filters.search.toLowerCase();
    return rows.filter((r) =>
      r.action.toLowerCase().includes(needle) ||
      r.actorName.toLowerCase().includes(needle) ||
      (r.details || '').toLowerCase().includes(needle)
    );
  }
}
