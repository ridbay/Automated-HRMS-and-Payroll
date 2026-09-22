import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ManagerDashboard from '../features/manager/ManagerDashboard';
import * as client from '../api/client';

// ManagerDashboard wraps its section content in framer-motion's AnimatePresence
// (mode="wait") — see Payroll.test.tsx / Onboarding.test.tsx for why this
// needs stripping down in jsdom.
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

vi.mock('../context/NavigationContext', () => ({
  useNavigation: () => ({ activeTab: 'manager-dashboard' }),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Jane Manager', role: 'MANAGER' } }),
}));

const {
  mockUpdateLeaveStatus, mockAssignGoal, mockSubmitManagerReview, mockCreateRequisition, mockApprovePeerNomination,
} = vi.hoisted(() => ({
  mockUpdateLeaveStatus: vi.fn(),
  mockAssignGoal: vi.fn(),
  mockSubmitManagerReview: vi.fn(),
  mockCreateRequisition: vi.fn(),
  mockApprovePeerNomination: vi.fn(),
}));

vi.mock('../api/client', () => ({
  useMyDirectReports: vi.fn(() => ({ data: [] })),
  useMyTeamAttendanceToday: vi.fn(() => ({ data: [] })),
  useTeamPendingLeaves: vi.fn(() => ({ data: [] })),
  useUpdateTeamLeaveStatus: vi.fn(() => ({ mutate: mockUpdateLeaveStatus, isPending: false })),
  useMyJobRequisitions: vi.fn(() => ({ data: [], isLoading: false })),
  useCreateJobRequisition: vi.fn(() => ({ mutate: mockCreateRequisition, isPending: false })),
  useDepartments: vi.fn(() => ({ data: [{ id: 'D1', name: 'Engineering' }] })),
  useLocations: vi.fn(() => ({ data: [{ id: 'L1', name: 'Lagos' }] })),
  useTeamGoals: vi.fn(() => ({ data: [] })),
  useAssignTeamGoal: vi.fn(() => ({ mutate: mockAssignGoal, isPending: false })),
  useTeamPendingAssessments: vi.fn(() => ({ data: { pending: [], ratingScale: [] } })),
  useSubmitManagerReview: vi.fn(() => ({ mutate: mockSubmitManagerReview, isPending: false })),
  useTeamPerformanceAnalytics: vi.fn(() => ({ data: undefined })),
  useTeamPendingPeerApprovals: vi.fn(() => ({ data: [] })),
  useApprovePeerNomination: vi.fn(() => ({ mutate: mockApprovePeerNomination, isPending: false })),
  useAssessmentEvidence: vi.fn(() => ({ data: [] })),
  useActiveCycleAssessment: vi.fn(() => ({ data: undefined })),
}));

