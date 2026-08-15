import { eq, and, desc, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { D1Database } from '@cloudflare/workers-types';
import * as schema from '../db/schema';
import { employeeBenefits } from '../models/benefits.model';
import { employees } from '../models/employee.model';

const genId = (prefix: string) => `${prefix}-${crypto.randomUUID().split('-')[0].toUpperCase()}`;

export type ClaimActor = { id: string; name: string };

export class BenefitsService {
  private db;

  constructor(dbBinding: D1Database) {
    this.db = drizzle(dbBinding, { schema });
  }

  // =========================================================================
  // Legacy per-employee financial snapshot (health premium, retirement
  // balance, equity, wellness budget). This is what payslips/compensation
  // views read — plan enrollment below is the newer, richer layer on top.
  // =========================================================================

  async ensureBenefitsRecord(companyId: string, employeeId: string) {
    let [record] = await this.db.select()
      .from(employeeBenefits)
      .where(and(eq(employeeBenefits.employeeId, employeeId), eq(employeeBenefits.companyId, companyId)));

    if (!record) {
      const id = genId('BEN');
      await this.db.insert(employeeBenefits).values({
        id,
        companyId,
        employeeId,
        healthProvider: 'ZenHR Care',
        healthPlan: 'Premium Plus',
        healthCoverage: 'Family',
        healthPremium: 50000,
        retirementPlan: 'ZenHR Pension',
        retirementBalance: 0,
        retirementContributionRate: 5.0,
        employerMatchRate: 5.0,
        equityGranted: 0,
        equityVested: 0,
        equityValue: 0,
        wellnessBudget: 150000,
        wellnessUsed: 0,
      });
      [record] = await this.db.select().from(employeeBenefits).where(eq(employeeBenefits.id, id));
    }
    return record;
  }

  async getEmployeeCompensation(companyId: string, employeeId: string) {
    const [employee] = await this.db.select()
      .from(employees)
      .where(and(eq(employees.id, employeeId), eq(employees.companyId, companyId)));

    if (!employee) throw new Error('Employee not found');

    const benefits = await this.ensureBenefitsRecord(companyId, employeeId);

    return {
      baseSalary: employee.baseSalary || (employee as any).salary || 0,
      benefits,
    };
  }

  async getBenefitsRecord(companyId: string, employeeId: string) {
    const [record] = await this.db.select()
      .from(employeeBenefits)
      .where(and(eq(employeeBenefits.employeeId, employeeId), eq(employeeBenefits.companyId, companyId)));
    return record || null;
  }

  async upsertBenefitsRecord(companyId: string, employeeId: string, data: any) {
    const existing = await this.getBenefitsRecord(companyId, employeeId);
    const {
      id: _id, companyId: _cid, employeeId: _eid, createdAt: _ca, updatedAt: _ua, ...rest
    } = data || {};

    if (existing) {
      const [updated] = await this.db.update(employeeBenefits)
        .set(rest)
        .where(eq(employeeBenefits.id, existing.id))
        .returning();
      return updated;
    }

    const id = genId('BEN');
    const [inserted] = await this.db.insert(employeeBenefits)
      .values({ id, companyId, employeeId, ...rest })
      .returning();
    return inserted;
  }

  // =========================================================================
  // Plan catalog (admin-managed)
  // =========================================================================

  async listPlans(companyId: string, status?: string) {
    const conditions = [eq(schema.benefitPlans.companyId, companyId)];
    if (status) conditions.push(eq(schema.benefitPlans.status, status));
    return this.db.select().from(schema.benefitPlans).where(and(...conditions)).orderBy(desc(schema.benefitPlans.createdAt));
  }

  async getPlan(companyId: string, planId: string) {
    const [plan] = await this.db.select().from(schema.benefitPlans)
      .where(and(eq(schema.benefitPlans.id, planId), eq(schema.benefitPlans.companyId, companyId)));
    return plan || null;
  }

  async createPlan(companyId: string, data: any) {
    if (!data?.name || !data?.type) throw new Error('name and type are required');
    const id = genId('PLN');
    const [plan] = await this.db.insert(schema.benefitPlans).values({
      id,
      companyId,
      name: data.name,
      type: data.type,
      provider: data.provider || null,
      planTier: data.planTier || null,
      description: data.description || null,
      highlights: Array.isArray(data.highlights) ? JSON.stringify(data.highlights) : (data.highlights || null),
      coverageLimit: Number(data.coverageLimit) || 0,
      employerCost: Number(data.employerCost) || 0,
      employeeCost: Number(data.employeeCost) || 0,
      currency: data.currency || 'NGN',
      eligibility: data.eligibility || 'All Employees',
      icon: data.icon || 'Shield',
      color: data.color || 'indigo',
      status: data.status || 'active',
    }).returning();
    return plan;
  }

  async updatePlan(companyId: string, planId: string, data: any) {
    const existing = await this.getPlan(companyId, planId);
    if (!existing) return null;

    const patch: any = {};
    for (const key of ['name', 'type', 'provider', 'planTier', 'description', 'eligibility', 'icon', 'color', 'status', 'currency']) {
      if (data[key] !== undefined) patch[key] = data[key];
    }
    if (data.highlights !== undefined) {
      patch.highlights = Array.isArray(data.highlights) ? JSON.stringify(data.highlights) : data.highlights;
    }
    if (data.coverageLimit !== undefined) patch.coverageLimit = Number(data.coverageLimit) || 0;
    if (data.employerCost !== undefined) patch.employerCost = Number(data.employerCost) || 0;
    if (data.employeeCost !== undefined) patch.employeeCost = Number(data.employeeCost) || 0;

    const [updated] = await this.db.update(schema.benefitPlans).set(patch)
      .where(eq(schema.benefitPlans.id, planId)).returning();
    return updated;
  }

  async deletePlan(companyId: string, planId: string) {
    const existing = await this.getPlan(companyId, planId);
    if (!existing) return null;

    const activeEnrollments = await this.db.select().from(schema.benefitEnrollments)
      .where(and(
        eq(schema.benefitEnrollments.planId, planId),
        eq(schema.benefitEnrollments.status, 'enrolled')
      ));

    if (activeEnrollments.length > 0) {
      throw new Error(`Cannot delete: ${activeEnrollments.length} employee(s) are currently enrolled. Deactivate the plan instead.`);
    }

    await this.db.delete(schema.benefitPlans).where(eq(schema.benefitPlans.id, planId));
    return existing;
  }

  // =========================================================================
  // Enrollments
  // =========================================================================

  private async enrichEnrollments(rows: any[]) {
    if (rows.length === 0) return [];
    const employeeIds = [...new Set(rows.map((r) => r.employeeId))];
    const planIds = [...new Set(rows.map((r) => r.planId))];

    const [emps, plans] = await Promise.all([
      employeeIds.length ? this.db.select().from(employees).where(inArray(employees.id, employeeIds)) : [],
      planIds.length ? this.db.select().from(schema.benefitPlans).where(inArray(schema.benefitPlans.id, planIds)) : [],
    ]);

    const empMap = new Map(emps.map((e: any) => [e.id, e]));
    const planMap = new Map(plans.map((p: any) => [p.id, p]));

    return rows.map((r) => ({
      ...r,
      employeeName: [empMap.get(r.employeeId)?.name, empMap.get(r.employeeId)?.lastName].filter(Boolean).join(' ') || 'Unknown',
      employeeAvatar: empMap.get(r.employeeId)?.avatar || null,
      employeeDepartment: empMap.get(r.employeeId)?.department || null,
      plan: planMap.get(r.planId) || null,
    }));
  }

  async listEnrollments(companyId: string, filters: { planId?: string; employeeId?: string; status?: string } = {}) {
    const conditions = [eq(schema.benefitEnrollments.companyId, companyId)];
    if (filters.planId) conditions.push(eq(schema.benefitEnrollments.planId, filters.planId));
    if (filters.employeeId) conditions.push(eq(schema.benefitEnrollments.employeeId, filters.employeeId));
    if (filters.status) conditions.push(eq(schema.benefitEnrollments.status, filters.status));

    const rows = await this.db.select().from(schema.benefitEnrollments)
      .where(and(...conditions))
      .orderBy(desc(schema.benefitEnrollments.createdAt));

    return this.enrichEnrollments(rows);
  }

  async getMyEnrollments(companyId: string, employeeId: string) {
    return this.listEnrollments(companyId, { employeeId });
  }

  async enroll(companyId: string, employeeId: string, planId: string, coverageLevel: string = 'Individual', notes?: string) {
    const plan = await this.getPlan(companyId, planId);
    if (!plan) throw new Error('Plan not found');
    if (plan.status !== 'active') throw new Error('This plan is not currently open for enrollment');

    const [existing] = await this.db.select().from(schema.benefitEnrollments)
      .where(and(
        eq(schema.benefitEnrollments.companyId, companyId),
        eq(schema.benefitEnrollments.employeeId, employeeId),
        eq(schema.benefitEnrollments.planId, planId)
      ));

    if (existing) {
      if (existing.status === 'enrolled') throw new Error('Already enrolled in this plan');
      const [reactivated] = await this.db.update(schema.benefitEnrollments)
        .set({ status: 'enrolled', coverageLevel, notes: notes || existing.notes, enrolledAt: new Date().toISOString(), cancelledAt: null })
        .where(eq(schema.benefitEnrollments.id, existing.id))
        .returning();
      return reactivated;
    }

    const id = genId('ENR');
    const [created] = await this.db.insert(schema.benefitEnrollments).values({
      id,
      companyId,
      employeeId,
      planId,
      coverageLevel,
      status: 'enrolled',
      notes: notes || null,
    }).returning();
    return created;
  }

  async setEnrollmentStatus(companyId: string, enrollmentId: string, status: 'enrolled' | 'waived' | 'cancelled') {
    const [existing] = await this.db.select().from(schema.benefitEnrollments)
      .where(and(eq(schema.benefitEnrollments.id, enrollmentId), eq(schema.benefitEnrollments.companyId, companyId)));
    if (!existing) return null;

    const patch: any = { status };
    if (status === 'cancelled' || status === 'waived') patch.cancelledAt = new Date().toISOString();
    if (status === 'enrolled') patch.cancelledAt = null;

    const [updated] = await this.db.update(schema.benefitEnrollments).set(patch)
      .where(eq(schema.benefitEnrollments.id, enrollmentId)).returning();
    return updated;
  }

  // Employee cancelling their own enrollment — scoped so one employee can't
  // touch another's row via a guessed enrollment id.
  async cancelMyEnrollment(companyId: string, employeeId: string, enrollmentId: string) {
    const [existing] = await this.db.select().from(schema.benefitEnrollments)
      .where(and(
        eq(schema.benefitEnrollments.id, enrollmentId),
        eq(schema.benefitEnrollments.companyId, companyId),
        eq(schema.benefitEnrollments.employeeId, employeeId)
      ));
    if (!existing) return null;

    const [updated] = await this.db.update(schema.benefitEnrollments)
      .set({ status: 'cancelled', cancelledAt: new Date().toISOString() })
      .where(eq(schema.benefitEnrollments.id, enrollmentId)).returning();
    return updated;
  }

  // =========================================================================
  // Dependents
  // =========================================================================

  async listDependents(companyId: string, employeeId: string) {
    return this.db.select().from(schema.benefitDependents)
      .where(and(eq(schema.benefitDependents.companyId, companyId), eq(schema.benefitDependents.employeeId, employeeId)))
      .orderBy(desc(schema.benefitDependents.createdAt));
  }

  async addDependent(companyId: string, employeeId: string, data: any) {
    if (!data?.name || !data?.relationship) throw new Error('name and relationship are required');
    const id = genId('DEP');
    const [dependent] = await this.db.insert(schema.benefitDependents).values({
      id,
      companyId,
      employeeId,
      name: data.name,
      relationship: data.relationship,
      dateOfBirth: data.dateOfBirth || null,
    }).returning();
    return dependent;
  }

  async deleteDependent(companyId: string, employeeId: string, dependentId: string) {
    const [existing] = await this.db.select().from(schema.benefitDependents)
      .where(and(
        eq(schema.benefitDependents.id, dependentId),
        eq(schema.benefitDependents.companyId, companyId),
        eq(schema.benefitDependents.employeeId, employeeId)
      ));
    if (!existing) return null;
    await this.db.delete(schema.benefitDependents).where(eq(schema.benefitDependents.id, dependentId));
    return existing;
  }

  // =========================================================================
  // Wellness programs (admin-managed) + participation (employee-driven)
  // =========================================================================

  async listPrograms(companyId: string) {
    const programs = await this.db.select().from(schema.wellnessPrograms)
      .where(eq(schema.wellnessPrograms.companyId, companyId))
      .orderBy(desc(schema.wellnessPrograms.createdAt));

    if (programs.length === 0) return [];

    const participants = await this.db.select().from(schema.wellnessParticipants)
      .where(inArray(schema.wellnessParticipants.programId, programs.map((p: any) => p.id)));

    const countByProgram = new Map<string, number>();
    for (const p of participants) {
      if (p.status !== 'dropped') countByProgram.set(p.programId, (countByProgram.get(p.programId) || 0) + 1);
    }

    return programs.map((p: any) => ({ ...p, participantCount: countByProgram.get(p.id) || 0 }));
  }

  async listProgramsForEmployee(companyId: string, employeeId: string) {
    const programs = await this.listPrograms(companyId);
    const mine = await this.db.select().from(schema.wellnessParticipants)
      .where(and(eq(schema.wellnessParticipants.companyId, companyId), eq(schema.wellnessParticipants.employeeId, employeeId)));
    const mineMap = new Map(mine.map((m: any) => [m.programId, m]));

    return programs.map((p: any) => ({
      ...p,
      myParticipation: mineMap.get(p.id) || null,
    }));
  }

  async createProgram(companyId: string, data: any) {
    if (!data?.title) throw new Error('title is required');
    const id = genId('WEL');
    const [program] = await this.db.insert(schema.wellnessPrograms).values({
      id,
      companyId,
      title: data.title,
      description: data.description || null,
      category: data.category || 'fitness',
      goalLabel: data.goalLabel || 'Steps',
      goalTarget: Number(data.goalTarget) || 0,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      status: data.status || 'active',
    }).returning();
    return program;
  }

  async updateProgram(companyId: string, programId: string, data: any) {
    const [existing] = await this.db.select().from(schema.wellnessPrograms)
      .where(and(eq(schema.wellnessPrograms.id, programId), eq(schema.wellnessPrograms.companyId, companyId)));
    if (!existing) return null;

    const patch: any = {};
    for (const key of ['title', 'description', 'category', 'goalLabel', 'startDate', 'endDate', 'status']) {
      if (data[key] !== undefined) patch[key] = data[key];
    }
    if (data.goalTarget !== undefined) patch.goalTarget = Number(data.goalTarget) || 0;

    const [updated] = await this.db.update(schema.wellnessPrograms).set(patch)
      .where(eq(schema.wellnessPrograms.id, programId)).returning();
    return updated;
  }

  async deleteProgram(companyId: string, programId: string) {
    const [existing] = await this.db.select().from(schema.wellnessPrograms)
      .where(and(eq(schema.wellnessPrograms.id, programId), eq(schema.wellnessPrograms.companyId, companyId)));
    if (!existing) return null;
    await this.db.delete(schema.wellnessParticipants).where(eq(schema.wellnessParticipants.programId, programId));
    await this.db.delete(schema.wellnessPrograms).where(eq(schema.wellnessPrograms.id, programId));
    return existing;
  }

  async listProgramParticipants(companyId: string, programId: string) {
    const rows = await this.db.select().from(schema.wellnessParticipants)
      .where(and(eq(schema.wellnessParticipants.companyId, companyId), eq(schema.wellnessParticipants.programId, programId)))
      .orderBy(desc(schema.wellnessParticipants.progress));

    if (rows.length === 0) return [];
    const employeeIds = [...new Set(rows.map((r: any) => r.employeeId))];
    const emps = await this.db.select().from(employees).where(inArray(employees.id, employeeIds));
    const empMap = new Map(emps.map((e: any) => [e.id, e]));

    return rows.map((r: any) => ({
      ...r,
      employeeName: [empMap.get(r.employeeId)?.name, empMap.get(r.employeeId)?.lastName].filter(Boolean).join(' ') || 'Unknown',
      employeeAvatar: empMap.get(r.employeeId)?.avatar || null,
    }));
  }

  async joinProgram(companyId: string, employeeId: string, programId: string) {
    const [program] = await this.db.select().from(schema.wellnessPrograms)
      .where(and(eq(schema.wellnessPrograms.id, programId), eq(schema.wellnessPrograms.companyId, companyId)));
    if (!program) throw new Error('Program not found');

    const [existing] = await this.db.select().from(schema.wellnessParticipants)
      .where(and(
        eq(schema.wellnessParticipants.companyId, companyId),
        eq(schema.wellnessParticipants.programId, programId),
        eq(schema.wellnessParticipants.employeeId, employeeId)
      ));

    if (existing) {
      if (existing.status !== 'dropped') return existing;
      const [rejoined] = await this.db.update(schema.wellnessParticipants)
        .set({ status: 'joined', progress: 0, joinedAt: new Date().toISOString() })
        .where(eq(schema.wellnessParticipants.id, existing.id)).returning();
      return rejoined;
    }

    const id = genId('PTC');
    const [created] = await this.db.insert(schema.wellnessParticipants).values({
      id, companyId, programId, employeeId, progress: 0, status: 'joined',
    }).returning();
    return created;
  }

  async updateMyProgress(companyId: string, employeeId: string, programId: string, progress: number) {
    const [existing] = await this.db.select().from(schema.wellnessParticipants)
      .where(and(
        eq(schema.wellnessParticipants.companyId, companyId),
        eq(schema.wellnessParticipants.programId, programId),
        eq(schema.wellnessParticipants.employeeId, employeeId)
      ));
    if (!existing) throw new Error('You have not joined this program');

    const [program] = await this.db.select().from(schema.wellnessPrograms).where(eq(schema.wellnessPrograms.id, programId));
    const clamped = Math.max(0, Number(progress) || 0);
    const status = program?.goalTarget && clamped >= program.goalTarget ? 'completed' : 'joined';

    const [updated] = await this.db.update(schema.wellnessParticipants)
      .set({ progress: clamped, status })
      .where(eq(schema.wellnessParticipants.id, existing.id)).returning();
    return updated;
  }

  async leaveProgram(companyId: string, employeeId: string, programId: string) {
    const [existing] = await this.db.select().from(schema.wellnessParticipants)
      .where(and(
        eq(schema.wellnessParticipants.companyId, companyId),
        eq(schema.wellnessParticipants.programId, programId),
        eq(schema.wellnessParticipants.employeeId, employeeId)
      ));
    if (!existing) return null;
    const [updated] = await this.db.update(schema.wellnessParticipants)
      .set({ status: 'dropped' })
      .where(eq(schema.wellnessParticipants.id, existing.id)).returning();
    return updated;
  }

  // =========================================================================
  // Claims (health reimbursement + wellness budget reimbursement)
  // =========================================================================

  private async enrichClaims(rows: any[]) {
    if (rows.length === 0) return [];
    const employeeIds = [...new Set(rows.map((r) => r.employeeId))];
    const emps = await this.db.select().from(employees).where(inArray(employees.id, employeeIds));
    const empMap = new Map(emps.map((e: any) => [e.id, e]));
    return rows.map((r) => ({
      ...r,
      employeeName: [empMap.get(r.employeeId)?.name, empMap.get(r.employeeId)?.lastName].filter(Boolean).join(' ') || 'Unknown',
      employeeAvatar: empMap.get(r.employeeId)?.avatar || null,
      employeeDepartment: empMap.get(r.employeeId)?.department || null,
    }));
  }

  async listClaims(companyId: string, filters: { employeeId?: string; status?: string; kind?: string } = {}) {
    const conditions = [eq(schema.benefitClaims.companyId, companyId)];
    if (filters.employeeId) conditions.push(eq(schema.benefitClaims.employeeId, filters.employeeId));
    if (filters.status) conditions.push(eq(schema.benefitClaims.status, filters.status));
    if (filters.kind) conditions.push(eq(schema.benefitClaims.kind, filters.kind));

    const rows = await this.db.select().from(schema.benefitClaims)
      .where(and(...conditions))
      .orderBy(desc(schema.benefitClaims.submittedAt));

    return this.enrichClaims(rows);
  }

  async submitClaim(companyId: string, employeeId: string, data: any) {
    if (!data?.kind || !['health', 'wellness'].includes(data.kind)) throw new Error('kind must be "health" or "wellness"');
    if (!data?.category) throw new Error('category is required');
    const amount = Number(data.amount);
    if (!amount || amount <= 0) throw new Error('amount must be greater than 0');

    if (data.kind === 'wellness') {
      const benefits = await this.ensureBenefitsRecord(companyId, employeeId);
      const remaining = (benefits.wellnessBudget || 0) - (benefits.wellnessUsed || 0);
      if (amount > remaining) {
        throw new Error(`Amount exceeds your remaining wellness budget (₦${remaining.toLocaleString()} left)`);
      }
    }

    const id = genId('CLM');
    const [claim] = await this.db.insert(schema.benefitClaims).values({
      id,
      companyId,
      employeeId,
      kind: data.kind,
      category: data.category,
      provider: data.provider || null,
      amount,
      description: data.description || null,
      status: 'pending',
    }).returning();
    return claim;
  }

  async reviewClaim(companyId: string, claimId: string, decision: 'approved' | 'rejected', reviewer: ClaimActor, notes?: string) {
    const [existing] = await this.db.select().from(schema.benefitClaims)
      .where(and(eq(schema.benefitClaims.id, claimId), eq(schema.benefitClaims.companyId, companyId)));
    if (!existing) return null;
    if (existing.status !== 'pending') throw new Error(`This claim was already ${existing.status}`);

    const [updated] = await this.db.update(schema.benefitClaims).set({
      status: decision,
      reviewedById: reviewer.id,
      reviewedByName: reviewer.name,
      reviewedAt: new Date().toISOString(),
      reviewNotes: notes || null,
    }).where(eq(schema.benefitClaims.id, claimId)).returning();

    if (decision === 'approved' && existing.kind === 'wellness') {
      const benefits = await this.ensureBenefitsRecord(companyId, existing.employeeId);
      await this.db.update(employeeBenefits)
        .set({ wellnessUsed: (benefits.wellnessUsed || 0) + existing.amount })
        .where(eq(employeeBenefits.id, benefits.id));
    }

    return updated;
  }

  // =========================================================================
  // Dashboards
  // =========================================================================

  async getAdminOverview(companyId: string) {
    const [plans, enrollments, claims, programs] = await Promise.all([
      this.db.select().from(schema.benefitPlans).where(eq(schema.benefitPlans.companyId, companyId)),
      this.db.select().from(schema.benefitEnrollments).where(eq(schema.benefitEnrollments.companyId, companyId)),
      this.db.select().from(schema.benefitClaims).where(eq(schema.benefitClaims.companyId, companyId)),
      this.db.select().from(schema.wellnessPrograms).where(eq(schema.wellnessPrograms.companyId, companyId)),
    ]);

    const activePlans = plans.filter((p: any) => p.status === 'active');
    const activeEnrollments = enrollments.filter((e: any) => e.status === 'enrolled');
    const pendingClaims = claims.filter((c: any) => c.status === 'pending');
    const planCostById = new Map(plans.map((p: any) => [p.id, p]));
    const monthlyEmployerSpend = activeEnrollments.reduce((sum: number, e: any) => sum + (planCostById.get(e.planId)?.employerCost || 0), 0);
    const monthlyEmployeeCost = activeEnrollments.reduce((sum: number, e: any) => sum + (planCostById.get(e.planId)?.employeeCost || 0), 0);

    return {
      totalPlans: plans.length,
      activePlans: activePlans.length,
      totalEnrollments: activeEnrollments.length,
      pendingClaims: pendingClaims.length,
      activePrograms: programs.filter((p: any) => p.status === 'active').length,
      monthlyEmployerSpend,
      monthlyEmployeeCost,
    };
  }

  async getMySummary(companyId: string, employeeId: string) {
    const [compensation, enrollments, dependents, programs, claims] = await Promise.all([
      this.getEmployeeCompensation(companyId, employeeId),
      this.listEnrollments(companyId, { employeeId }),
      this.listDependents(companyId, employeeId),
      this.listProgramsForEmployee(companyId, employeeId),
      this.listClaims(companyId, { employeeId }),
    ]);

    return {
      baseSalary: compensation.baseSalary,
      benefits: compensation.benefits,
      enrollments,
      dependents,
      programs,
      claims,
    };
  }
}
