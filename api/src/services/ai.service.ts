import { D1Database, Ai, AiSearchInstance } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, like, ne, or } from 'drizzle-orm';
import * as schema from '../db/schema';
import { PayrollService } from './payroll.service';
import { CompanyDocumentService } from './companyDocument.service';
import { EmployeeService } from './employee.service';
import { AiSearchService } from './aiSearch.service';

const genId = (prefix: string) => `${prefix}-${crypto.randomUUID().split('-')[0].toUpperCase()}`;

// Workers AI function-calling model — Cloudflare's embedded tool-calling
// contract returns already-parsed `tool_calls: [{ name, arguments }]` on the
// result object (not the OpenAI-style nested `function.arguments` JSON string).
const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const MAX_TOOL_ITERATIONS = 4;

export interface AiCaller {
  companyId: string;
  employeeId: string;
  role: string;
}

const PRIVILEGED_ROLES = ['SUPER_ADMIN', 'HR_ADMIN'];
const isPrivileged = (role: string) => PRIVILEGED_ROLES.includes(role);

const TOOL_SCHEMAS = [
  {
    name: 'getEmployee',
    description:
      "Look up a single employee. Admins/HR get the full profile (title, department, manager, hire date, status) for anyone; managers get the full profile for themselves or their direct reports. For anyone else, this returns only public directory info (name, title, department, manager, work email, location) — the same info visible to every employee on the Team Directory page — never salary, leave, performance, or other classified data.",
    parameters: {
      type: 'object',
      properties: { employeeId: { type: 'string', description: 'The employee id to look up. Omit to mean "me".' } },
    },
  },
  {
    name: 'searchEmployees',
    description:
      "Search employees company-wide by name, optionally filtered by department. HR Admin / Super Admin get full results; every other role gets public directory info only (name, title, department, manager) — available to everyone, not just admins.",
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Name (or partial name) to search for.' },
        departmentId: { type: 'string' },
      },
    },
  },
  {
    name: 'getLeaveBalance',
    description: "Get an employee's leave balances by type (total entitlement and days already taken this year).",
    parameters: {
      type: 'object',
      properties: { employeeId: { type: 'string', description: 'Omit to mean "me".' } },
    },
  },
  {
    name: 'getPendingLeaveRequests',
    description: 'List pending leave requests awaiting approval. Managers see only their own team; HR Admin/Super Admin see everyone.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'getHeadcount',
    description: 'Current employee headcount and total staff numbers (total staff, plus breakdown by status like active, notice, probation, etc.). Managers get their own team size; HR Admin/Super Admin get the whole company (optionally filtered by departmentId).',
    parameters: { type: 'object', properties: { departmentId: { type: 'string' } } },
  },
  {
    name: 'getPayrollSummary',
    description: 'Aggregate payroll totals (gross, net, tax, pension, employee count) for a given month — never individual salaries. HR Admin / Super Admin only.',
    parameters: {
      type: 'object',
      properties: { month: { type: 'number', description: '1-12' }, year: { type: 'number' } },
    },
  },
  {
    name: 'getOpenRequisitions',
    description: 'List currently open job requisitions (title, department, location, days open).',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'getComplianceTasksDue',
    description: 'List pending statutory compliance/remittance tasks (PAYE, pension, NHF, NSITF, ITF) with due dates and amounts. HR Admin / Super Admin only.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'searchCompanyDocuments',
    description:
      "Search the company's knowledge base — policy documents, the employee handbook, FAQs, and any other reference material HR/Admin has uploaded. Use this for any question about company policy, process, or general information that isn't covered by another tool. Available to every role.",
    parameters: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Keywords from the question to search for.' } },
      required: ['query'],
    },
  },
] as const;

const SYSTEM_PROMPT = (caller: AiCaller) =>
  `You are the ZenHR assistant, embedded in a Nigerian HRMS & payroll platform. The person asking is employee ${caller.employeeId} with role ${caller.role}. ` +
  `For simple greetings or general conversational pleasantries (like "hi", "hello", "hey"), greet the user politely and offer help without calling any tools or looking up their profile. ` +
  `Answer factual questions about employees, leave, payroll, company documents, or compliance using the provided tools — never invent numbers or facts. ` +
  `Once a tool provides the necessary information, synthesize the final answer directly without calling the tool again. ` +
  `Every employee, regardless of role, can ask about a coworker's public directory info (title, department, manager, work email) via getEmployee/searchEmployees — that's not privileged data. ` +
  `For questions about company policy, process, or "how does X work here", use searchCompanyDocuments before answering from general knowledge — this company's own documents take priority over anything you already know. ` +
  `If searchCompanyDocuments returns no matches, say plainly that nothing in the company's uploaded documents covers it rather than guessing. When you do answer from a document, name which document it came from. ` +
  `If a tool result contains an "error" field, that means the question is outside what this person is allowed to see — explain that plainly and don't try another tool to work around it. ` +
  `Keep answers concise and concrete.`;

