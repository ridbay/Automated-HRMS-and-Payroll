import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AtsService } from '../../src/services/ats.service';
import { EmployeeService } from '../../src/services/employee.service';
import { TransitionService } from '../../src/services/transition.service';

vi.mock('../../src/services/employee.service');
vi.mock('../../src/services/transition.service');

describe('Ats Service', () => {
  let mockDb: any;
  let service: AtsService;
  const actor = { id: 'emp-1', name: 'HR Admin', role: 'HR_ADMIN' };

  beforeEach(() => {
    mockDb = {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      query: {
        candidates: { findFirst: vi.fn(), findMany: vi.fn() },
        candidateTimelineEvents: { findMany: vi.fn() },
        interviews: { findFirst: vi.fn(), findMany: vi.fn() },
        interviewScorecards: { findMany: vi.fn() },
        offers: { findFirst: vi.fn(), findMany: vi.fn() },
      },
    };

    service = new AtsService({} as any);
    (service as any).db = mockDb;
  });

  describe('createCandidate', () => {
    it('rejects a candidate with no name or email', async () => {
      await expect(service.createCandidate('comp-1', actor, {})).rejects.toThrow('name and email are required');
    });

    it('inserts the candidate and logs an "Application submitted" timeline event', async () => {
      await service.createCandidate('comp-1', actor, { name: 'Ada Lovelace', email: 'ada@example.com', requisitionId: 'REQ-1' });

      expect(mockDb.insert).toHaveBeenCalledTimes(2); // candidate row + timeline event
      const candidateValues = mockDb.values.mock.calls[0][0];
      expect(candidateValues.name).toBe('Ada Lovelace');
      expect(candidateValues.status).toBe('applied');
      expect(candidateValues.companyId).toBe('comp-1');

      const timelineValues = mockDb.values.mock.calls[1][0];
      expect(timelineValues.event).toBe('Application submitted');
    });
  });

  describe('updateCandidateStatus', () => {
    it('rejects an invalid status', async () => {
      await expect(service.updateCandidateStatus('comp-1', actor, 'CAND-1', 'ghosted')).rejects.toThrow('status must be one of');
    });

    it('returns null for a candidate outside the company', async () => {
      mockDb.query.candidates.findFirst.mockResolvedValueOnce(undefined);
      const result = await service.updateCandidateStatus('comp-1', actor, 'CAND-1', 'screening');
      expect(result).toBeNull();
      expect(mockDb.update).not.toHaveBeenCalled();
    });

    it('updates status and logs a timeline event', async () => {
      mockDb.query.candidates.findFirst.mockResolvedValueOnce({ id: 'CAND-1', companyId: 'comp-1', status: 'applied' });
      const result = await service.updateCandidateStatus('comp-1', actor, 'CAND-1', 'screening');
      expect(result?.status).toBe('screening');
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set.mock.calls[0][0]).toEqual({ status: 'screening' });
    });
  });

  describe('scheduleInterview', () => {
    it('rejects when required fields are missing', async () => {
      await expect(service.scheduleInterview('comp-1', actor, { candidateId: 'CAND-1' })).rejects.toThrow(
        'candidateId, type, stage and dateTime are required'
      );
    });

    it('throws if the candidate does not exist in this company', async () => {
      mockDb.query.candidates.findFirst.mockResolvedValueOnce(undefined);
      await expect(
        service.scheduleInterview('comp-1', actor, { candidateId: 'CAND-X', type: 'Video', stage: 'Technical', dateTime: '2025-01-01T10:00:00Z' })
      ).rejects.toThrow('Candidate not found');
    });

    it('creates the interview and advances an "applied"/"screening" candidate to "interview"', async () => {
      // scheduleInterview looks the candidate up once itself, then delegates
      // to updateCandidateStatus which looks it up again — same row both times.
      mockDb.query.candidates.findFirst.mockResolvedValue({ id: 'CAND-1', companyId: 'comp-1', status: 'applied', requisitionId: 'REQ-1' });

      const row = await service.scheduleInterview('comp-1', actor, {
        candidateId: 'CAND-1',
        type: 'Video',
        stage: 'Technical',
        dateTime: '2025-01-01T10:00:00Z',
        interviewerIds: ['emp-2'],
      });

      expect(row.status).toBe('Scheduled');
      expect(row.requisitionId).toBe('REQ-1');
      // insert #1 = interview row, then updateCandidateStatus fires (update + timeline insert)
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set.mock.calls[0][0]).toEqual({ status: 'interview' });
    });

    it('does not downgrade a candidate already at offer/hired — just logs a timeline note', async () => {
      mockDb.query.candidates.findFirst.mockResolvedValueOnce({ id: 'CAND-1', companyId: 'comp-1', status: 'offer', requisitionId: null });

      await service.scheduleInterview('comp-1', actor, {
        candidateId: 'CAND-1',
        type: 'Video',
        stage: 'Final',
        dateTime: '2025-01-01T10:00:00Z',
      });

      expect(mockDb.update).not.toHaveBeenCalled();
    });
  });

  describe('submitScorecard', () => {
    it('throws if the interview does not exist', async () => {
      mockDb.query.interviews.findFirst.mockResolvedValueOnce(undefined);
      await expect(service.submitScorecard('comp-1', actor, 'INT-1', {})).rejects.toThrow('Interview not found');
    });

    it('inserts a scorecard and marks the interview Completed', async () => {
      mockDb.query.interviews.findFirst.mockResolvedValueOnce({ id: 'INT-1', companyId: 'comp-1', candidateId: 'CAND-1' });

      await service.submitScorecard('comp-1', actor, 'INT-1', { technical: 4, recommendation: 'Hire', notes: 'Strong' });

      const scorecardValues = mockDb.values.mock.calls[0][0];
      expect(scorecardValues.recommendation).toBe('Hire');
      expect(scorecardValues.interviewerName).toBe('HR Admin');
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set.mock.calls[0][0]).toEqual({ status: 'Completed' });
    });
  });

  describe('offer lifecycle', () => {
    it('createOffer requires candidateId, title and salary', async () => {
      await expect(service.createOffer('comp-1', actor, { candidateId: 'CAND-1' })).rejects.toThrow('candidateId, title and salary are required');
    });

    it('createOffer generates a letter body when none is supplied', async () => {
      mockDb.query.candidates.findFirst.mockResolvedValueOnce({ id: 'CAND-1', companyId: 'comp-1', name: 'Ada Lovelace', requisitionId: null });
      const offer = await service.createOffer('comp-1', actor, { candidateId: 'CAND-1', title: 'Engineer', salary: 5000000 });
      expect(offer.status).toBe('draft');
      expect(offer.letterBody).toContain('Ada Lovelace');
      expect(offer.letterBody).toContain('Engineer');
    });

    it('sendOffer rejects an offer that is not draft/pending_approval', async () => {
      mockDb.query.offers.findFirst.mockResolvedValueOnce({ id: 'OFF-1', companyId: 'comp-1', status: 'sent' });
      await expect(service.sendOffer('comp-1', actor, 'OFF-1')).rejects.toThrow('Cannot send an offer in "sent" status');
    });

    it('sendOffer moves the offer to sent and the candidate to "offer"', async () => {
      mockDb.query.offers.findFirst.mockResolvedValueOnce({ id: 'OFF-1', companyId: 'comp-1', status: 'draft', candidateId: 'CAND-1', title: 'Engineer' });
      mockDb.query.candidates.findFirst.mockResolvedValueOnce({ id: 'CAND-1', companyId: 'comp-1', status: 'interview' });

      const result = await service.sendOffer('comp-1', actor, 'OFF-1');
      expect(result?.status).toBe('sent');
      // set() call #0 is the offer row itself; #1 is the cascading candidate status update.
      expect(mockDb.set.mock.calls[1][0]).toMatchObject({ status: 'offer' });
    });

    it('respondToOffer("accepted") moves the candidate to "hired"', async () => {
      mockDb.query.offers.findFirst.mockResolvedValueOnce({ id: 'OFF-1', companyId: 'comp-1', status: 'sent', candidateId: 'CAND-1' });
      mockDb.query.candidates.findFirst.mockResolvedValueOnce({ id: 'CAND-1', companyId: 'comp-1', status: 'offer' });

      const result = await service.respondToOffer('comp-1', actor, 'OFF-1', 'accepted');
      expect(result?.status).toBe('accepted');
      // set() call #0 is the offer row itself; #1 is the cascading candidate status update.
      expect(mockDb.set.mock.calls[1][0]).toMatchObject({ status: 'hired' });
    });

    it('respondToOffer rejects a response for an offer that was never sent', async () => {
      mockDb.query.offers.findFirst.mockResolvedValueOnce({ id: 'OFF-1', companyId: 'comp-1', status: 'draft' });
      await expect(service.respondToOffer('comp-1', actor, 'OFF-1', 'accepted')).rejects.toThrow(
        'Cannot record a response for an offer in "draft" status'
      );
    });

    describe('respondToOffer("accepted") bridges the ATS pipeline to Workforce', () => {
      beforeEach(() => {
        EmployeeService.prototype.createForCompany = vi.fn();
        TransitionService.prototype.create = vi.fn().mockResolvedValue({ id: 'TRN-1' });
      });

      it('creates an employee record, links it to the candidate, and closes the requisition', async () => {
        mockDb.query.offers.findFirst.mockResolvedValueOnce({
          id: 'OFF-1', companyId: 'comp-1', status: 'sent', candidateId: 'CAND-1',
          department: 'Engineering', salary: 5000000, startDate: '2026-01-01', requisitionId: 'REQ-1',
        });
        mockDb.query.candidates.findFirst
          .mockResolvedValueOnce({ id: 'CAND-1', companyId: 'comp-1', status: 'offer' }) // inside updateCandidateStatus
          .mockResolvedValueOnce({ id: 'CAND-1', companyId: 'comp-1', name: 'Ada Lovelace', email: 'ada@example.com', hiredEmployeeId: null }); // inside hireCandidate
        (EmployeeService.prototype.createForCompany as any).mockResolvedValue({ id: 'EMP-99' });

        const result = await service.respondToOffer('comp-1', actor, 'OFF-1', 'accepted');

        expect(result?.status).toBe('accepted');
        expect(EmployeeService.prototype.createForCompany).toHaveBeenCalledWith('comp-1', expect.objectContaining({
          name: 'Ada',
          lastName: 'Lovelace',
          email: 'ada@example.com',
          department: 'Engineering',
          salary: 5000000,
        }));
        // Candidate linked back to the new employee.
        expect(mockDb.set.mock.calls.some((c: any) => c[0]?.hiredEmployeeId === 'EMP-99')).toBe(true);
        // Requisition auto-closed now that it's filled.
        expect(mockDb.set.mock.calls.some((c: any) => c[0]?.status === 'Filled')).toBe(true);
        // Onboarding checklist started for the new hire, so they show up on
        // the Onboarding board immediately rather than needing a manual start.
        expect(TransitionService.prototype.create).toHaveBeenCalledWith('comp-1', actor, expect.objectContaining({
          employeeId: 'EMP-99',
          startDate: '2026-01-01',
        }));
      });

      it('logs a distinct timeline note if the onboarding checklist fails to auto-create, without failing the hire', async () => {
        mockDb.query.offers.findFirst.mockResolvedValueOnce({
          id: 'OFF-1', companyId: 'comp-1', status: 'sent', candidateId: 'CAND-1', startDate: '2026-01-01',
        });
        mockDb.query.candidates.findFirst
          .mockResolvedValueOnce({ id: 'CAND-1', companyId: 'comp-1', status: 'offer' })
          .mockResolvedValueOnce({ id: 'CAND-1', companyId: 'comp-1', name: 'Ada Lovelace', email: 'ada@example.com', hiredEmployeeId: null });
        (EmployeeService.prototype.createForCompany as any).mockResolvedValue({ id: 'EMP-99' });
        (TransitionService.prototype.create as any).mockRejectedValue(new Error('no manager assigned'));

        const result = await service.respondToOffer('comp-1', actor, 'OFF-1', 'accepted');

        // The hire itself still succeeds even though the checklist failed.
        expect(result?.status).toBe('accepted');
        const timelineCall = mockDb.values.mock.calls.find(
          (c: any) => c[0]?.event?.includes('Onboarding checklist could not be auto-created')
        );
        expect(timelineCall).toBeDefined();
      });

      it('does not re-create an employee if the candidate is already linked (idempotent)', async () => {
        mockDb.query.offers.findFirst.mockResolvedValueOnce({ id: 'OFF-1', companyId: 'comp-1', status: 'sent', candidateId: 'CAND-1' });
        mockDb.query.candidates.findFirst
          .mockResolvedValueOnce({ id: 'CAND-1', companyId: 'comp-1', status: 'offer' })
          .mockResolvedValueOnce({ id: 'CAND-1', companyId: 'comp-1', name: 'Ada Lovelace', email: 'ada@example.com', hiredEmployeeId: 'EMP-99' });

        await service.respondToOffer('comp-1', actor, 'OFF-1', 'accepted');

        expect(EmployeeService.prototype.createForCompany).not.toHaveBeenCalled();
      });

      it('logs a timeline note instead of throwing if employee auto-creation fails', async () => {
        mockDb.query.offers.findFirst.mockResolvedValueOnce({ id: 'OFF-1', companyId: 'comp-1', status: 'sent', candidateId: 'CAND-1' });
        mockDb.query.candidates.findFirst
          .mockResolvedValueOnce({ id: 'CAND-1', companyId: 'comp-1', status: 'offer' })
          .mockResolvedValueOnce({ id: 'CAND-1', companyId: 'comp-1', name: 'Ada Lovelace', email: 'ada@example.com', hiredEmployeeId: null });
        (EmployeeService.prototype.createForCompany as any).mockRejectedValue(new Error('duplicate email'));

        const result = await service.respondToOffer('comp-1', actor, 'OFF-1', 'accepted');

        // The hiring decision itself still records successfully.
        expect(result?.status).toBe('accepted');
        const timelineCall = mockDb.values.mock.calls.find((c: any) => c[0]?.event?.includes('could not be auto-created'));
        expect(timelineCall).toBeDefined();
      });
    });
  });
});
