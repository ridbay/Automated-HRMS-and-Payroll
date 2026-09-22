import { D1Database, Ai } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, like } from 'drizzle-orm';
import * as schema from '../db/schema';
import { PayrollService } from './payroll.service';
import { CompanyDocumentService } from './companyDocument.service';

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
      "Look up a single employee's profile (title, department, manager, hire date, status). Admins/HR can look up anyone; managers can look up themselves or their direct reports; everyone else can only look up themselves.",
    parameters: {
      type: 'object',
      properties: { employeeId: { type: 'string', description: 'The employee id to look up. Omit to mean "me".' } },
    },
  },
  {
    name: 'searchEmployees',
    description: 'Search employees company-wide by name, optionally filtered by department. HR Admin / Super Admin only.',
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
    description: 'Active employee headcount. Managers get their own team size; HR Admin/Super Admin get the whole company (optionally one department).',
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
  `Answer using the provided tools — never invent numbers or facts about employees, leave, payroll, or compliance. ` +
  `For questions about company policy, process, or "how does X work here", use searchCompanyDocuments before answering from general knowledge — this company's own documents take priority over anything you already know. ` +
  `If searchCompanyDocuments returns no matches, say plainly that nothing in the company's uploaded documents covers it rather than guessing. When you do answer from a document, name which document it came from. ` +
  `If a tool result contains an "error" field, that means the question is outside what this person is allowed to see — explain that plainly and don't try another tool to work around it. ` +
  `Keep answers concise and concrete.`;

export class AiService {
  private db;
  private ai: Ai;

  constructor(dbBinding: D1Database, aiBinding: Ai) {
    this.db = drizzle(dbBinding, { schema });
    this.ai = aiBinding;
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
      if (caller.role === 'MANAGER') {
        const reports = await this.getManagedEmployeeIds(caller.employeeId);
        if (!reports.has(targetId)) return { error: "You can only look up your own profile or your direct reports'." };
      } else {
        return { error: 'You can only look up your own profile.' };
      }
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
    if (!isPrivileged(caller.role)) return { error: 'Only HR Admin/Super Admin can search across all employees.' };

    const conditions = [eq(schema.employees.companyId, caller.companyId)];
    if (args.query) conditions.push(like(schema.employees.name, `%${args.query}%`));
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
      where: and(eq(schema.employees.companyId, caller.companyId), eq(schema.employees.status, 'active')),
    });

    if (caller.role === 'MANAGER') {
      const reports = await this.getManagedEmployeeIds(caller.employeeId);
      employees = (employees as any[]).filter((e) => reports.has(e.id));
    } else if (args.departmentId) {
      employees = (employees as any[]).filter((e) => e.departmentId === args.departmentId);
    }

    return { count: (employees as any[]).length };
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
  // the company knowledge base. Tenant scoping is still enforced: search()
  // only ever queries documents belonging to caller.companyId.
  private async searchCompanyDocuments(caller: AiCaller, args: { query?: string }) {
    if (!args.query || !args.query.trim()) return { error: 'A search query is required.' };
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
        const answer = result?.response || "I wasn't able to come up with an answer.";
        await this.logQuery(caller, question, toolsUsed);
        return { answer, toolsUsed };
      }

      messages.push({ role: 'assistant', content: result.response || '', tool_calls: calls });

      for (const call of calls) {
        toolsUsed.push(call.name);
        const fn = this.tools[call.name];
        const output = fn ? await fn(caller, call.arguments || {}).catch((err: any) => ({ error: err.message })) : { error: `Unknown tool "${call.name}"` };
        messages.push({ role: 'tool', name: call.name, content: JSON.stringify(output) });
      }
    }

    await this.logQuery(caller, question, toolsUsed);
    return { answer: "That question needed more steps than I'm allowed to take — try breaking it into something narrower.", toolsUsed };
  }
}
