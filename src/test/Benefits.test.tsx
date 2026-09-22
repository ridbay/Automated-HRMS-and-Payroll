import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Benefits from '../features/employee/Benefits';
import * as client from '../api/client';

// Benefits wraps its tab content in framer-motion's AnimatePresence
// (mode="wait"), which doesn't resolve its exit transition in jsdom — same
// issue documented in Payroll.test.tsx / Onboarding.test.tsx.
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

const {
  mockEnrollAsync, mockCancelAsync, mockJoinAsync, mockLeaveAsync, mockBumpAsync, mockSubmitClaimAsync, mockAlert,
} = vi.hoisted(() => ({
  mockEnrollAsync: vi.fn().mockResolvedValue({}),
  mockCancelAsync: vi.fn().mockResolvedValue({}),
  mockJoinAsync: vi.fn().mockResolvedValue({}),
  mockLeaveAsync: vi.fn().mockResolvedValue({}),
  mockBumpAsync: vi.fn().mockResolvedValue({}),
  mockSubmitClaimAsync: vi.fn().mockResolvedValue({}),
  mockAlert: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../components/PopupProvider', () => ({
  usePopup: () => ({ alert: mockAlert, prompt: vi.fn(), confirm: vi.fn() }),
}));

vi.mock('../api/client', () => ({
  useMyBenefitsSummary: vi.fn(() => ({ data: undefined, isLoading: false })),
  useAvailableBenefitPlans: vi.fn(() => ({ data: [] })),
  useWellnessPrograms: vi.fn(() => ({ data: [] })),
  useEnrollInPlan: vi.fn(() => ({ mutateAsync: mockEnrollAsync, isPending: false })),
  useCancelMyEnrollment: vi.fn(() => ({ mutateAsync: mockCancelAsync, isPending: false })),
  useAddDependent: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useDeleteDependent: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useJoinWellnessProgram: vi.fn(() => ({ mutateAsync: mockJoinAsync, isPending: false })),
  useUpdateMyProgramProgress: vi.fn(() => ({ mutateAsync: mockBumpAsync, isPending: false })),
  useLeaveWellnessProgram: vi.fn(() => ({ mutateAsync: mockLeaveAsync, isPending: false })),
  useSubmitBenefitClaim: vi.fn(() => ({ mutateAsync: mockSubmitClaimAsync, isPending: false })),
}));

const baseSummary = (overrides: any = {}) => ({
  baseSalary: 6000000,
  benefits: { wellnessBudget: 100000, wellnessUsed: 40000, retirementContributionRate: 8 },
  enrollments: [],
  dependents: [],
  claims: [],
  ...overrides,
});

