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

  // EmployeeService.getDirectory() (the public-info source for getEmployee/
  // searchEmployees fallbacks) runs a raw `.select().from().where()` query,
  // not `db.query.employees.*` — mocked separately so tests can set the rows
  // a directory lookup should see without touching the privileged-path mocks.
  let directoryRows: any[];

  beforeEach(() => {
    directoryRows = [];
    mockDb = {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue(undefined),
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve(directoryRows)),
        })),
      })),
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
        companyDocuments: { findMany: vi.fn().mockResolvedValue([]) },
      },
    };
    mockAi = { run: vi.fn() };

    service = new AiService({} as any, {} as any);
    (service as any).db = mockDb;
    (service as any).ai = mockAi;
  });

  // Pulls the JSON a tool actually returned to the model out of the second
  // (post-tool-result) ai.run() call, so tests can assert on the exact field
  // shape rather than just on which DB methods fired.
  const getToolOutput = () => {
    const toolMessage = mockAi.run.mock.calls[1][1].messages.find((m: any) => m.role === 'tool');
    return JSON.parse(toolMessage.content);
  };

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

    it('gives a regular employee only public directory info about someone else, never the full profile', async () => {
      directoryRows = [
        {
          id: 'someone-else', name: 'Sam', lastName: 'Iyke', email: 'sam@co.com', phone: '0801-555-0100', role: 'Designer',
          department: 'Design', location: 'Lagos', avatar: null, managerId: 'mgr-1', managerName: 'Manager Mike',
        },
      ];
      mockAi.run = mockAiRun([{ name: 'getEmployee', arguments: { employeeId: 'someone-else' } }], 'Sam is a Designer in Design.');

      const result = await service.ask(employee, "What's someone-else's title?");

      expect(mockDb.query.employees.findFirst).not.toHaveBeenCalled();
      expect(result.answer).toBe('Sam is a Designer in Design.');
      expect(getToolOutput()).toEqual({
        id: 'someone-else', name: 'Sam Iyke', title: 'Designer', department: 'Design',
        location: 'Lagos', email: 'sam@co.com', managerName: 'Manager Mike',
      });
    });

    it('returns an error, not a full profile, when the looked-up employee is not in the directory', async () => {
      directoryRows = [];
      mockAi.run = mockAiRun([{ name: 'getEmployee', arguments: { employeeId: 'ghost' } }], "Couldn't find that employee.");

      await service.ask(employee, "What's ghost's title?");
      expect(getToolOutput()).toEqual({ error: 'Employee not found.' });
    });

    it("lets a manager look up their own direct report", async () => {
      mockDb.query.employees.findMany.mockResolvedValueOnce([{ id: 'report-1' }]); // getManagedEmployeeIds
      mockDb.query.employees.findFirst.mockResolvedValueOnce({ id: 'report-1', name: 'Bo', lastName: 'Lade', department: 'Sales', status: 'active' });
      mockAi.run = mockAiRun([{ name: 'getEmployee', arguments: { employeeId: 'report-1' } }], 'Bo is in Sales.');

      const result = await service.ask(manager, "What department is report-1 in?");
      expect(result.answer).toBe('Bo is in Sales.');
      expect(mockDb.query.employees.findFirst).toHaveBeenCalled();
    });

    it("gives a manager only public directory info for someone outside their team, not the full profile", async () => {
      mockDb.query.employees.findMany.mockResolvedValueOnce([{ id: 'report-1' }]); // manager's reports don't include 'stranger'
      directoryRows = [{ id: 'stranger', name: 'Stranger', lastName: 'Danger', email: 's@co.com', phone: '000', role: 'Analyst', department: 'Finance', location: 'Abuja', avatar: null, managerId: 'mgr-2', managerName: 'Other Manager' }];
      mockAi.run = mockAiRun([{ name: 'getEmployee', arguments: { employeeId: 'stranger' } }], "Stranger is an Analyst in Finance.");

      await service.ask(manager, "What department is stranger in?");
      expect(mockDb.query.employees.findFirst).not.toHaveBeenCalled();
      expect(getToolOutput()).toEqual({
        id: 'stranger', name: 'Stranger Danger', title: 'Analyst', department: 'Finance',
        location: 'Abuja', email: 's@co.com', managerName: 'Other Manager',
      });
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
    it('returns public directory results for non-admins instead of the full employee table', async () => {
      directoryRows = [
        { id: 'emp-99', name: 'Ada', lastName: 'Lovelace', email: 'ada@co.com', phone: '000', role: 'Engineer', department: 'Engineering', location: 'Lagos', avatar: null, managerId: 'mgr-1', managerName: 'Manager Mike' },
        { id: 'emp-50', name: 'Zed', lastName: 'Okafor', email: 'zed@co.com', phone: '000', role: 'Sales Rep', department: 'Sales', location: 'Lagos', avatar: null, managerId: 'mgr-2', managerName: 'Other Manager' },
      ];
      mockAi.run = mockAiRun([{ name: 'searchEmployees', arguments: { query: 'Ada' } }], 'Found Ada, an Engineer.');

      const result = await service.ask(manager, 'Find everyone named Ada');

      expect(mockDb.query.employees.findMany).not.toHaveBeenCalled();
      expect(result.answer).toBe('Found Ada, an Engineer.');
      expect(getToolOutput()).toEqual([
        { id: 'emp-99', name: 'Ada Lovelace', title: 'Engineer', department: 'Engineering', managerName: 'Manager Mike' },
      ]);
    });

    it('is allowed for HR Admin, returning the full employee table', async () => {
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

  describe('searchCompanyDocuments', () => {
    it('is available to a regular employee, not just admins', async () => {
      mockDb.query.companyDocuments.findMany.mockResolvedValueOnce([
        { id: 'DOC-1', title: 'Remote Work Policy', content: 'Employees may work remotely up to 3 days a week.', companyId: 'comp-1' },
      ]);
      mockAi.run = mockAiRun(
        [{ name: 'searchCompanyDocuments', arguments: { query: 'remote work' } }],
        'You can work remotely up to 3 days a week, per the Remote Work Policy.'
      );

      const result = await service.ask(employee, 'How many days can I work remotely?');

      expect(result.toolsUsed).toEqual(['searchCompanyDocuments']);
      expect(mockDb.query.companyDocuments.findMany).toHaveBeenCalled();
    });

    it('requires a non-empty query and never hits the DB without one', async () => {
      mockAi.run = mockAiRun([{ name: 'searchCompanyDocuments', arguments: {} }], "I need more detail to search for that.");

      await service.ask(employee, 'Tell me about the company');

      expect(mockDb.query.companyDocuments.findMany).not.toHaveBeenCalled();
    });

    it('reports no matches plainly instead of the model inventing an answer', async () => {
      mockDb.query.companyDocuments.findMany.mockResolvedValueOnce([
        { id: 'DOC-1', title: 'Remote Work Policy', content: 'Employees may work remotely.', companyId: 'comp-1' },
      ]);
      mockAi.run = mockAiRun(
        [{ name: 'searchCompanyDocuments', arguments: { query: 'parking allowance' } }],
        "Nothing in the company's documents covers parking allowances."
      );

      const result = await service.ask(employee, 'Is there a parking allowance?');
      expect(result.answer).toContain("Nothing in the company's documents");
    });

    describe('with an AI_SEARCH binding configured', () => {
      let mockAiSearchInstance: any;
      let searchService: AiService;

      beforeEach(() => {
        mockAiSearchInstance = { search: vi.fn() };
        searchService = new AiService({} as any, {} as any, mockAiSearchInstance);
        (searchService as any).db = mockDb;
        (searchService as any).ai = mockAi;
      });

      it('answers from AI Search results, scoped to the caller\'s company folder, without touching the keyword-search table', async () => {
        mockAiSearchInstance.search.mockResolvedValueOnce({
          search_query: 'remote work',
          chunks: [{ id: 'c1', type: 'text', score: 0.9, text: 'Up to 3 days remote per week.', item: { key: 'companies/comp-1/documents/DOC-1-handbook.pdf', metadata: { title: 'Remote Work Policy' } } }],
        });
        mockAi.run = mockAiRun(
          [{ name: 'searchCompanyDocuments', arguments: { query: 'remote work' } }],
          'Up to 3 days remote per week, per the Remote Work Policy.'
        );

        const result = await searchService.ask(employee, 'How many days can I work remotely?');

        expect(mockAiSearchInstance.search).toHaveBeenCalledWith(
          expect.objectContaining({ query: 'remote work', ai_search_options: expect.objectContaining({ retrieval: expect.objectContaining({ filters: { folder: 'companies/comp-1/documents/' } }) }) })
        );
        expect(mockDb.query.companyDocuments.findMany).not.toHaveBeenCalled();
        expect(result.answer).toBe('Up to 3 days remote per week, per the Remote Work Policy.');
      });

      it('falls back to the keyword-search table when AI Search throws', async () => {
        mockAiSearchInstance.search.mockRejectedValueOnce(new Error('instance not indexed yet'));
        mockDb.query.companyDocuments.findMany.mockResolvedValueOnce([
          { id: 'DOC-1', title: 'Remote Work Policy', content: 'Employees may work remotely up to 3 days a week.' },
        ]);
        mockAi.run = mockAiRun(
          [{ name: 'searchCompanyDocuments', arguments: { query: 'remote work' } }],
          'Up to 3 days remote per week.'
        );

        const result = await searchService.ask(employee, 'How many days can I work remotely?');

        expect(mockDb.query.companyDocuments.findMany).toHaveBeenCalled();
        expect(result.answer).toBe('Up to 3 days remote per week.');
      });

      it('falls back to the keyword-search table when AI Search returns no chunks', async () => {
        mockAiSearchInstance.search.mockResolvedValueOnce({ search_query: 'parking', chunks: [] });
        mockDb.query.companyDocuments.findMany.mockResolvedValueOnce([]);
        mockAi.run = mockAiRun(
          [{ name: 'searchCompanyDocuments', arguments: { query: 'parking' } }],
          "Nothing in the company's documents covers parking."
        );

        await searchService.ask(employee, 'Is there parking?');
        expect(mockDb.query.companyDocuments.findMany).toHaveBeenCalled();
      });
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
