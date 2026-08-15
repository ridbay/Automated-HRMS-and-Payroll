import { Context } from 'hono';
import { AppEnv } from '../../types';
import { ReviewCycleService, RATING_SCALE } from '../../services/reviewCycle.service';

export const getCycles = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const service = new ReviewCycleService(c.env.DB);
  const cycles = await service.getCycles(companyId);
  return c.json({ cycles, ratingScale: RATING_SCALE });
};

export const createCycle = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const data = await c.req.json();
  const service = new ReviewCycleService(c.env.DB);
  try {
    const cycle = await service.createCycle(companyId, data);
    return c.json(cycle, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
};

export const updateCycle = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const id = c.req.param('id') as string;
  const data = await c.req.json();
  const service = new ReviewCycleService(c.env.DB);
  const cycle = await service.updateCycle(companyId, id, data);
  if (!cycle) return c.json({ error: 'Cycle not found' }, 404);
  return c.json(cycle);
};

export const activateCycle = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const id = c.req.param('id') as string;
  const service = new ReviewCycleService(c.env.DB);
  const cycle = await service.setStatus(companyId, id, 'active');
  if (!cycle) return c.json({ error: 'Cycle not found' }, 404);
  return c.json(cycle);
};

export const closeCycle = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const id = c.req.param('id') as string;
  const service = new ReviewCycleService(c.env.DB);
  const cycle = await service.setStatus(companyId, id, 'closed');
  if (!cycle) return c.json({ error: 'Cycle not found' }, 404);
  return c.json(cycle);
};

export const deleteCycle = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const id = c.req.param('id') as string;
  const service = new ReviewCycleService(c.env.DB);
  try {
    const cycle = await service.deleteCycle(companyId, id);
    if (!cycle) return c.json({ error: 'Cycle not found' }, 404);
    return c.json(cycle);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
};
