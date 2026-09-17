import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkflowEngineService } from '../../src/services/workflowEngine.service';

describe('WorkflowEngineService', () => {
  let service: WorkflowEngineService;
  let mockDb: any;
  let mockEnv: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDb = {
      query: {
        workflows: {
          findFirst: vi.fn(),
        },
        integrations: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
      },
      insert: vi.fn(() => ({
        values: vi.fn().mockResolvedValue([]),
      })),
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              limit: vi.fn(() => ({
                all: vi.fn().mockResolvedValue([
                  { id: 'wfexec_1', workflowKey: 'onboarding', status: 'completed' },
                ]),
              })),
            })),
          })),
        })),
      })),
    };

    mockEnv = {};
    service = new WorkflowEngineService({} as any, mockEnv);
    (service as any).db = mockDb;
  });

  describe('trigger', () => {
    it('should skip execution when workflow is not found or disabled', async () => {
      mockDb.query.workflows.findFirst.mockResolvedValueOnce(null);

      const result = await service.trigger({
        companyId: 'comp-1',
        workflowKey: 'onboarding',
        triggerEvent: 'employee.created',
        data: { name: 'John Doe' },
      });

      expect(result.status).toBe('skipped');
      expect(result.executedSteps).toBe(0);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should execute workflow pipeline with automated and role-assigned steps', async () => {
      mockDb.query.workflows.findFirst.mockResolvedValueOnce({
        id: 'wf_1',
        name: 'Employee Onboarding',
        key: 'onboarding',
        enabled: true,
        steps: [
          { id: 's1', name: 'Send Welcome Email', assignee: 'System', actionType: 'email' },
          { id: 's2', name: 'Provision Workstation', assignee: 'IT Admin', actionType: 'task' },
          { id: 's3', name: 'Notify Team Channel', assignee: 'System', actionType: 'notification' },
        ],
      });

      const result = await service.trigger({
        companyId: 'comp-1',
        workflowKey: 'onboarding',
        triggerEvent: 'employee.created',
        entityId: 'emp-101',
        data: {
          name: 'Ada Lovelace',
          email: 'ada@example.com',
          jobTitle: 'Lead Engineer',
        },
      });

      expect(result.status).toBe('completed');
      expect(result.executedSteps).toBe(3);
      expect(result.actionsRun).toHaveLength(3);
      expect(result.actionsRun[0].actionType).toBe('email');
      expect(result.actionsRun[1].actionType).toBe('task');
      expect(result.actionsRun[1].status).toBe('assigned');
      expect(result.actionsRun[2].actionType).toBe('notification');
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe('listExecutions', () => {
    it('should retrieve execution logs', async () => {
      const executions = await service.listExecutions('comp-1', 'onboarding');
      expect(executions).toHaveLength(1);
      expect(executions[0].id).toBe('wfexec_1');
    });
  });
});
