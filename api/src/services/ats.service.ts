import { D1Database } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, desc, inArray } from 'drizzle-orm';
import * as schema from '../db/schema';
import { EmployeeService } from './employee.service';

const genId = (prefix: string) => `${prefix}-${crypto.randomUUID().split('-')[0].toUpperCase()}`;

const VALID_CANDIDATE_STATUSES = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];

export interface AtsActor {
  id: string;
  name: string;
  avatar?: string | null;
  role?: string;
}

export class AtsService {
  private db;
  private dbBinding: D1Database;

  constructor(dbBinding: D1Database) {
    this.db = drizzle(dbBinding, { schema });
    this.dbBinding = dbBinding;
  }

  private async logTimeline(companyId: string, candidateId: string, actor: AtsActor | undefined, event: string, note?: string) {
    await this.db.insert(schema.candidateTimelineEvents).values({
      id: genId('TL'),
      candidateId,
      companyId,
      event,
      note: note || null,
      actorId: actor?.id || null,
      actorName: actor?.name || 'System',
    });
  }

  // ---------------- Candidates ----------------
  async listCandidates(companyId: string, filters: { requisitionId?: string; status?: string } = {}) {
    const conditions = [eq(schema.candidates.companyId, companyId)];
    if (filters.requisitionId) conditions.push(eq(schema.candidates.requisitionId, filters.requisitionId));
    if (filters.status) conditions.push(eq(schema.candidates.status, filters.status));

    return this.db.query.candidates.findMany({
      where: and(...conditions),
      orderBy: [desc(schema.candidates.createdAt)],
    });
  }

  async getCandidate(companyId: string, id: string) {
    const candidate = await this.db.query.candidates.findFirst({
      where: and(eq(schema.candidates.id, id), eq(schema.candidates.companyId, companyId)),
    });
    if (!candidate) return null;

    const [timeline, interviews, offerRows] = await Promise.all([
      this.db.query.candidateTimelineEvents.findMany({
        where: eq(schema.candidateTimelineEvents.candidateId, id),
        orderBy: [desc(schema.candidateTimelineEvents.createdAt)],
      }),
      this.db.query.interviews.findMany({
        where: eq(schema.interviews.candidateId, id),
        orderBy: [desc(schema.interviews.dateTime)],
      }),
      this.db.query.offers.findMany({
        where: eq(schema.offers.candidateId, id),
        orderBy: [desc(schema.offers.createdAt)],
      }),
    ]);

    const interviewIds = interviews.map((i: any) => i.id);
    const scorecards = interviewIds.length
      ? await this.db.query.interviewScorecards.findMany({ where: inArray(schema.interviewScorecards.interviewId, interviewIds) })
      : [];
    const scorecardsByInterview = new Map<string, any[]>();
    for (const sc of scorecards) {
      const list = scorecardsByInterview.get(sc.interviewId) || [];
      list.push(sc);
      scorecardsByInterview.set(sc.interviewId, list);
    }

    return {
      ...candidate,
      timeline,
      interviews: interviews.map((i: any) => ({ ...i, scorecards: scorecardsByInterview.get(i.id) || [] })),
      offers: offerRows,
    };
  }

  async createCandidate(companyId: string, actor: AtsActor | undefined, data: any, resumeFileKey?: string | null) {
    if (!data.name || !data.email) throw new Error('name and email are required');

    const id = genId('CAND');
    const row = {
      id,
      companyId,
      requisitionId: data.requisitionId || null,
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      location: data.location || null,
      currentTitle: data.currentTitle || null,
      currentEmployer: data.currentEmployer || null,
      experienceYears: data.experienceYears != null ? Number(data.experienceYears) : null,
      education: data.education || null,
      skills: Array.isArray(data.skills) ? data.skills : [],
      source: data.source || 'Career Page',
      salaryExpectation: data.salaryExpectation || null,
      linkedinUrl: data.linkedinUrl || null,
      githubUrl: data.githubUrl || null,
      portfolioUrl: data.portfolioUrl || null,
      coverLetter: data.coverLetter || null,
      resumeFileKey: resumeFileKey || null,
      status: 'applied',
      appliedDate: new Date().toISOString().slice(0, 10),
    };

    await this.db.insert(schema.candidates).values(row);
    await this.logTimeline(companyId, id, actor, 'Application submitted', data.requisitionId ? undefined : 'Added directly to talent pool');
    return row;
  }

  async updateCandidateStatus(companyId: string, actor: AtsActor | undefined, id: string, status: string, note?: string) {
    if (!VALID_CANDIDATE_STATUSES.includes(status)) {
      throw new Error(`status must be one of ${VALID_CANDIDATE_STATUSES.join(', ')}`);
    }
    const existing = await this.db.query.candidates.findFirst({
      where: and(eq(schema.candidates.id, id), eq(schema.candidates.companyId, companyId)),
    });
    if (!existing) return null;

    await this.db.update(schema.candidates).set({ status }).where(eq(schema.candidates.id, id));
    await this.logTimeline(companyId, id, actor, `Moved to "${status}"`, note);
    return { ...existing, status };
  }