export class AiService {
  private db;
  private ai: Ai;
  private aiSearch?: AiSearchInstance;

  constructor(dbBinding: D1Database, aiBinding: Ai, aiSearchBinding?: AiSearchInstance) {
    this.db = drizzle(dbBinding, { schema });
    this.ai = aiBinding;
    this.aiSearch = aiSearchBinding;
  }

  // Reuses the exact field set already shown to every employee on the Team
  // Directory page (EmployeeService.getDirectory) — this is the definition of
  // "public/unclassified" employee info used throughout this file. Exposing
  // it via chat introduces no new data access beyond what that page already
  // grants the same audience.
  private async getDirectoryEntry(caller: AiCaller, targetId: string) {
    const employees = new EmployeeService({} as any);
    (employees as any).db = this.db;
    const directory = await employees.getDirectory(caller.companyId);
    const match = (directory as any[]).find((e) => e.id === targetId);
    if (!match) return { error: 'Employee not found.' };
    return {
      id: match.id,
      name: `${match.name} ${match.lastName || ''}`.trim(),
      title: match.role,
      department: match.department,
      location: match.location,
      email: match.email,
      managerName: match.managerName,
    };
  }

  // ---------------- Role-scoping helpers ----------------
  private async getManagedEmployeeIds(managerId: string): Promise<Set<string>> {
    const reports = await this.db.query.employees.findMany({ where: eq(schema.employees.managerId, managerId) });
    return new Set(reports.map((r: any) => r.id));
  }

  // ---------------- Tool implementations ----------------
  // Every tool re-derives its own scoping from `caller` — arguments the
  // model supplies (like employeeId) are treated as a request to narrow,
  // never as authorization. This is the only place access control lives;
  // the model is never trusted to enforce it.
  private async getEmployee(caller: AiCaller, args: { employeeId?: string }) {
    const targetId = args.employeeId || caller.employeeId;

    if (!isPrivileged(caller.role) && targetId !== caller.employeeId) {
      let hasFullAccess = false;
      if (caller.role === 'MANAGER') {
        const reports = await this.getManagedEmployeeIds(caller.employeeId);
        hasFullAccess = reports.has(targetId);
      }
      // Not privileged and not a manager-of-this-person: fall back to the
      // same public directory info everyone can already see on the Team
      // Directory page, rather than refusing outright.
      if (!hasFullAccess) return this.getDirectoryEntry(caller, targetId);
    }

    const emp = await this.db.query.employees.findFirst({
      where: and(eq(schema.employees.id, targetId), eq(schema.employees.companyId, caller.companyId)),
    });
    if (!emp) return { error: 'Employee not found.' };
    return {
      id: emp.id,
      name: `${emp.name} ${emp.lastName || ''}`.trim(),
      department: emp.department,
      role: emp.role,
      status: emp.status,
      hireDate: emp.hireDate,
      managerName: emp.managerName,
    };
  }

  private async searchEmployees(caller: AiCaller, args: { query?: string; departmentId?: string }) {
    if (!isPrivileged(caller.role)) {
      // Public directory search, open to every role — same field set as
      // getDirectoryEntry/the Team Directory page, not the full employee table.
      const employees = new EmployeeService({} as any);
      (employees as any).db = this.db;
      let directory = (await employees.getDirectory(caller.companyId)) as any[];
      if (args.query) {
        const q = args.query.toLowerCase();
        directory = directory.filter((e) => `${e.name} ${e.lastName || ''}`.toLowerCase().includes(q));
      }
      if (args.departmentId) directory = directory.filter((e) => e.department === args.departmentId);
      return directory.slice(0, 10).map((e) => ({
        id: e.id,
        name: `${e.name} ${e.lastName || ''}`.trim(),
        title: e.role,
        department: e.department,
        managerName: e.managerName,
      }));
    }

    const conditions = [
      eq(schema.employees.companyId, caller.companyId),
      ne(schema.employees.status, 'terminated'),
    ];
    if (args.query) {
      conditions.push(
        or(
          like(schema.employees.name, `%${args.query}%`),
          like(schema.employees.lastName, `%${args.query}%`)
        )!
      );
    }
    if (args.departmentId) conditions.push(eq(schema.employees.departmentId, args.departmentId));

    const rows = await this.db.query.employees.findMany({ where: and(...conditions), limit: 10 } as any);
    return rows.map((e: any) => ({ id: e.id, name: `${e.name} ${e.lastName || ''}`.trim(), department: e.department, status: e.status }));
  }

