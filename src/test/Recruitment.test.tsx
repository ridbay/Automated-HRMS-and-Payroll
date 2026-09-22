import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Recruitment from '../features/recruitment/Recruitment';
import * as client from '../api/client';

// Recruitment wraps several regions in framer-motion's AnimatePresence
// (view-mode swaps, the candidate detail slide-over, all three modals) —
// see Payroll.test.tsx / Onboarding.test.tsx for why this needs stripping
// down in jsdom (exit transitions never resolve, leaving stale DOM behind).
vi.mock('framer-motion', () => {
  const stripMotionProps = ({
    initial, animate, exit, transition, whileHover, whileTap, layout, layoutId, variants, ...rest
  }: any) => rest;
  // Cached per tag so the same component type is reused across renders —
  // an uncached Proxy trap returns a brand-new forwardRef() on every access,
  // and React remounts (rather than updates) a subtree whose component type
  // changed identity, which silently invalidates any DOM node reference a
  // test captured before a re-render.
  const componentCache = new Map<string, any>();
  const motion = new Proxy(
    {},
    {
      get: (_target, tag: string) => {
        if (!componentCache.has(tag)) {
          componentCache.set(
            tag,
            React.forwardRef((props: any, ref: any) => React.createElement(tag, { ...stripMotionProps(props), ref }))
          );
        }
        return componentCache.get(tag);
      },
    }
  );
  return {
    motion,
    AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
  };
});

const mockUser: any = { id: 'emp-1', name: 'Sarah Connor', role: 'HR_ADMIN' };

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

const {
  mockApproveReq, mockRejectReq, mockDeleteReq, mockCreateReq,
  mockScheduleInterview, mockCreateOffer, mockSendOffer, mockRespondToOffer, mockUpdateCandidateStatus,
  mockCreateDepartment, mockCreateLocation, mockCreateCandidate,
} = vi.hoisted(() => ({
  mockApproveReq: vi.fn(),
  mockRejectReq: vi.fn(),
  mockDeleteReq: vi.fn(),
  mockCreateReq: vi.fn(),
  mockScheduleInterview: vi.fn(),
  mockCreateOffer: vi.fn(),
  mockSendOffer: vi.fn(),
  mockRespondToOffer: vi.fn(),
  mockUpdateCandidateStatus: vi.fn(),
  mockCreateDepartment: vi.fn(),
  mockCreateLocation: vi.fn(),
  mockCreateCandidate: vi.fn(),
}));

vi.mock('../api/client', () => ({
  useJobRequisitions: vi.fn(() => ({ data: [], isLoading: false })),
  useCreateJobRequisition: vi.fn(() => ({ mutate: mockCreateReq, isPending: false })),
  useApproveJobRequisition: vi.fn(() => ({ mutate: mockApproveReq, isPending: false })),
  useRejectJobRequisition: vi.fn(() => ({ mutate: mockRejectReq, isPending: false })),
  useDeleteJobRequisition: vi.fn(() => ({ mutate: mockDeleteReq, isPending: false })),
  useDepartments: vi.fn(() => ({ data: [{ id: 'D1', name: 'Engineering' }] })),
  useCreateDepartment: vi.fn(() => ({ mutate: mockCreateDepartment, isPending: false })),
  useLocations: vi.fn(() => ({ data: [{ id: 'L1', name: 'Lagos' }] })),
  useCreateLocation: vi.fn(() => ({ mutate: mockCreateLocation, isPending: false })),
  useDirectory: vi.fn(() => ({ data: [{ id: 'EMP-1', name: 'Tunde Bakare', avatar: '', role: 'Engineer' }] })),
  useCandidates: vi.fn(() => ({ data: [] })),
  useCandidate: vi.fn(() => ({ data: undefined })),
  useCreateCandidate: vi.fn(() => ({ mutate: mockCreateCandidate, isPending: false })),
  useUpdateCandidateStatus: vi.fn(() => ({ mutate: mockUpdateCandidateStatus, isPending: false })),
  useInterviews: vi.fn(() => ({ data: [] })),
  useScheduleInterview: vi.fn(() => ({ mutate: mockScheduleInterview, isPending: false })),
  useOffers: vi.fn(() => ({ data: [] })),
  useRecruitmentReport: vi.fn(() => ({ data: undefined })),
  useCreateOffer: vi.fn(() => ({ mutate: mockCreateOffer, isPending: false })),
  useSendOffer: vi.fn(() => ({ mutate: mockSendOffer, isPending: false })),
  useRespondToOffer: vi.fn(() => ({ mutate: mockRespondToOffer, isPending: false })),
  useSendCandidateMessage: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useSubmitScorecard: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  candidateResumeUrl: vi.fn(() => ''),
  downloadAuthenticatedBlob: vi.fn(),
}));

