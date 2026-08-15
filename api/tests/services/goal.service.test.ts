import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoalService } from '../../src/services/goal.service';

describe('Goal Service', () => {
  let mockDb: any;
  let service: GoalService;

  beforeEach(() => {
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      all: vi.fn().mockResolvedValue([{ id: 'goal-1', title: 'Test Goal' }]),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      query: {
        goals: { findFirst: vi.fn() },
        employees: { findFirst: vi.fn() },
      }
    };

    service = new GoalService({} as any);
    (service as any).db = mockDb;
  });

  describe('createGoal', () => {
    it('should insert a goal and return id', async () => {
      const data = { title: 'Q4 Delivery', scope: 'individual' };
      const result = await service.createGoal('comp-1', 'emp-1', data);
      
      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^GOAL-/);
      expect(mockDb.insert).toHaveBeenCalled();
      
      const insertedValues = mockDb.values.mock.calls[0][0];
      expect(insertedValues.title).toBe('Q4 Delivery');
      expect(insertedValues.employeeId).toBe('emp-1');
      expect(insertedValues.companyId).toBe('comp-1');
    });
  });

  describe('updateGoal Permissions', () => {
    it('should deny update if goal not found', async () => {
      mockDb.query.goals.findFirst.mockResolvedValueOnce(undefined);
      const result = await service.updateGoal('comp-1', 'emp-1', 'EMPLOYEE', 'goal-1', {});
      expect(result).toBeNull();
    });

    it('should allow owner to update their own goal', async () => {
      mockDb.query.goals.findFirst.mockResolvedValueOnce({ id: 'goal-1', employeeId: 'emp-1' }); // Owner
      // Return updated goal for second findFirst
      mockDb.query.goals.findFirst.mockResolvedValueOnce({ id: 'goal-1', employeeId: 'emp-1', status: 'completed' }); 

      const result = await service.updateGoal('comp-1', 'emp-1', 'EMPLOYEE', 'goal-1', { status: 'completed' });
      expect(mockDb.update).toHaveBeenCalled();
      expect(result?.status).toBe('completed');
    });

    it('should allow admin to update any goal', async () => {
      mockDb.query.goals.findFirst.mockResolvedValueOnce({ id: 'goal-1', employeeId: 'emp-2' }); // Not owner
      mockDb.query.goals.findFirst.mockResolvedValueOnce({ id: 'goal-1' });

      await service.updateGoal('comp-1', 'admin-1', 'SUPER_ADMIN', 'goal-1', {});
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should allow manager to update direct report goal', async () => {
      mockDb.query.goals.findFirst.mockResolvedValueOnce({ id: 'goal-1', employeeId: 'emp-2' }); // Not owner
      // Employee has manager set to mgr-1
      mockDb.query.employees.findFirst.mockResolvedValueOnce({ id: 'emp-2', managerId: 'mgr-1' });
      mockDb.query.goals.findFirst.mockResolvedValueOnce({ id: 'goal-1' });

      await service.updateGoal('comp-1', 'mgr-1', 'MANAGER', 'goal-1', {});
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should deny non-manager, non-admin, non-owner from updating', async () => {
      mockDb.query.goals.findFirst.mockResolvedValueOnce({ id: 'goal-1', employeeId: 'emp-2' }); // Not owner
      // Employee has manager set to someone else
      mockDb.query.employees.findFirst.mockResolvedValueOnce({ id: 'emp-2', managerId: 'mgr-1' });
      
      const result = await service.updateGoal('comp-1', 'emp-3', 'EMPLOYEE', 'goal-1', {});
      expect(mockDb.update).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('queries', () => {
    it('should get my goals', async () => {
      const goals = await service.getMyGoals('comp-1', 'emp-1');
      expect(mockDb.select).toHaveBeenCalled();
      expect(goals).toHaveLength(1);
    });

    it('should get team goals', async () => {
      const goals = await service.getTeamGoals('comp-1', 'mgr-1');
      expect(mockDb.innerJoin).toHaveBeenCalled(); // Should join employees table
      expect(goals).toHaveLength(1);
    });
  });
});