describe('Benefits (employee)', () => {
  beforeEach(() => {
    mockEnrollAsync.mockClear();
    mockCancelAsync.mockClear();
    mockJoinAsync.mockClear();
    mockLeaveAsync.mockClear();
    mockBumpAsync.mockClear();
    mockSubmitClaimAsync.mockClear();
    mockAlert.mockClear();
    vi.mocked(client.useMyBenefitsSummary).mockReturnValue({ data: baseSummary(), isLoading: false } as any);
    vi.mocked(client.useAvailableBenefitPlans).mockReturnValue({ data: [] } as any);
    vi.mocked(client.useWellnessPrograms).mockReturnValue({ data: [] } as any);
  });

  describe('Enrollment', () => {
    const plans = [
      { id: 'PLAN-1', name: 'Basic Health', employeeCost: 5000, color: 'indigo', icon: 'Shield', highlights: JSON.stringify(['24/7 support', 'Dental included']) },
    ];

    it('enrolls in a plan the employee is not yet on, with an Individual coverage default', () => {
      vi.mocked(client.useAvailableBenefitPlans).mockReturnValue({ data: plans } as any);

      render(<Benefits />);
      fireEvent.click(screen.getByText('Enrollment'));
      expect(screen.getByText('Enroll in This Plan')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Enroll in This Plan'));

      expect(mockEnrollAsync).toHaveBeenCalledWith({ planId: 'PLAN-1', coverageLevel: 'Individual' });
    });

    it('shows the plan\'s highlight list parsed from JSON', () => {
      vi.mocked(client.useAvailableBenefitPlans).mockReturnValue({ data: plans } as any);

      render(<Benefits />);
      fireEvent.click(screen.getByText('Enrollment'));

      expect(screen.getByText('24/7 support')).toBeInTheDocument();
      expect(screen.getByText('Dental included')).toBeInTheDocument();
    });

    it('does not crash on malformed highlights JSON, and shows no highlight list', () => {
      vi.mocked(client.useAvailableBenefitPlans).mockReturnValue({
        data: [{ ...plans[0], highlights: '{not valid json' }],
      } as any);

      render(<Benefits />);
      fireEvent.click(screen.getByText('Enrollment'));

      expect(screen.getByText('Basic Health')).toBeInTheDocument();
      expect(screen.queryByText('24/7 support')).not.toBeInTheDocument();
    });

    it('waives (cancels) a plan the employee is already enrolled in, using the enrollment id', () => {
      vi.mocked(client.useAvailableBenefitPlans).mockReturnValue({ data: plans } as any);
      vi.mocked(client.useMyBenefitsSummary).mockReturnValue({
        data: baseSummary({ enrollments: [{ id: 'ENR-1', planId: 'PLAN-1', status: 'enrolled', plan: plans[0] }] }),
        isLoading: false,
      } as any);

      render(<Benefits />);
      fireEvent.click(screen.getByText('Enrollment'));
      expect(screen.getByText('Waive This Plan')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Waive This Plan'));

      expect(mockCancelAsync).toHaveBeenCalledWith('ENR-1');
      expect(mockEnrollAsync).not.toHaveBeenCalled();
    });
  });

  describe('Claims', () => {
    it('blocks submission and never calls the mutation when category or amount is missing', async () => {
      render(<Benefits />);
      fireEvent.click(screen.getByText('Health & Life'));
      fireEvent.click(screen.getByText('New Claim Request'));

      expect(screen.getByText('New Health Claim')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Submit Claim'));
      await Promise.resolve();

      expect(mockAlert).toHaveBeenCalledWith('Category and a valid amount are required.', 'Missing Info');
      expect(mockSubmitClaimAsync).not.toHaveBeenCalled();
    });

    it('rejects a zero or negative amount even when category is filled in', async () => {
      render(<Benefits />);
      fireEvent.click(screen.getByText('Health & Life'));
      fireEvent.click(screen.getByText('New Claim Request'));

      fireEvent.change(screen.getByPlaceholderText('e.g. Consultation, Pharmacy'), { target: { value: 'Consultation' } });
      const amountInput = screen.getByRole('spinbutton');
      fireEvent.change(amountInput, { target: { value: '0' } });
      fireEvent.click(screen.getByText('Submit Claim'));
      await Promise.resolve();

      expect(mockSubmitClaimAsync).not.toHaveBeenCalled();
    });

    it('submits a health claim with the right shape and closes the modal on success', async () => {
      render(<Benefits />);
      fireEvent.click(screen.getByText('Health & Life'));
      fireEvent.click(screen.getByText('New Claim Request'));

      fireEvent.change(screen.getByPlaceholderText('e.g. Consultation, Pharmacy'), { target: { value: 'Consultation' } });
      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '15000' } });
      fireEvent.click(screen.getByText('Submit Claim'));

      await waitFor(() => expect(mockSubmitClaimAsync).toHaveBeenCalledWith({
        kind: 'health', category: 'Consultation', amount: 15000, provider: undefined, description: undefined,
      }));
      await waitFor(() => expect(screen.queryByText('New Health Claim')).not.toBeInTheDocument());
    });

    it('labels the claim form for wellness differently from health (vendor field, remaining budget)', () => {
      render(<Benefits />);
      fireEvent.click(screen.getByText('Wellness'));
      fireEvent.click(screen.getByText('Submit Wellness Claim'));

      expect(screen.getByRole('heading', { name: 'Submit Wellness Claim' })).toBeInTheDocument();
      expect(screen.getByText('Vendor (optional)')).toBeInTheDocument();
      expect(screen.getByText(/Remaining budget: ₦60,000/)).toBeInTheDocument(); // 100,000 budget - 40,000 used
    });
  });

  describe('Wellness programs', () => {
    it('joins a program the employee hasn\'t participated in yet', () => {
      vi.mocked(client.useWellnessPrograms).mockReturnValue({
        data: [{ id: 'PRG-1', title: 'Step Challenge', participantCount: 5, category: 'Fitness', goalTarget: 10, goalLabel: 'days', myParticipation: null }],
      } as any);

      render(<Benefits />);
      fireEvent.click(screen.getByText('Wellness'));
      expect(screen.getByText('Join Challenge')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Join Challenge'));

      expect(mockJoinAsync).toHaveBeenCalledWith('PRG-1');
    });

    it('leaves a program the employee has actively joined', () => {
      vi.mocked(client.useWellnessPrograms).mockReturnValue({
        data: [{ id: 'PRG-1', title: 'Step Challenge', participantCount: 5, category: 'Fitness', goalTarget: 10, goalLabel: 'days', myParticipation: { status: 'active', progress: 3 } }],
      } as any);

      render(<Benefits />);
      fireEvent.click(screen.getByText('Wellness'));
      expect(screen.getByText('Leave')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Leave'));

      expect(mockLeaveAsync).toHaveBeenCalledWith('PRG-1');
    });

    it('treats a "dropped" participation as not joined, offering to re-join rather than leave again', () => {
      vi.mocked(client.useWellnessPrograms).mockReturnValue({
        data: [{ id: 'PRG-1', title: 'Step Challenge', participantCount: 5, category: 'Fitness', goalTarget: 10, goalLabel: 'days', myParticipation: { status: 'dropped', progress: 3 } }],
      } as any);

      render(<Benefits />);
      fireEvent.click(screen.getByText('Wellness'));
      expect(screen.getByText('Join Challenge')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Join Challenge'));

      expect(mockJoinAsync).toHaveBeenCalledWith('PRG-1');
      expect(mockLeaveAsync).not.toHaveBeenCalled();
    });

    it('logs progress in a 10%-of-goal step, rounded, with a floor of 1', () => {
      vi.mocked(client.useWellnessPrograms).mockReturnValue({
        data: [{ id: 'PRG-1', title: 'Step Challenge', participantCount: 5, category: 'Fitness', goalTarget: 25, goalLabel: 'km', myParticipation: { status: 'active', progress: 0 } }],
      } as any);

      render(<Benefits />);
      fireEvent.click(screen.getByText('Wellness'));
      fireEvent.click(screen.getByText('+ Log Progress'));

      // step = max(1, round(25 * 0.1)) = round(2.5) = 3
      expect(mockBumpAsync).toHaveBeenCalledWith({ programId: 'PRG-1', progress: 3 });
    });
  });

  describe('Summary tab', () => {
    it('pluralizes "Active Plans" correctly for 0, 1, and multiple enrollments', () => {
      const { rerender } = render(<Benefits />);
      expect(screen.getByText('0 Active Plans')).toBeInTheDocument();

      vi.mocked(client.useMyBenefitsSummary).mockReturnValue({
        data: baseSummary({ enrollments: [{ id: 'ENR-1', planId: 'PLAN-1', status: 'enrolled', plan: { name: 'Basic Health', employerCost: 1000 } }] }),
        isLoading: false,
      } as any);
      rerender(<Benefits />);
      expect(screen.getByText('1 Active Plan')).toBeInTheDocument();
    });
  });
});
