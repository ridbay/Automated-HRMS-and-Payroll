import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransitionService } from '../../src/services/transition.service';
import * as schema from '../../src/db/schema';

describe('Transition Service', () => {
  let mockDb: any;
  let service: TransitionService;

  const employeeRow = { id: 'emp-1', companyId: 'comp-1', name: 'Jane', lastName: 'Doe', status: 'onboarding', managerId: null, managerName: null, avatar: null, role: 'Engineer', department: 'Engineering' };
  const transitionRow = { id: 'trn-1', companyId: 'comp-1', employeeId: 'emp-1', type: 'Onboarding', stage: 'Pre-boarding', status: 'Active', startDate: '2026-01-01', completedAt: null };

  beforeEach(() => {
    mockDb = {
      query: {
        employees: { findFirst: vi.fn().mockResolvedValue(employeeRow) },
        transitions: { findFirst: vi.fn().mockResolvedValue(transitionRow) },
        transitionTasks: {
          findFirst: vi.fn().mockResolvedValue(undefined),
          findMany: vi.fn().mockResolvedValue([]),
        },
      },
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
    };

    service = new TransitionService({} as any);
    (service as any).db = mockDb;
  });

  describe('create', () => {
    it('generates the default onboarding checklist and does not demote an already-active employee', async () => {
      mockDb.query.employees.findFirst.mockResolvedValue({ ...employeeRow, status: 'active' });

      await service.create('comp-1', { id: 'admin-1', name: 'Admin' }, { employeeId: 'emp-1', type: 'Onboarding', startDate: '2026-01-01' });

      const taskInsertIdx = mockDb.insert.mock.calls.findIndex((c: any) => c[0] === schema.transitionTasks);
      expect(taskInsertIdx).toBeGreaterThanOrEqual(0);
      const insertedTasks = mockDb.values.mock.calls[taskInsertIdx][0];
      expect(insertedTasks).toHaveLength(6);
      expect(insertedTasks[0].title).toBe('Sign Offer Letter');
      expect(insertedTasks.every((t: any) => t.status === 'pending')).toBe(true);

      // Already active -> the employee status sync must not fire.
      expect(mockDb.update).not.toHaveBeenCalledWith(schema.employees);
    });

    it('sets a non-active employee to "onboarding" when starting an onboarding journey', async () => {
      mockDb.query.employees.findFirst.mockResolvedValue({ ...employeeRow, status: 'probation' });

      await service.create('comp-1', { id: 'admin-1', name: 'Admin' }, { employeeId: 'emp-1', type: 'Onboarding', startDate: '2026-01-01' });

      const empUpdateIdx = mockDb.update.mock.calls.findIndex((c: any) => c[0] === schema.employees);
      expect(empUpdateIdx).toBeGreaterThanOrEqual(0);
      expect(mockDb.set.mock.calls[empUpdateIdx][0]).toMatchObject({ status: 'onboarding' });
    });

    it('generates the offboarding checklist including asset return items and puts the employee on notice', async () => {
      mockDb.query.employees.findFirst.mockResolvedValue({ ...employeeRow, status: 'active' });

      await service.create('comp-1', { id: 'admin-1', name: 'Admin' }, {
        employeeId: 'emp-1',
        type: 'Offboarding',
        startDate: '2026-01-01',
        targetDate: '2026-01-15',
        reason: 'Resignation',
        handoverToName: 'Bola',
        exitInterviewScheduled: true,
        assetChecklist: ['MacBook Pro', 'ID Card'],
      });

      const taskInsertIdx = mockDb.insert.mock.calls.findIndex((c: any) => c[0] === schema.transitionTasks);
      const insertedTasks = mockDb.values.mock.calls[taskInsertIdx][0];
      expect(insertedTasks).toHaveLength(7); // 5 base + 2 asset items
      expect(insertedTasks.some((t: any) => t.title === 'Return MacBook Pro')).toBe(true);
      expect(insertedTasks.some((t: any) => t.title === 'Return ID Card')).toBe(true);
      expect(insertedTasks.some((t: any) => t.title === 'Handover Responsibilities to Bola')).toBe(true);
      expect(insertedTasks.some((t: any) => t.title === 'Conduct Exit Interview')).toBe(true);

      const empUpdateIdx = mockDb.update.mock.calls.findIndex((c: any) => c[0] === schema.employees);
      expect(mockDb.set.mock.calls[empUpdateIdx][0]).toMatchObject({ status: 'notice' });
    });

    it('appends extraTasks on top of the generated checklist', async () => {
      await service.create('comp-1', { id: 'admin-1', name: 'Admin' }, {
        employeeId: 'emp-1',
        type: 'Onboarding',
        startDate: '2026-01-01',
        extraTasks: [{ title: 'Meet the CEO', category: 'Admin' }],
      });

      const taskInsertIdx = mockDb.insert.mock.calls.findIndex((c: any) => c[0] === schema.transitionTasks);
      const insertedTasks = mockDb.values.mock.calls[taskInsertIdx][0];
      expect(insertedTasks).toHaveLength(7);
      expect(insertedTasks[6].title).toBe('Meet the CEO');
    });

    it('throws when the employee does not exist for the company', async () => {
      mockDb.query.employees.findFirst.mockResolvedValue(undefined);
      await expect(
        service.create('comp-1', { id: 'admin-1', name: 'Admin' }, { employeeId: 'missing', type: 'Onboarding' })
      ).rejects.toThrow('Employee not found');
    });
  });

  describe('setTaskStatus', () => {
    it('completes the journey and flips the employee to active once every task is done', async () => {
      mockDb.query.transitionTasks.findFirst.mockResolvedValue({ id: 'tsk-2', transitionId: 'trn-1', companyId: 'comp-1', status: 'pending' });
      mockDb.query.transitions.findFirst
        .mockResolvedValueOnce({ ...transitionRow, status: 'Active' }) // pre-recompute state
        .mockResolvedValue({ ...transitionRow, status: 'Completed' }); // post-update re-fetch
      mockDb.query.transitionTasks.findMany.mockResolvedValue([
        { id: 'tsk-1', status: 'completed' },
        { id: 'tsk-2', status: 'completed' },
      ]);
      mockDb.query.employees.findFirst.mockResolvedValue({ ...employeeRow, status: 'onboarding' });

      const result = await service.setTaskStatus('comp-1', 'trn-1', 'tsk-2', 'completed');

      const transitionUpdateIdx = mockDb.update.mock.calls.findIndex((c: any) => c[0] === schema.transitions);
      expect(mockDb.set.mock.calls[transitionUpdateIdx][0]).toMatchObject({ status: 'Completed', stage: 'Final Review' });

      const employeeUpdateIdx = mockDb.update.mock.calls.findIndex((c: any) => c[0] === schema.employees);
      expect(employeeUpdateIdx).toBeGreaterThanOrEqual(0);
      expect(mockDb.set.mock.calls[employeeUpdateIdx][0]).toMatchObject({ status: 'active' });

      expect(result?.progress).toBe(100);
    });

    it('does not recompute or touch the employee once a journey is already cancelled', async () => {
      mockDb.query.transitionTasks.findFirst.mockResolvedValue({ id: 'tsk-1', transitionId: 'trn-1', companyId: 'comp-1', status: 'pending' });
      mockDb.query.transitions.findFirst.mockResolvedValue({ ...transitionRow, status: 'Cancelled' });

      await service.setTaskStatus('comp-1', 'trn-1', 'tsk-1', 'completed');

      // Only the task's own status update should have gone through.
      expect(mockDb.update.mock.calls.filter((c: any) => c[0] === schema.transitions)).toHaveLength(0);
      expect(mockDb.update.mock.calls.filter((c: any) => c[0] === schema.employees)).toHaveLength(0);
    });

    it('returns null when the task does not belong to the transition/company', async () => {
      mockDb.query.transitionTasks.findFirst.mockResolvedValue(undefined);
      const result = await service.setTaskStatus('comp-1', 'trn-1', 'missing-task', 'completed');
      expect(result).toBeNull();
      expect(mockDb.update).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('marks the journey Cancelled', async () => {
      mockDb.query.transitions.findFirst.mockResolvedValue({ ...transitionRow, status: 'Active' });

      await service.cancel('comp-1', 'trn-1');

      const transitionUpdateIdx = mockDb.update.mock.calls.findIndex((c: any) => c[0] === schema.transitions);
      expect(mockDb.set.mock.calls[transitionUpdateIdx][0]).toMatchObject({ status: 'Cancelled' });
    });

    it('returns null for a transition that does not exist for the company', async () => {
      mockDb.query.transitions.findFirst.mockResolvedValue(undefined);
      const result = await service.cancel('comp-1', 'missing');
      expect(result).toBeNull();
    });
  });
});