  async rateCandidate(companyId: string, id: string, rating: number) {
    const existing = await this.db.query.candidates.findFirst({
      where: and(eq(schema.candidates.id, id), eq(schema.candidates.companyId, companyId)),
    });
    if (!existing) return null;
    await this.db.update(schema.candidates).set({ rating }).where(eq(schema.candidates.id, id));
    return { ...existing, rating };
  }

  // ---------------- Interviews ----------------
  async listInterviews(companyId: string, filters: { candidateId?: string } = {}) {
    const conditions = [eq(schema.interviews.companyId, companyId)];
    if (filters.candidateId) conditions.push(eq(schema.interviews.candidateId, filters.candidateId));
    return this.db.query.interviews.findMany({ where: and(...conditions), orderBy: [desc(schema.interviews.dateTime)] });
  }

  async scheduleInterview(companyId: string, actor: AtsActor | undefined, data: any) {
    if (!data.candidateId || !data.dateTime || !data.stage || !data.type) {
      throw new Error('candidateId, type, stage and dateTime are required');
    }
    const candidate = await this.db.query.candidates.findFirst({
      where: and(eq(schema.candidates.id, data.candidateId), eq(schema.candidates.companyId, companyId)),
    });
    if (!candidate) throw new Error('Candidate not found');

    const id = genId('INT');
    const row = {
      id,
      companyId,
      candidateId: data.candidateId,
      requisitionId: candidate.requisitionId || null,
      type: data.type,
      stage: data.stage,
      dateTime: data.dateTime,
      durationMinutes: Number(data.durationMinutes) || 60,
      interviewerIds: Array.isArray(data.interviewerIds) ? data.interviewerIds : [],
      meetingLink: data.meetingLink || null,
      status: 'Scheduled',
      createdBy: actor?.id || null,
    };
    await this.db.insert(schema.interviews).values(row);

    // Moving a candidate into an active interview loop is the common case;
    // don't downgrade someone who's already further along (offer/hired).
    if (['applied', 'screening'].includes(candidate.status)) {
      await this.updateCandidateStatus(companyId, actor, data.candidateId, 'interview');
    } else {
      await this.logTimeline(companyId, data.candidateId, actor, `${data.stage} interview scheduled`, data.meetingLink);
    }

    return row;
  }

  async updateInterviewStatus(companyId: string, id: string, status: string) {
    if (!['Scheduled', 'Completed', 'Cancelled'].includes(status)) throw new Error('Invalid interview status');
    const existing = await this.db.query.interviews.findFirst({
      where: and(eq(schema.interviews.id, id), eq(schema.interviews.companyId, companyId)),
    });
    if (!existing) return null;
    await this.db.update(schema.interviews).set({ status }).where(eq(schema.interviews.id, id));
    return { ...existing, status };
  }

  async submitScorecard(companyId: string, actor: AtsActor | undefined, interviewId: string, data: any) {
    const interview = await this.db.query.interviews.findFirst({
      where: and(eq(schema.interviews.id, interviewId), eq(schema.interviews.companyId, companyId)),
    });
    if (!interview) throw new Error('Interview not found');

    const row = {
      id: genId('SC'),
      interviewId,
      companyId,
      interviewerId: actor?.id || null,
      interviewerName: actor?.name || 'Unknown',
      technical: data.technical != null ? Number(data.technical) : null,
      communication: data.communication != null ? Number(data.communication) : null,
      cultural: data.cultural != null ? Number(data.cultural) : null,
      notes: data.notes || null,
      recommendation: data.recommendation || null,
    };
    await this.db.insert(schema.interviewScorecards).values(row);
    await this.db.update(schema.interviews).set({ status: 'Completed' }).where(eq(schema.interviews.id, interviewId));
    await this.logTimeline(
      companyId,
      interview.candidateId,
      actor,
      `Scorecard submitted (${data.recommendation || 'no recommendation'})`,
      data.notes
    );
    return row;
  }

  // ---------------- Offers ----------------
  async listOffers(companyId: string) {
    return this.db.query.offers.findMany({ where: eq(schema.offers.companyId, companyId), orderBy: [desc(schema.offers.createdAt)] });
  }

  async createOffer(companyId: string, actor: AtsActor | undefined, data: any) {
    if (!data.candidateId || !data.title || !data.salary) {
      throw new Error('candidateId, title and salary are required');
    }
    const candidate = await this.db.query.candidates.findFirst({
      where: and(eq(schema.candidates.id, data.candidateId), eq(schema.candidates.companyId, companyId)),
    });
    if (!candidate) throw new Error('Candidate not found');

    const letterBody =
      data.letterBody ||
      `Dear ${candidate.name},\n\nWe are delighted to offer you the position of ${data.title}` +
        (data.department ? ` in ${data.department}` : '') +
        `, with an annual compensation of ${data.currency || 'NGN'} ${Number(data.salary).toLocaleString()}` +
        (data.startDate ? `, starting ${data.startDate}` : '') +
        `.\n\nPlease review the terms and confirm your acceptance` +
        (data.expiryDate ? ` by ${data.expiryDate}` : '') +
        `.\n\nCongratulations!`;

    const id = genId('OFF');
    const row = {
      id,
      companyId,
      candidateId: data.candidateId,
      requisitionId: candidate.requisitionId || null,
      title: data.title,
      department: data.department || null,
      salary: Number(data.salary),
      currency: data.currency || 'NGN',
      startDate: data.startDate || null,
      expiryDate: data.expiryDate || null,
      status: 'draft',
      letterBody,
      createdBy: actor?.id || null,
    };
    await this.db.insert(schema.offers).values(row);
    await this.logTimeline(companyId, data.candidateId, actor, `Offer drafted: ${data.title}`);
    return row;
  }