  private async getLeaveBalance(caller: AiCaller, args: { employeeId?: string }) {
    const targetId = args.employeeId || caller.employeeId;

    if (!isPrivileged(caller.role) && targetId !== caller.employeeId) {
      if (caller.role === 'MANAGER') {
        const reports = await this.getManagedEmployeeIds(caller.employeeId);
        if (!reports.has(targetId)) return { error: "You can only view your own leave balance or your direct reports'." };
      } else {
        return { error: 'You can only view your own leave balance.' };
      }
    }

    const [balances, requests] = await Promise.all([
      this.db.query.leaveBalances.findMany({ where: eq(schema.leaveBalances.employeeId, targetId) }),
      this.db.query.leaveRequests.findMany({ where: and(eq(schema.leaveRequests.employeeId, targetId), eq(schema.leaveRequests.status, 'approved')) }),
    ]);

    const takenByType = new Map<string, number>();
    for (const r of requests as any[]) takenByType.set(r.type, (takenByType.get(r.type) || 0) + r.days);

    return (balances as any[]).map((b) => ({ type: b.type, total: b.total, taken: takenByType.get(b.type) || 0 }));
  }

  private async getPendingLeaveRequests(caller: AiCaller) {
    if (!isPrivileged(caller.role) && caller.role !== 'MANAGER') {
      return { error: 'Only managers and HR Admin/Super Admin can view pending leave requests.' };
    }

    let rows = await this.db.query.leaveRequests.findMany({
      where: and(eq(schema.leaveRequests.companyId, caller.companyId), eq(schema.leaveRequests.status, 'pending')),
    });

    if (caller.role === 'MANAGER') {
      const reports = await this.getManagedEmployeeIds(caller.employeeId);
      rows = (rows as any[]).filter((r) => reports.has(r.employeeId));
    }

    return (rows as any[]).map((r) => ({ employeeId: r.employeeId, type: r.type, startDate: r.startDate, endDate: r.endDate, days: r.days }));
  }

  private async getHeadcount(caller: AiCaller, args: { departmentId?: string }) {
    if (!isPrivileged(caller.role) && caller.role !== 'MANAGER') {
      return { error: 'Only managers and HR Admin/Super Admin can view headcount.' };
    }

    let employees = await this.db.query.employees.findMany({
      where: and(
        eq(schema.employees.companyId, caller.companyId),
        ne(schema.employees.status, 'terminated')
      ),
    });

    if (caller.role === 'MANAGER') {
      const reports = await this.getManagedEmployeeIds(caller.employeeId);
      employees = (employees as any[]).filter((e) => reports.has(e.id));
    } else if (args.departmentId) {
      employees = (employees as any[]).filter((e) => e.departmentId === args.departmentId);
    }

    const total = (employees as any[]).length;
    const active = (employees as any[]).filter((e) => e.status === 'active').length;
    const onNotice = (employees as any[]).filter((e) => e.status === 'notice').length;
    const onProbation = (employees as any[]).filter((e) => e.status === 'probation').length;
    const onboarding = (employees as any[]).filter((e) => e.status === 'onboarding').length;
    const onLeave = (employees as any[]).filter((e) => e.status === 'on_leave').length;

    return {
      count: total,
      totalStaff: total,
      activeStaff: active,
      ...(onNotice > 0 ? { onNotice } : {}),
      ...(onProbation > 0 ? { onProbation } : {}),
      ...(onboarding > 0 ? { onboarding } : {}),
      ...(onLeave > 0 ? { onLeave } : {}),
    };
  }

  private async getPayrollSummary(caller: AiCaller, args: { month?: number; year?: number }) {
    if (!isPrivileged(caller.role)) return { error: 'Only HR Admin/Super Admin can access payroll data.' };

    const now = new Date();
    const month = args.month || now.getMonth() + 1;
    const year = args.year || now.getFullYear();
    // The binding passed here is never used — overwritten with the already-
    // instantiated `this.db` right after, so PayrollService queries through
    // the exact same drizzle instance/schema as everything else in AiService
    // (see requisition.service.ts's note on why re-deriving a raw D1 binding
    // out of an existing drizzle wrapper should be avoided).
    const payroll = new PayrollService({} as any);
    (payroll as any).db = this.db;
    const dashboard = await payroll.getDashboard(caller.companyId, month, year);

    return {
      periodMonth: month,
      periodYear: year,
      totalGross: dashboard.totalGross,
      totalNet: dashboard.totalNet,
      totalTaxes: dashboard.totalTaxes,
      totalPension: dashboard.totalPension,
      employeeCount: dashboard.employeeCount,
    };
  }

  private async getOpenRequisitions(caller: AiCaller) {
    const rows = await this.db.query.jobRequisitions.findMany({
      where: and(eq(schema.jobRequisitions.companyId, caller.companyId), eq(schema.jobRequisitions.status, 'Open')),
    });
    return (rows as any[]).map((r) => ({ title: r.title, department: r.department, location: r.location, daysOpen: r.daysOpen }));
  }