const requisition = (overrides: any = {}) => ({
  id: 'REQ-1',
  title: 'Senior Engineer',
  department: 'Engineering',
  location: 'Lagos',
  employmentType: 'Full-time',
  priority: 'High',
  status: 'Pending Approval',
  hiringManager: 'Jane Doe',
  managerAvatar: '',
  daysOpen: 5,
  applicantsByStage: { applied: 2, screening: 1, interview: 0 },
  rejectionReason: null,
  ...overrides,
});

const candidate = (overrides: any = {}) => ({
  id: 'CAND-1',
  name: 'Ada Lovelace',
  currentTitle: 'Frontend Developer',
  ...overrides,
});

describe('Recruitment', () => {
  beforeEach(() => {
    mockApproveReq.mockClear();
    mockRejectReq.mockClear();
    mockDeleteReq.mockClear();
    mockCreateReq.mockClear();
    mockScheduleInterview.mockClear();
    mockCreateOffer.mockClear();
    mockSendOffer.mockClear();
    mockRespondToOffer.mockClear();
    mockUpdateCandidateStatus.mockClear();
    mockCreateDepartment.mockClear();
    mockCreateLocation.mockClear();
    mockCreateCandidate.mockClear();
    mockUser.role = 'HR_ADMIN';
    vi.mocked(client.useJobRequisitions).mockReturnValue({ data: [], isLoading: false } as any);
    vi.mocked(client.useCandidates).mockReturnValue({ data: [] } as any);
    vi.mocked(client.useOffers).mockReturnValue({ data: [] } as any);
    vi.spyOn(window, 'prompt');
  });

  describe('Requisition approvals (Open Jobs tab)', () => {
    it('approves a pending requisition', () => {
      vi.mocked(client.useJobRequisitions).mockReturnValue({ data: [requisition()], isLoading: false } as any);

      render(<Recruitment />);
      fireEvent.click(screen.getByText('Open Jobs'));
      fireEvent.click(screen.getByText('Approve'));

      expect(mockApproveReq).toHaveBeenCalledWith('REQ-1');
    });

    it('rejects a pending requisition with an optional reason from the prompt', () => {
      vi.mocked(window.prompt).mockReturnValue('Budget frozen this quarter');
      vi.mocked(client.useJobRequisitions).mockReturnValue({ data: [requisition()], isLoading: false } as any);

      render(<Recruitment />);
      fireEvent.click(screen.getByText('Open Jobs'));
      fireEvent.click(screen.getByText('Reject'));

      expect(mockRejectReq).toHaveBeenCalledWith({ id: 'REQ-1', reason: 'Budget frozen this quarter' });
    });

    it('does not show Approve/Reject for a requisition that is not Pending Approval', () => {
      vi.mocked(client.useJobRequisitions).mockReturnValue({ data: [requisition({ status: 'Open' })], isLoading: false } as any);

      render(<Recruitment />);
      fireEvent.click(screen.getByText('Open Jobs'));

      expect(screen.queryByText('Approve')).not.toBeInTheDocument();
      expect(screen.queryByText('Reject')).not.toBeInTheDocument();
    });

    it('does not show Approve/Reject or "New Req" to a Recruiter (only HR Admin/Super Admin can manage requisitions)', () => {
      mockUser.role = 'RECRUITER';
      vi.mocked(client.useJobRequisitions).mockReturnValue({ data: [requisition()], isLoading: false } as any);

      render(<Recruitment />);
      fireEvent.click(screen.getByText('Open Jobs'));

      expect(screen.queryByText('Approve')).not.toBeInTheDocument();
      expect(screen.queryByText('New Req')).not.toBeInTheDocument();
    });
  });

  describe('New requisition form', () => {
    it('blocks submission and never calls the mutation when title, department, or location is missing', () => {
      render(<Recruitment />);
      fireEvent.click(screen.getByText('Open Jobs'));
      fireEvent.click(screen.getByText('New Req'));
      fireEvent.click(screen.getByText('Publish Requisition'));

      expect(screen.getByText('Job title, department and location are required.')).toBeInTheDocument();
      expect(mockCreateReq).not.toHaveBeenCalled();
    });

    it('submits with a formatted budget range when salary bounds are given, and closes on success', () => {
      mockCreateReq.mockImplementation((_payload, { onSuccess }) => onSuccess());

      render(<Recruitment />);
      fireEvent.click(screen.getByText('Open Jobs'));
      fireEvent.click(screen.getByText('New Req'));

      fireEvent.change(screen.getByPlaceholderText('e.g. Senior Frontend Engineer'), { target: { value: 'Staff Engineer' } });
      fireEvent.change(screen.getByDisplayValue('Select department'), { target: { value: 'Engineering' } });
      fireEvent.change(screen.getByDisplayValue('Select location'), { target: { value: 'Lagos' } });
      fireEvent.change(screen.getByPlaceholderText('Min (₦)'), { target: { value: '5000000' } });
      fireEvent.change(screen.getByPlaceholderText('Max (₦)'), { target: { value: '7000000' } });
      fireEvent.click(screen.getByText('Publish Requisition'));

      expect(mockCreateReq).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Staff Engineer',
          department: 'Engineering',
          location: 'Lagos',
          budgetRange: '₦5,000,000 - ₦7,000,000',
        }),
        expect.objectContaining({ onSuccess: expect.any(Function) })
      );
      expect(screen.queryByText('Draft Requisition')).not.toBeInTheDocument();
    });
  });

  describe('Interview scheduling', () => {
    const openScheduleModalAtInterviewsTab = () => {
      vi.mocked(client.useCandidates).mockReturnValue({ data: [candidate()] } as any);
      render(<Recruitment />);
      // Scoped to a button: the dashboard tab (the default view) also shows
      // an "Interviews" stat card label at the same time as this nav button.
      fireEvent.click(screen.getByRole('button', { name: /Interviews/ }));
      fireEvent.click(screen.getByText('New Interview'));
    };

    it('blocks the final "Send Invites" step when no candidate or date/time was picked', () => {
      openScheduleModalAtInterviewsTab();

      for (let i = 0; i < 4; i++) fireEvent.click(screen.getByText('Continue'));
      fireEvent.click(screen.getByText('Send Invites'));

      expect(screen.getByText('Pick a candidate for this interview.')).toBeInTheDocument();
      expect(mockScheduleInterview).not.toHaveBeenCalled();
    });

    it('schedules the interview once a candidate and date/time are set, and closes the modal', () => {
      mockScheduleInterview.mockImplementation((_payload, { onSuccess }) => onSuccess());
      openScheduleModalAtInterviewsTab();

      fireEvent.change(screen.getByDisplayValue('Select a candidate…'), { target: { value: 'CAND-1' } });
      const dateInput = document.querySelector('input[type="datetime-local"]')!;
      fireEvent.change(dateInput, { target: { value: '2026-03-01T10:00' } });

      for (let i = 0; i < 4; i++) fireEvent.click(screen.getByText('Continue'));
      fireEvent.click(screen.getByText('Send Invites'));

      expect(mockScheduleInterview).toHaveBeenCalledWith(
        expect.objectContaining({ candidateId: 'CAND-1', dateTime: '2026-03-01T10:00' }),
        expect.objectContaining({ onSuccess: expect.any(Function) })
      );
      expect(screen.queryByText('Schedule Interview')).not.toBeInTheDocument();
    });
  });

  describe('Offers', () => {
    const openOfferModalAtOffersTab = () => {
      vi.mocked(client.useCandidates).mockReturnValue({ data: [candidate()] } as any);
      render(<Recruitment />);
      fireEvent.click(screen.getByText('Offers'));
      fireEvent.click(screen.getByText('Generate Offer Letter'));
    };

    it('blocks submission when candidate, title, or salary is missing', () => {
      openOfferModalAtOffersTab();
      fireEvent.click(screen.getByText('Continue'));
      fireEvent.click(screen.getByText('Continue'));
      fireEvent.click(screen.getByText('Send Offer'));

      expect(screen.getByText('Candidate, title and salary are required.')).toBeInTheDocument();
      expect(mockCreateOffer).not.toHaveBeenCalled();
    });

    it('creates the offer then immediately sends it, closing the modal only once both succeed', () => {
      mockCreateOffer.mockImplementation((_payload, { onSuccess }) => onSuccess({ id: 'OFF-NEW' }));
      mockSendOffer.mockImplementation((_id, { onSuccess }) => onSuccess());
      openOfferModalAtOffersTab();

      fireEvent.change(screen.getByDisplayValue('Select a candidate…'), { target: { value: 'CAND-1' } });
      fireEvent.change(screen.getByPlaceholderText('e.g. Senior React Developer'), { target: { value: 'Staff Engineer' } });
      fireEvent.change(screen.getByPlaceholderText('14,500,000'), { target: { value: '15,000,000' } });

      fireEvent.click(screen.getByText('Continue'));
      fireEvent.click(screen.getByText('Continue'));
      fireEvent.click(screen.getByText('Send Offer'));

      expect(mockCreateOffer).toHaveBeenCalledWith(
        expect.objectContaining({ candidateId: 'CAND-1', title: 'Staff Engineer', salary: 15000000 }),
        expect.objectContaining({ onSuccess: expect.any(Function) })
      );
      expect(mockSendOffer).toHaveBeenCalledWith('OFF-NEW', expect.objectContaining({ onSuccess: expect.any(Function) }));
      expect(screen.queryByText('Extend Offer')).not.toBeInTheDocument();
    });

    it('reports a distinct error when the offer is created but fails to send', () => {
      mockCreateOffer.mockImplementation((_payload, { onSuccess }) => onSuccess({ id: 'OFF-NEW' }));
      mockSendOffer.mockImplementation((_id, { onError }) => onError({}));
      openOfferModalAtOffersTab();

      fireEvent.change(screen.getByDisplayValue('Select a candidate…'), { target: { value: 'CAND-1' } });
      fireEvent.change(screen.getByPlaceholderText('e.g. Senior React Developer'), { target: { value: 'Staff Engineer' } });
      fireEvent.change(screen.getByPlaceholderText('14,500,000'), { target: { value: '15,000,000' } });
      fireEvent.click(screen.getByText('Continue'));
      fireEvent.click(screen.getByText('Continue'));
      fireEvent.click(screen.getByText('Send Offer'));

      expect(screen.getByText('Offer created but failed to send.')).toBeInTheDocument();
    });

    it('marks a sent offer accepted or declined via respondToOffer', () => {
      vi.mocked(client.useOffers).mockReturnValue({
        data: [{ id: 'OFF-1', candidateId: 'CAND-1', status: 'sent', title: 'Frontend Dev', salary: 5000000, expiryDate: '2026-03-01' }],
      } as any);
      vi.mocked(client.useCandidates).mockReturnValue({ data: [candidate()] } as any);

      render(<Recruitment />);
      fireEvent.click(screen.getByText('Offers'));
      fireEvent.click(screen.getByText('Mark Accepted'));
      expect(mockRespondToOffer).toHaveBeenCalledWith({ id: 'OFF-1', decision: 'accepted' });

      fireEvent.click(screen.getByText('Mark Declined'));
      expect(mockRespondToOffer).toHaveBeenCalledWith({ id: 'OFF-1', decision: 'declined' });
    });
  });
});