  async sendOffer(companyId: string, actor: AtsActor | undefined, id: string) {
    const offer = await this.db.query.offers.findFirst({ where: and(eq(schema.offers.id, id), eq(schema.offers.companyId, companyId)) });
    if (!offer) return null;
    if (!['draft', 'pending_approval'].includes(offer.status)) throw new Error(`Cannot send an offer in "${offer.status}" status`);

    const sentAt = new Date().toISOString();
    await this.db.update(schema.offers).set({ status: 'sent', sentAt }).where(eq(schema.offers.id, id));
    await this.updateCandidateStatus(companyId, actor, offer.candidateId, 'offer');
    await this.logTimeline(companyId, offer.candidateId, actor, `Offer sent: ${offer.title}`);
    return { ...offer, status: 'sent', sentAt };
  }

  // Records the candidate's decision — there's no candidate-facing portal
  // yet, so HR/Recruiter logs the verbal/emailed response here.
  async respondToOffer(companyId: string, actor: AtsActor | undefined, id: string, decision: 'accepted' | 'declined') {
    const offer = await this.db.query.offers.findFirst({ where: and(eq(schema.offers.id, id), eq(schema.offers.companyId, companyId)) });
    if (!offer) return null;
    if (offer.status !== 'sent') throw new Error(`Cannot record a response for an offer in "${offer.status}" status`);

    const respondedAt = new Date().toISOString();
    await this.db.update(schema.offers).set({ status: decision, respondedAt }).where(eq(schema.offers.id, id));
    if (decision === 'accepted') {
      await this.updateCandidateStatus(companyId, actor, offer.candidateId, 'hired');
      // The state transition above (offer accepted, candidate hired) must
      // succeed regardless of whether auto-creating the employee record
      // works — e.g. a duplicate email should surface as a timeline note for
      // HR to resolve manually, not roll back a real hiring decision.
      try {
        await this.hireCandidate(companyId, actor, offer);
      } catch (err: any) {
        await this.logTimeline(companyId, offer.candidateId, actor, `Employee record could not be auto-created: ${err.message}`);
      }
    } else {
      await this.logTimeline(companyId, offer.candidateId, actor, 'Offer declined');
    }
    return { ...offer, status: decision, respondedAt };
  }

  // Bridges the ATS pipeline to Workforce/onboarding: an accepted offer used
  // to leave the candidate at status 'hired' with no employee record and no
  // requisition closure — HR had to re-key the person by hand.
  private async hireCandidate(companyId: string, actor: AtsActor | undefined, offer: any) {
    const candidate = await this.db.query.candidates.findFirst({ where: eq(schema.candidates.id, offer.candidateId) });
    if (!candidate || candidate.hiredEmployeeId) return; // already linked — don't double-create on a re-triggered response

    const [firstName, ...rest] = candidate.name.trim().split(/\s+/);
    const lastName = rest.join(' ') || firstName;

    const employeeService = new EmployeeService(this.dbBinding);
    const employee = await employeeService.createForCompany(companyId, {
      name: firstName,
      lastName,
      email: candidate.email,
      phone: candidate.phone || null,
      role: 'EMPLOYEE',
      department: offer.department || null,
      employmentType: 'Full-time',
      salary: offer.salary,
      hireDate: offer.startDate || new Date().toISOString().split('T')[0],
    });

    await this.db.update(schema.candidates).set({ hiredEmployeeId: employee.id }).where(eq(schema.candidates.id, candidate.id));

    if (offer.requisitionId) {
      await this.db
        .update(schema.jobRequisitions)
        .set({ status: 'Filled' })
        .where(and(eq(schema.jobRequisitions.id, offer.requisitionId), eq(schema.jobRequisitions.companyId, companyId)));
    }

    await this.logTimeline(companyId, candidate.id, actor, `Employee record created (${employee.id}) — onboarding started`);
  }

  async rescindOffer(companyId: string, actor: AtsActor | undefined, id: string) {
    const offer = await this.db.query.offers.findFirst({ where: and(eq(schema.offers.id, id), eq(schema.offers.companyId, companyId)) });
    if (!offer) return null;
    await this.db.update(schema.offers).set({ status: 'rescinded' }).where(eq(schema.offers.id, id));
    await this.logTimeline(companyId, offer.candidateId, actor, 'Offer rescinded');
    return { ...offer, status: 'rescinded' };
  }
}
