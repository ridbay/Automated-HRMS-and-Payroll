import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AiService } from '../../src/services/ai.service';

// Builds a Workers-AI-shaped mock: first call returns a tool_calls array,
// the second (post-tool-result) call returns a plain text response — the
// same two-round-trip shape AiService.ask expects for any single-tool question.
const mockAiRun = (toolCalls: { name: string; arguments: any }[], finalAnswer: string) => {
  let call = 0;
  return vi.fn(async () => {
    call += 1;
    if (call === 1) return { response: '', tool_calls: toolCalls };
    return { response: finalAnswer, tool_calls: [] };
  });
};

describe('Ai Service', () => {
  let mockDb: any;
  let mockAi: any;
  let service: AiService;

  const admin = { companyId: 'comp-1', employeeId: 'admin-1', role: 'HR_ADMIN' };
  const manager = { companyId: 'comp-1', employeeId: 'mgr-1', role: 'MANAGER' };
  const employee = { companyId: 'comp-1', employeeId: 'emp-1', role: 'EMPLOYEE' };

  beforeEach(() => {
    mockDb = {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue(undefined),
      query: {
        employees: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
        leaveBalances: { findMany: vi.fn().mockResolvedValue([]) },
        leaveRequests: { findMany: vi.fn().mockResolvedValue([]) },
        jobRequisitions: { findMany: vi.fn().mockResolvedValue([]) },
        complianceTasks: { findMany: vi.fn().mockResolvedValue([]) },
        payrollSettings: { findFirst: vi.fn().mockResolvedValue(undefined) },
        taxBrackets: { findMany: vi.fn().mockResolvedValue([]) },
        payrollRuns: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
        payslips: { findMany: vi.fn().mockResolvedValue([]) },
        loans: { findMany: vi.fn().mockResolvedValue([]) },
      },
    };
    mockAi = { run: vi.fn() };

    service = new AiService({} as any, {} as any);
    (service as any).db = mockDb;
    (service as any).ai = mockAi;
  });

  describe('getEmployee (via ask)', () => {
    it('lets an admin look up any employee', async () => {
      mockDb.query.employees.findFirst.mockResolvedValueOnce({
        id: 'emp-99', companyId: 'comp-1', name: 'Ada', lastName: 'Lovelace', department: 'Engineering', status: 'active',
      });
      mockAi.run = mockAiRun([{ name: 'getEmployee', arguments: { employeeId: 'emp-99' } }], 'Ada is in Engineering.');

      const result = await service.ask(admin, "What department is emp-99 in?");
      expect(result.toolsUsed).toEqual(['getEmployee']);
      expect(result.answer).toBe('Ada is in Engineering.');
      expect(mockDb.query.employees.findFirst).toHaveBeenCalled();
    });

    it('blocks a regular employee from looking up someone else, without querying the DB', async () => {
      mockAi.run = mockAiRun([{ name: 'getEmployee', arguments: { employeeId: 'someone-else' } }], "You can only look up your own profile.");

      await service.ask(employee, "What's someone-else's title?");
      expect(mockDb.query.employees.findFirst).not.toHaveBeenCalled();
    });

    it("lets a manager look up their own direct report", async () => {
      mockDb.query.employees.findMany.mockResolvedValueOnce([{ id: 'report-1' }]); // getManagedEmployeeIds
      mockDb.query.employees.findFirst.mockResolvedValueOnce({ id: 'report-1', name: 'Bo', lastName: 'Lade', department: 'Sales', status: 'active' });
      mockAi.run = mockAiRun([{ name: 'getEmployee', arguments: { employeeId: 'report-1' } }], 'Bo is in Sales.');

      const result = await service.ask(manager, "What department is report-1 in?");
      expect(result.answer).toBe('Bo is in Sales.');
      expect(mockDb.query.employees.findFirst).toHaveBeenCalled();
    });

    it("blocks a manager from looking up someone outside their team", async () => {
      mockDb.query.employees.findMany.mockResolvedValueOnce([{ id: 'report-1' }]); // manager's reports don't include 'stranger'
      mockAi.run = mockAiRun([{ name: 'getEmployee', arguments: { employeeId: 'stranger' } }], "You can't see that.");

      await service.ask(manager, "What department is stranger in?");
      expect(mockDb.query.employees.findFirst).not.toHaveBeenCalled();
    });

    it('defaults employeeId to "self" when the model omits it', async () => {
      mockDb.query.employees.findFirst.mockResolvedValueOnce({ id: 'emp-1', name: 'Me', lastName: '', department: 'Ops', status: 'active' });
      mockAi.run = mockAiRun([{ name: 'getEmployee', arguments: {} }], 'You are in Ops.');

      await service.ask(employee, "What department am I in?");
      const where = mockDb.query.employees.findFirst.mock.calls[0][0].where;
      expect(where).toBeDefined(); // exercised the self-lookup path without throwing
    });
  });

  describe('searchEmployees', () => {
    it('is blocked entirely for non-admins', async () => {
      mockAi.run = mockAiRun([{ name: 'searchEmployees', arguments: { query: 'Ada' } }], "Can't search.");
      await service.ask(manager, 'Find everyone named Ada');
      expect(mockDb.query.employees.findMany).not.toHaveBeenCalled();
    });

    it('is allowed for HR Admin', async () => {
      mockAi.run = mockAiRun([{ name: 'searchEmployees', arguments: { query: 'Ada' } }], 'Found Ada.');
      await service.ask(admin, 'Find everyone named Ada');
      expect(mockDb.query.employees.findMany).toHaveBeenCalled();
    });
  });

  describe('getPayrollSummary / getComplianceTasksDue', () => {
    it('blocks payroll data for a manager', async () => {
      mockAi.run = mockAiRun([{ name: 'getPayrollSummary', arguments: {} }], "Can't share that.");
      await service.ask(manager, "What's this month's payroll total?");
      // employees.findMany would be called by PayrollService.getDashboard if it ran — it must not.
      expect(mockDb.query.payrollRuns.findMany).not.toHaveBeenCalled();
    });

    it('blocks compliance data for a regular employee', async () => {
      mockAi.run = mockAiRun([{ name: 'getComplianceTasksDue', arguments: {} }], "Can't share that.");
      await service.ask(employee, 'What compliance tasks are due?');
      expect(mockDb.query.complianceTasks.findMany).not.toHaveBeenCalled();
    });

    it('allows compliance data for HR Admin', async () => {
      mockDb.query.complianceTasks.findMany.mockResolvedValueOnce([{ title: 'PAYE Filing', type: 'tax', dueDate: '2024-11-10', amount: 5000 }]);
      mockAi.run = mockAiRun([{ name: 'getComplianceTasksDue', arguments: {} }], 'One task due.');
      const result = await service.ask(admin, 'What compliance tasks are due?');
      expect(result.answer).toBe('One task due.');
      expect(mockDb.query.complianceTasks.findMany).toHaveBeenCalled();
    });
  });

  describe('tool-call loop', () => {
    it('logs the query with the tools actually used, once the model stops calling tools', async () => {
      mockDb.query.jobRequisitions.findMany.mockResolvedValueOnce([{ title: 'Engineer', department: 'Eng', location: 'Lagos', daysOpen: 5 }]);
      mockAi.run = mockAiRun([{ name: 'getOpenRequisitions', arguments: {} }], 'One open role: Engineer.');

      await service.ask(employee, 'What roles are open?');

      expect(mockDb.insert).toHaveBeenCalled();
      const logged = mockDb.values.mock.calls[0][0];
      expect(logged.toolsUsed).toEqual(['getOpenRequisitions']);
      expect(logged.employeeId).toBe('emp-1');
      expect(logged.role).toBe('EMPLOYEE');
    });

    it('stops after MAX_TOOL_ITERATIONS instead of looping forever', async () => {
      mockAi.run = vi.fn().mockResolvedValue({ response: '', tool_calls: [{ name: 'getOpenRequisitions', arguments: {} }] });

      const result = await service.ask(employee, 'Keep asking forever');
      expect(mockAi.run).toHaveBeenCalledTimes(4);
      expect(result.answer).toContain("needed more steps");
    });

    it('answers directly with no tool calls at all', async () => {
      mockAi.run = vi.fn().mockResolvedValue({ response: 'Hi there!', tool_calls: [] });
      const result = await service.ask(employee, 'Hello');
      expect(result.answer).toBe('Hi there!');
      expect(result.toolsUsed).toEqual([]);
    });

    it("an unknown tool name reports an error back to the model instead of throwing", async () => {
      mockAi.run = mockAiRun([{ name: 'deleteEverything', arguments: {} }], 'I cannot do that.');
      const result = await service.ask(admin, 'Delete everything');
      expect(result.answer).toBe('I cannot do that.');
    });
  });
});
