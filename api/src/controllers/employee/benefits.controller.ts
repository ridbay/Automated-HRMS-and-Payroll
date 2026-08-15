import { Context } from 'hono';
import { BenefitsService } from '../../services/benefits.service';
import { AppEnv } from '../../types';

const requireEmployee = (c: Context<AppEnv>) => {
  const employeeId = c.get('employeeId');
  if (!employeeId) throw new Error('UNAUTHENTICATED');
  return { companyId: c.get('companyId') as string, employeeId: employeeId as string };
};

export const getMySummary = async (c: Context<AppEnv>) => {
  try {
    const { companyId, employeeId } = requireEmployee(c);
    const service = new BenefitsService(c.env.DB);
    return c.json(await service.getMySummary(companyId, employeeId));
  } catch (error: any) {
    if (error.message === 'UNAUTHENTICATED') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: error.message }, 500);
  }
};

export const listAvailablePlans = async (c: Context<AppEnv>) => {
  try {
    const { companyId } = requireEmployee(c);
    const service = new BenefitsService(c.env.DB);
    return c.json(await service.listPlans(companyId, 'active'));
  } catch (error: any) {
    if (error.message === 'UNAUTHENTICATED') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: error.message }, 500);
  }
};

export const listMyEnrollments = async (c: Context<AppEnv>) => {
  try {
    const { companyId, employeeId } = requireEmployee(c);
    const service = new BenefitsService(c.env.DB);
    return c.json(await service.getMyEnrollments(companyId, employeeId));
  } catch (error: any) {
    if (error.message === 'UNAUTHENTICATED') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: error.message }, 500);
  }
};

export const enrollInPlan = async (c: Context<AppEnv>) => {
  try {
    const { companyId, employeeId } = requireEmployee(c);
    const { planId, coverageLevel, notes } = await c.req.json();
    if (!planId) return c.json({ error: 'planId is required' }, 400);
    const service = new BenefitsService(c.env.DB);
    const enrollment = await service.enroll(companyId, employeeId, planId, coverageLevel, notes);
    return c.json(enrollment, 201);
  } catch (error: any) {
    if (error.message === 'UNAUTHENTICATED') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: error.message }, 400);
  }
};

export const cancelMyEnrollment = async (c: Context<AppEnv>) => {
  try {
    const { companyId, employeeId } = requireEmployee(c);
    const enrollmentId = c.req.param('id') as string;
    const service = new BenefitsService(c.env.DB);
    const updated = await service.cancelMyEnrollment(companyId, employeeId, enrollmentId);
    if (!updated) return c.json({ error: 'Enrollment not found' }, 404);
    return c.json(updated);
  } catch (error: any) {
    if (error.message === 'UNAUTHENTICATED') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: error.message }, 400);
  }
};

export const listMyDependents = async (c: Context<AppEnv>) => {
  try {
    const { companyId, employeeId } = requireEmployee(c);
    const service = new BenefitsService(c.env.DB);
    return c.json(await service.listDependents(companyId, employeeId));
  } catch (error: any) {
    if (error.message === 'UNAUTHENTICATED') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: error.message }, 500);
  }
};

export const addMyDependent = async (c: Context<AppEnv>) => {
  try {
    const { companyId, employeeId } = requireEmployee(c);
    const body = await c.req.json();
    const service = new BenefitsService(c.env.DB);
    return c.json(await service.addDependent(companyId, employeeId, body), 201);
  } catch (error: any) {
    if (error.message === 'UNAUTHENTICATED') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: error.message }, 400);
  }
};

export const deleteMyDependent = async (c: Context<AppEnv>) => {
  try {
    const { companyId, employeeId } = requireEmployee(c);
    const dependentId = c.req.param('id') as string;
    const service = new BenefitsService(c.env.DB);
    const deleted = await service.deleteDependent(companyId, employeeId, dependentId);
    if (!deleted) return c.json({ error: 'Dependent not found' }, 404);
    return c.json(deleted);
  } catch (error: any) {
    if (error.message === 'UNAUTHENTICATED') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: error.message }, 500);
  }
};

export const listWellnessPrograms = async (c: Context<AppEnv>) => {
  try {
    const { companyId, employeeId } = requireEmployee(c);
    const service = new BenefitsService(c.env.DB);
    return c.json(await service.listProgramsForEmployee(companyId, employeeId));
  } catch (error: any) {
    if (error.message === 'UNAUTHENTICATED') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: error.message }, 500);
  }
};

export const joinWellnessProgram = async (c: Context<AppEnv>) => {
  try {
    const { companyId, employeeId } = requireEmployee(c);
    const programId = c.req.param('id') as string;
    const service = new BenefitsService(c.env.DB);
    return c.json(await service.joinProgram(companyId, employeeId, programId), 201);
  } catch (error: any) {
    if (error.message === 'UNAUTHENTICATED') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: error.message }, 400);
  }
};

export const updateMyProgramProgress = async (c: Context<AppEnv>) => {
  try {
    const { companyId, employeeId } = requireEmployee(c);
    const programId = c.req.param('id') as string;
    const { progress } = await c.req.json();
    const service = new BenefitsService(c.env.DB);
    return c.json(await service.updateMyProgress(companyId, employeeId, programId, progress));
  } catch (error: any) {
    if (error.message === 'UNAUTHENTICATED') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: error.message }, 400);
  }
};

export const leaveWellnessProgram = async (c: Context<AppEnv>) => {
  try {
    const { companyId, employeeId } = requireEmployee(c);
    const programId = c.req.param('id') as string;
    const service = new BenefitsService(c.env.DB);
    const updated = await service.leaveProgram(companyId, employeeId, programId);
    if (!updated) return c.json({ error: 'You have not joined this program' }, 404);
    return c.json(updated);
  } catch (error: any) {
    if (error.message === 'UNAUTHENTICATED') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: error.message }, 500);
  }
};

export const listMyClaims = async (c: Context<AppEnv>) => {
  try {
    const { companyId, employeeId } = requireEmployee(c);
    const service = new BenefitsService(c.env.DB);
    return c.json(await service.listClaims(companyId, { employeeId }));
  } catch (error: any) {
    if (error.message === 'UNAUTHENTICATED') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: error.message }, 500);
  }
};

export const submitMyClaim = async (c: Context<AppEnv>) => {
  try {
    const { companyId, employeeId } = requireEmployee(c);
    const body = await c.req.json();
    const service = new BenefitsService(c.env.DB);
    return c.json(await service.submitClaim(companyId, employeeId, body), 201);
  } catch (error: any) {
    if (error.message === 'UNAUTHENTICATED') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: error.message }, 400);
  }
};