describe('ManagerDashboard', () => {
  beforeEach(() => {
    mockUpdateLeaveStatus.mockClear();
    mockAssignGoal.mockClear();
    mockSubmitManagerReview.mockClear();
    mockCreateRequisition.mockClear();
    vi.mocked(client.useMyDirectReports).mockReturnValue({ data: [] } as any);
    vi.mocked(client.useTeamPendingLeaves).mockReturnValue({ data: [] } as any);
    vi.mocked(client.useTeamPendingAssessments).mockReturnValue({ data: { pending: [], ratingScale: [] } } as any);
    vi.mocked(client.useTeamPendingPeerApprovals).mockReturnValue({ data: [] } as any);
  });

  it('greets with the count of pending actions, summed across leave, reviews, and peer approvals', () => {
    vi.mocked(client.useTeamPendingLeaves).mockReturnValue({ data: [{ id: 'LR-1' }] } as any);
    vi.mocked(client.useTeamPendingAssessments).mockReturnValue({ data: { pending: [{ id: 'A-1' }, { id: 'A-2' }], ratingScale: [] } } as any);
    vi.mocked(client.useTeamPendingPeerApprovals).mockReturnValue({ data: [{ id: 'P-1' }] } as any);

    render(<ManagerDashboard />);

    // Scoped to <b> because a KPI stat card elsewhere on the same dashboard
    // can coincidentally also render the text "4".
    expect(screen.getByText('4', { selector: 'b' })).toBeInTheDocument(); // 1 leave + 2 reviews + 1 peer approval
    expect(screen.getByText('4 Approvals')).toBeInTheDocument();
  });

  it('shows "all caught up" when there is nothing pending', () => {
    render(<ManagerDashboard />);
    // The time-of-day greeting and this message are adjacent text nodes
    // within the same <p>, not one text node — match the <p>'s exact combined
    // content (a substring/.includes matcher would also match every ancestor,
    // since textContent aggregates upward).
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    expect(screen.getByText(
      (_, el) => el?.tagName.toLowerCase() === 'p' && el.textContent === `Good ${greeting}, Jane. You're all caught up — no pending actions today.`
    )).toBeInTheDocument();
  });

  it('forwards a leave approval from the Approvals section to updateTeamLeaveStatus', () => {
    vi.mocked(client.useTeamPendingLeaves).mockReturnValue({
      data: [{ id: 'LR-1', name: 'Ada', lastName: 'Lovelace', type: 'Annual', startDate: '2026-03-01', endDate: '2026-03-05', days: 5, reason: 'Trip' }],
    } as any);

    render(<ManagerDashboard />);
    fireEvent.click(screen.getByText('Approvals'));
    fireEvent.click(screen.getByText('Approve'));

    expect(mockUpdateLeaveStatus).toHaveBeenCalledWith({ id: 'LR-1', status: 'approved' });
  });

  describe('Assign Goal', () => {
    it('keeps the submit button disabled until both a team member and a title are set', () => {
      vi.mocked(client.useMyDirectReports).mockReturnValue({ data: [{ id: 'EMP-1', name: 'Ada', lastName: 'Lovelace' }] } as any);

      render(<ManagerDashboard />);
      fireEvent.click(screen.getByText('Performance'));
      // Only the header trigger button exists before the modal opens.
      fireEvent.click(screen.getByRole('button', { name: 'Assign Goal' }));

      // Both the (still-mounted) trigger and the modal's own submit button
      // are now named "Assign Goal" — the submit button is rendered later
      // in the tree, so it's the second match.
      const submitButton = screen.getAllByRole('button', { name: 'Assign Goal' })[1];
      expect(submitButton).toBeDisabled();

      fireEvent.change(screen.getByDisplayValue('Select a direct report…'), { target: { value: 'EMP-1' } });
      fireEvent.change(screen.getByPlaceholderText('e.g. Ship the Q3 billing revamp'), { target: { value: 'Ship v2' } });

      expect(screen.getAllByRole('button', { name: 'Assign Goal' })[1]).not.toBeDisabled();
    });

    it('submits the goal and closes the modal on success', () => {
      mockAssignGoal.mockImplementation((_payload, { onSuccess }) => onSuccess());
      vi.mocked(client.useMyDirectReports).mockReturnValue({ data: [{ id: 'EMP-1', name: 'Ada', lastName: 'Lovelace' }] } as any);

      render(<ManagerDashboard />);
      fireEvent.click(screen.getByText('Performance'));
      fireEvent.click(screen.getByRole('button', { name: 'Assign Goal' }));
      fireEvent.change(screen.getByDisplayValue('Select a direct report…'), { target: { value: 'EMP-1' } });
      fireEvent.change(screen.getByPlaceholderText('e.g. Ship the Q3 billing revamp'), { target: { value: 'Ship v2' } });
      fireEvent.click(screen.getAllByRole('button', { name: 'Assign Goal' })[1]);

      expect(mockAssignGoal).toHaveBeenCalledWith(
        expect.objectContaining({ employeeId: 'EMP-1', title: 'Ship v2' }),
        expect.objectContaining({ onSuccess: expect.any(Function) })
      );
      expect(screen.queryByPlaceholderText('e.g. Ship the Q3 billing revamp')).not.toBeInTheDocument();
    });
  });

  describe('Manager review of a self-assessment', () => {
    it('keeps Submit disabled until a rating is chosen, then submits it', () => {
      vi.mocked(client.useTeamPendingAssessments).mockReturnValue({
        data: { pending: [{ id: 'A-1', employeeName: 'Ada', employeeLastName: 'Lovelace', cycleName: 'H1 2026' }], ratingScale: [{ value: 'exceeds', label: 'Exceeds Expectations' }] },
      } as any);
      mockSubmitManagerReview.mockImplementation((_payload, { onSuccess }) => onSuccess());

      render(<ManagerDashboard />);
      fireEvent.click(screen.getByText('Performance'));
      fireEvent.click(screen.getByText('Review'));

      expect(screen.getByRole('button', { name: /Submit/ })).toBeDisabled();

      fireEvent.change(screen.getByDisplayValue('Select rating…'), { target: { value: 'exceeds' } });
      const submitButton = screen.getByRole('button', { name: /Submit/ });
      expect(submitButton).not.toBeDisabled();

      fireEvent.click(submitButton);
      expect(mockSubmitManagerReview).toHaveBeenCalledWith(
        { id: 'A-1', managerRating: 'exceeds', managerComment: '' },
        expect.objectContaining({ onSuccess: expect.any(Function) })
      );
    });
  });

  describe('Request New Hire', () => {
    it('blocks submission when title, department, or location is missing', () => {
      render(<ManagerDashboard />);
      // "+ Request New Hire" lives on the default Management Hub (dashboard) section.
      fireEvent.click(screen.getByText('+ Request New Hire'));
      fireEvent.click(screen.getByText('Submit Request'));

      expect(screen.getByText('Job title, department and location are required.')).toBeInTheDocument();
      expect(mockCreateRequisition).not.toHaveBeenCalled();
    });

    it('submits with the selected department/location and closes on success', () => {
      mockCreateRequisition.mockImplementation((_payload, { onSuccess }) => onSuccess());

      render(<ManagerDashboard />);
      fireEvent.click(screen.getByText('+ Request New Hire'));

      fireEvent.change(screen.getByPlaceholderText('e.g. Senior Product Designer'), { target: { value: 'Staff Engineer' } });
      fireEvent.change(screen.getByDisplayValue('Select department'), { target: { value: 'Engineering' } });
      fireEvent.change(screen.getByDisplayValue('Select location'), { target: { value: 'Lagos' } });

      fireEvent.click(screen.getByText('Submit Request'));

      expect(mockCreateRequisition).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Staff Engineer', department: 'Engineering', location: 'Lagos' }),
        expect.objectContaining({ onSuccess: expect.any(Function) })
      );
    });
  });
});