  private async getComplianceTasksDue(caller: AiCaller) {
    if (!isPrivileged(caller.role)) return { error: 'Only HR Admin/Super Admin can access compliance data.' };
    const rows = await this.db.query.complianceTasks.findMany({
      where: and(eq(schema.complianceTasks.companyId, caller.companyId), eq(schema.complianceTasks.status, 'pending')),
    });
    return (rows as any[]).map((t) => ({ title: t.title, type: t.type, dueDate: t.dueDate, amount: t.amount }));
  }

  // No role check — every employee (the whole point of this tool) can search
  // the company knowledge base. Tenant scoping is still enforced: AiSearchService
  // filters by the caller's companyId folder, and the keyword fallback below
  // only ever queries documents belonging to caller.companyId.
  private async searchCompanyDocuments(caller: AiCaller, args: { query?: string }) {
    if (!args.query || !args.query.trim()) return { error: 'A search query is required.' };

    if (this.aiSearch) {
      try {
        const results = await new AiSearchService(this.aiSearch).search(caller.companyId, args.query);
        if (results.length) return { results };
      } catch (err) {
        // Fall through to the keyword-search fallback below (e.g. instance
        // not yet provisioned/indexed) rather than failing the whole answer.
      }
    }

    // Same "borrow the existing drizzle instance" pattern as getPayrollSummary
    // above — the binding passed to the constructor is never used once .db
    // is overwritten, so every query goes through this exact schema/instance.
    const documents = new CompanyDocumentService({} as any);
    (documents as any).db = this.db;
    const results = await documents.search(caller.companyId, args.query);
    if (!results.length) return { results: [], message: 'No matching documents found.' };
    return { results };
  }

  private readonly tools: Record<string, (caller: AiCaller, args: any) => Promise<any>> = {
    getEmployee: this.getEmployee.bind(this),
    searchEmployees: this.searchEmployees.bind(this),
    getLeaveBalance: this.getLeaveBalance.bind(this),
    getPendingLeaveRequests: (caller) => this.getPendingLeaveRequests(caller),
    getHeadcount: this.getHeadcount.bind(this),
    getPayrollSummary: this.getPayrollSummary.bind(this),
    getOpenRequisitions: (caller) => this.getOpenRequisitions(caller),
    getComplianceTasksDue: (caller) => this.getComplianceTasksDue(caller),
    searchCompanyDocuments: this.searchCompanyDocuments.bind(this),
  };

  private async logQuery(caller: AiCaller, question: string, toolsUsed: string[]) {
    await this.db.insert(schema.aiQueryLogs).values({
      id: genId('AIQ'),
      companyId: caller.companyId,
      employeeId: caller.employeeId,
      role: caller.role,
      question,
      toolsUsed,
    });
  }

  // ---------------- Main entry point ----------------
  async ask(caller: AiCaller, question: string): Promise<{ answer: string; toolsUsed: string[] }> {
    const messages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT(caller) },
      { role: 'user', content: question },
    ];
    const toolsUsed: string[] = [];

    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      const result: any = await this.ai.run(MODEL, { messages, tools: TOOL_SCHEMAS as any });
      const calls = result?.tool_calls || [];

      if (calls.length === 0) {
        const answer = result?.response || result?.choices?.[0]?.message?.content || "I wasn't able to come up with an answer.";
        await this.logQuery(caller, question, toolsUsed);
        return { answer, toolsUsed };
      }

      // Preserve Cloudflare Workers AI tool_call id from choices[0].message if present
      const choiceCalls = result?.choices?.[0]?.message?.tool_calls || [];
      const idsForCalls = calls.map((call: any, idx: number) => choiceCalls[idx]?.id || call.id || `call_${i}_${idx}`);
      messages.push({
        role: 'assistant',
        content: result.response || '',
        tool_calls: calls.map((call: any, idx: number) => ({
          id: idsForCalls[idx],
          type: 'function',
          function: { name: call.name, arguments: typeof call.arguments === 'string' ? call.arguments : JSON.stringify(call.arguments || {}) },
        })),
      });

      for (let idx = 0; idx < calls.length; idx++) {
        const call = calls[idx];
        toolsUsed.push(call.name);
        const fn = this.tools[call.name];
        const output = fn ? await fn(caller, call.arguments || {}).catch((err: any) => ({ error: err.message })) : { error: `Unknown tool "${call.name}"` };
        messages.push({
          role: 'tool',
          name: call.name,
          tool_call_id: idsForCalls[idx],
          content: JSON.stringify(output),
        });
      }
    }

    await this.logQuery(caller, question, toolsUsed);
    return { answer: "That question needed more steps than I'm allowed to take — try breaking it into something narrower.", toolsUsed };
  }
}
