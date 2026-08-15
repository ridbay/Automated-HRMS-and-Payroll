import { Context } from 'hono';
import { AppEnv } from '../../types';
import { GoalService } from '../../services/goal.service';

const parseGoal = (g: any) => ({ ...g, keyResults: g.keyResults ? JSON.parse(g.keyResults) : [] });

export const getMyGoals = async (c: Context<AppEnv>) => {
  const employeeId = c.get('employeeId')!;
  const companyId = c.get('companyId');
  const service = new GoalService(c.env.DB);
  const rows = await service.getMyGoals(companyId, employeeId);
  return c.json(rows.map(parseGoal));
};

export const createGoal = async (c: Context<AppEnv>) => {
  const employeeId = c.get('employeeId')!;
  const companyId = c.get('companyId');
  const body = await c.req.json();
  const service = new GoalService(c.env.DB);
  const { id } = await service.createGoal(companyId, employeeId, body);
  return c.json({ id, message: 'Goal created' }, 201);
};

export const updateGoalProgress = async (c: Context<AppEnv>) => {
  const employeeId = c.get('employeeId')!;
  const companyId = c.get('companyId');
  const role = c.get('role');
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'Goal id is required' }, 400);

  const body = await c.req.json();
  const service = new GoalService(c.env.DB);
  const updated = await service.updateGoal(companyId, employeeId, role, id, body);

  if (!updated) {
    return c.json({ error: 'Goal not found, or you do not have permission to edit it' }, 404);
  }
  return c.json(parseGoal(updated));
};

// A manager's view of every direct report's goals.
export const getTeamGoals = async (c: Context<AppEnv>) => {
  const employeeId = c.get('employeeId')!;
  const companyId = c.get('companyId');
  const service = new GoalService(c.env.DB);
  const rows = await service.getTeamGoals(companyId, employeeId);
  return c.json(rows.map(parseGoal));
};

// Read-only: the strategic objectives HR/Admin have set that apply to this
// employee — every company-wide objective, plus their own department's (if
// they belong to one and it has one) — so employees see what their goals
// should align to without seeing every other department's objectives.
export const getMyObjectives = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.get('employeeId')!;
  const service = new GoalService(c.env.DB);
  const rows = await service.getObjectivesForEmployee(companyId, employeeId);
  return c.json(rows.map(parseGoal));
};

// A manager assigning a goal to one of their direct reports.
export const assignTeamGoal = async (c: Context<AppEnv>) => {
  const managerId = c.get('employeeId')!;
  const companyId = c.get('companyId');
  const body = await c.req.json();

  if (!body.employeeId) {
    return c.json({ error: 'employeeId is required' }, 400);
  }

  const service = new GoalService(c.env.DB);
  const { id } = await service.createGoal(companyId, body.employeeId, { ...body, scope: body.scope || 'team' }, managerId);
  return c.json({ id, message: 'Goal assigned' }, 201);
};
