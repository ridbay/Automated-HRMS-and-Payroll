import { Context } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as schema from '../../db/schema';
import { BenefitsService, ClaimActor } from '../../services/benefits.service';
import { AppEnv } from '../../types';

// Resolves the acting admin's display name so claim reviews keep a readable
// audit trail instead of just an opaque employee id (mirrors
// requisition.controller.ts's getActor).
const getActor = async (c: Context<AppEnv>): Promise<ClaimActor> => {
  const employeeId = c.get('employeeId') as string | undefined;
  if (!employeeId) return { id: 'system', name: 'System' };

  const db = drizzle(c.env.DB, { schema });
  const employee = await db.query.employees.findFirst({ where: eq(schema.employees.id, employeeId) });
  const name = employee ? [employee.name, employee.lastName].filter(Boolean).join(' ') : 'Unknown';
  return { id: employeeId, name };
};

// ---------------------------------------------------------------------------
// Legacy per-employee financial snapshot (EmployeeDetail.tsx "Benefits" tab)
// ---------------------------------------------------------------------------

export const getEmployeeBenefits = async (c: Context<AppEnv>) => {
  try {
    const employeeId = c.req.param('id') as string;
    const companyId = c.get('companyId') as string;
    const service = new BenefitsService(c.env.DB);
    const record = await service.getBenefitsRecord(companyId, employeeId);
    return c.json(record);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const updateEmployeeBenefits = async (c: Context<AppEnv>) => {
  try {
    const employeeId = c.req.param('id') as string;
    const companyId = c.get('companyId') as string;
    const body = await c.req.json();
    const service = new BenefitsService(c.env.DB);
    const updated = await service.upsertBenefitsRecord(companyId, employeeId, body);
    return c.json(updated);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

// ---------------------------------------------------------------------------
// Plan catalog
// ---------------------------------------------------------------------------

export const listPlans = async (c: Context<AppEnv>) => {
  try {
    const companyId = c.get('companyId') as string;
    const status = c.req.query('status');
    const service = new BenefitsService(c.env.DB);
    return c.json(await service.listPlans(companyId, status));
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const createPlan = async (c: Context<AppEnv>) => {
  try {
    const companyId = c.get('companyId') as string;
    const body = await c.req.json();
    const service = new BenefitsService(c.env.DB);
    return c.json(await service.createPlan(companyId, body), 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
};

export const updatePlan = async (c: Context<AppEnv>) => {
  try {
    const companyId = c.get('companyId') as string;
    const planId = c.req.param('id') as string;
    const body = await c.req.json();
    const service = new BenefitsService(c.env.DB);
    const updated = await service.updatePlan(companyId, planId, body);
    if (!updated) return c.json({ error: 'Plan not found' }, 404);
    return c.json(updated);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
};

export const deletePlan = async (c: Context<AppEnv>) => {
  try {
    const companyId = c.get('companyId') as string;
    const planId = c.req.param('id') as string;
    const service = new BenefitsService(c.env.DB);
    const deleted = await service.deletePlan(companyId, planId);
    if (!deleted) return c.json({ error: 'Plan not found' }, 404);
    return c.json(deleted);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
};

// ---------------------------------------------------------------------------
// Enrollments
// ---------------------------------------------------------------------------

export const listEnrollments = async (c: Context<AppEnv>) => {
  try {
    const companyId = c.get('companyId') as string;
    const planId = c.req.query('planId');
    const employeeId = c.req.query('employeeId');
    const status = c.req.query('status');
    const service = new BenefitsService(c.env.DB);
    return c.json(await service.listEnrollments(companyId, { planId, employeeId, status }));
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const adminEnrollEmployee = async (c: Context<AppEnv>) => {
  try {
    const companyId = c.get('companyId') as string;
    const body = await c.req.json();
    if (!body?.employeeId || !body?.planId) return c.json({ error: 'employeeId and planId are required' }, 400);
    const service = new BenefitsService(c.env.DB);
    const enrollment = await service.enroll(companyId, body.employeeId, body.planId, body.coverageLevel, body.notes);
    return c.json(enrollment, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
};

export const adminUpdateEnrollmentStatus = async (c: Context<AppEnv>) => {
  try {
    const companyId = c.get('companyId') as string;
    const enrollmentId = c.req.param('id') as string;
    const { status } = await c.req.json();
    if (!['enrolled', 'waived', 'cancelled'].includes(status)) return c.json({ error: 'Invalid status' }, 400);
    const service = new BenefitsService(c.env.DB);
    const updated = await service.setEnrollmentStatus(companyId, enrollmentId, status);
    if (!updated) return c.json({ error: 'Enrollment not found' }, 404);
    return c.json(updated);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
};

// ---------------------------------------------------------------------------
// Wellness programs
// ---------------------------------------------------------------------------

export const listWellnessPrograms = async (c: Context<AppEnv>) => {
  try {
    const companyId = c.get('companyId') as string;
    const service = new BenefitsService(c.env.DB);
    return c.json(await service.listPrograms(companyId));
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const createWellnessProgram = async (c: Context<AppEnv>) => {
  try {
    const companyId = c.get('companyId') as string;
    const body = await c.req.json();
    const service = new BenefitsService(c.env.DB);
    return c.json(await service.createProgram(companyId, body), 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
};

export const updateWellnessProgram = async (c: Context<AppEnv>) => {
  try {
    const companyId = c.get('companyId') as string;
    const programId = c.req.param('id') as string;
    const body = await c.req.json();
    const service = new BenefitsService(c.env.DB);
    const updated = await service.updateProgram(companyId, programId, body);
    if (!updated) return c.json({ error: 'Program not found' }, 404);
    return c.json(updated);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
};

export const deleteWellnessProgram = async (c: Context<AppEnv>) => {
  try {
    const companyId = c.get('companyId') as string;
    const programId = c.req.param('id') as string;
    const service = new BenefitsService(c.env.DB);
    const deleted = await service.deleteProgram(companyId, programId);
    if (!deleted) return c.json({ error: 'Program not found' }, 404);
    return c.json(deleted);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
};

export const listWellnessParticipants = async (c: Context<AppEnv>) => {
  try {
    const companyId = c.get('companyId') as string;
    const programId = c.req.param('id') as string;
    const service = new BenefitsService(c.env.DB);
    return c.json(await service.listProgramParticipants(companyId, programId));
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

// ---------------------------------------------------------------------------
// Claims
// ---------------------------------------------------------------------------

export const listClaims = async (c: Context<AppEnv>) => {
  try {
    const companyId = c.get('companyId') as string;
    const status = c.req.query('status');
    const kind = c.req.query('kind');
    const employeeId = c.req.query('employeeId');
    const service = new BenefitsService(c.env.DB);
    return c.json(await service.listClaims(companyId, { status, kind, employeeId }));
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const reviewClaim = async (c: Context<AppEnv>) => {
  try {
    const companyId = c.get('companyId') as string;
    const claimId = c.req.param('id') as string;
    const { status, notes } = await c.req.json();
    if (!['approved', 'rejected'].includes(status)) return c.json({ error: 'status must be "approved" or "rejected"' }, 400);

    const reviewer = await getActor(c);
    const service = new BenefitsService(c.env.DB);
    const updated = await service.reviewClaim(companyId, claimId, status, reviewer, notes);
    if (!updated) return c.json({ error: 'Claim not found' }, 404);
    return c.json(updated);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
};

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

export const getBenefitsOverview = async (c: Context<AppEnv>) => {
  try {
    const companyId = c.get('companyId') as string;
    const service = new BenefitsService(c.env.DB);
    return c.json(await service.getAdminOverview(companyId));
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};
