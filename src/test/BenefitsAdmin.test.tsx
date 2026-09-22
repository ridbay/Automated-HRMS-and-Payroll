import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import BenefitsAdmin from '../features/admin/BenefitsAdmin';
import * as client from '../api/client';

vi.mock('framer-motion', () => {
  const stripMotionProps = ({
    initial, animate, exit, transition, whileHover, whileTap, layout, layoutId, variants, ...rest
  }: any) => rest;
  const componentCache = new Map<string, any>();
  const motion = new Proxy(
    {},
    {
      get: (_target, tag: string) => {
        if (!componentCache.has(tag)) {
          componentCache.set(tag, React.forwardRef((props: any, ref: any) => React.createElement(tag, { ...stripMotionProps(props), ref })));
        }
        return componentCache.get(tag);
      },
    }
  );
  return { motion, AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children) };
});

const mockAlert = vi.fn().mockResolvedValue(undefined);
const mockConfirm = vi.fn().mockResolvedValue(true);
const mockPrompt = vi.fn().mockResolvedValue('');
vi.mock('../components/PopupProvider', () => ({
  usePopup: () => ({ alert: mockAlert, confirm: mockConfirm, prompt: mockPrompt }),
}));

const {
  mockCreatePlan, mockUpdatePlan, mockDeletePlan,
  mockEnrollEmployee, mockUpdateEnrollmentStatus,
  mockCreateProgram, mockUpdateProgram, mockDeleteProgram,
  mockReviewClaim,
} = vi.hoisted(() => ({
  mockCreatePlan: vi.fn(),
  mockUpdatePlan: vi.fn(),
  mockDeletePlan: vi.fn(),
  mockEnrollEmployee: vi.fn(),
  mockUpdateEnrollmentStatus: vi.fn(),
  mockCreateProgram: vi.fn(),
  mockUpdateProgram: vi.fn(),
  mockDeleteProgram: vi.fn(),
  mockReviewClaim: vi.fn(),
}));

vi.mock('../api/client', () => ({
  useBenefitsOverview: vi.fn(() => ({ data: undefined })),
  useBenefitPlans: vi.fn(() => ({ data: [], isLoading: false })),
  useCreateBenefitPlan: vi.fn(() => ({ mutateAsync: mockCreatePlan, isPending: false })),
  useUpdateBenefitPlan: vi.fn(() => ({ mutateAsync: mockUpdatePlan, isPending: false })),
  useDeleteBenefitPlan: vi.fn(() => ({ mutateAsync: mockDeletePlan })),
  useAdminEnrollments: vi.fn(() => ({ data: [], isLoading: false })),
  useAdminEnrollEmployee: vi.fn(() => ({ mutateAsync: mockEnrollEmployee, isPending: false })),
  useAdminUpdateEnrollmentStatus: vi.fn(() => ({ mutateAsync: mockUpdateEnrollmentStatus })),
  useAdminWellnessPrograms: vi.fn(() => ({ data: [], isLoading: false })),
  useCreateWellnessProgram: vi.fn(() => ({ mutateAsync: mockCreateProgram, isPending: false })),
  useUpdateWellnessProgram: vi.fn(() => ({ mutateAsync: mockUpdateProgram, isPending: false })),
  useDeleteWellnessProgram: vi.fn(() => ({ mutateAsync: mockDeleteProgram })),
  useWellnessProgramParticipants: vi.fn(() => ({ data: [] })),
  useAdminBenefitClaims: vi.fn(() => ({ data: [], isLoading: false })),
  useReviewBenefitClaim: vi.fn(() => ({ mutateAsync: mockReviewClaim })),
  useEmployees: vi.fn(() => ({ data: [] })),
}));

const plan = (overrides: any = {}) => ({
  id: 'PLAN-1', name: 'Premium Health Cover', type: 'health', provider: 'AXA Mansard', planTier: 'Gold',
  employerCost: 50000, employeeCost: 5000, coverageLimit: 5_000_000, eligibility: 'All Employees',
  icon: 'Shield', color: 'indigo', status: 'active',
  ...overrides,
});

describe('BenefitsAdmin', () => {
  beforeEach(() => {
    [mockCreatePlan, mockUpdatePlan, mockDeletePlan, mockEnrollEmployee, mockUpdateEnrollmentStatus,
      mockCreateProgram, mockUpdateProgram, mockDeleteProgram, mockReviewClaim, mockAlert, mockConfirm, mockPrompt]
      .forEach((m) => m.mockClear());
    mockConfirm.mockResolvedValue(true);
    mockPrompt.mockResolvedValue('');
    vi.mocked(client.useBenefitsOverview).mockReturnValue({ data: undefined } as any);
    vi.mocked(client.useBenefitPlans).mockReturnValue({ data: [], isLoading: false } as any);
    vi.mocked(client.useAdminEnrollments).mockReturnValue({ data: [], isLoading: false } as any);
    vi.mocked(client.useAdminWellnessPrograms).mockReturnValue({ data: [], isLoading: false } as any);
    vi.mocked(client.useAdminBenefitClaims).mockReturnValue({ data: [], isLoading: false } as any);
    vi.mocked(client.useEmployees).mockReturnValue({ data: [] } as any);
    vi.mocked(client.useWellnessProgramParticipants).mockReturnValue({ data: [] } as any);
  });

  it('shows an em dash for every stat until the overview loads', () => {
    render(<BenefitsAdmin />);
    expect(screen.getByText('Active Plans').closest('div')!.textContent).toContain('—');
  });

  it('renders the loaded overview stats, including formatted currency', () => {
    vi.mocked(client.useBenefitsOverview).mockReturnValue({
      data: { activePlans: 4, totalEnrollments: 30, pendingClaims: 2, monthlyEmployerSpend: 1_200_000 },
    } as any);
    render(<BenefitsAdmin />);
    expect(screen.getByText('Monthly Employer Spend').closest('div')!.textContent).toContain('₦1,200,000');
  });

  it('shows a pending-claims badge on the Claims tab only when there are pending claims', () => {
    vi.mocked(client.useBenefitsOverview).mockReturnValue({
      data: { activePlans: 4, totalEnrollments: 30, pendingClaims: 3, monthlyEmployerSpend: 0 },
    } as any);
    render(<BenefitsAdmin />);
    expect(screen.getByText('Claims').closest('button')!.textContent).toContain('3');
  });

  describe('Plan Catalog', () => {
    it('shows the empty state when there are no plans', () => {
      render(<BenefitsAdmin />);
      expect(screen.getByText(/No benefit plans yet/)).toBeInTheDocument();
    });

    it('renders a plan card with its costs', () => {
      vi.mocked(client.useBenefitPlans).mockReturnValue({ data: [plan()], isLoading: false } as any);
      render(<BenefitsAdmin />);
      expect(screen.getByText('Premium Health Cover')).toBeInTheDocument();
      expect(screen.getByText('₦50,000/mo')).toBeInTheDocument();
    });

    it('requires a plan name before saving', async () => {
      render(<BenefitsAdmin />);
      fireEvent.click(screen.getByText('Add Plan'));
      fireEvent.click(screen.getByText('Create Plan'));

      expect(await screen.findByText('Create Plan')).toBeInTheDocument();
      expect(mockAlert).toHaveBeenCalledWith('Plan name is required.', 'Missing Info');
      expect(mockCreatePlan).not.toHaveBeenCalled();
    });

    it('creates a new plan and closes the modal on success', async () => {
      render(<BenefitsAdmin />);
      fireEvent.click(screen.getByText('Add Plan'));
      fireEvent.change(screen.getByPlaceholderText('e.g. Premium Health Cover'), { target: { value: 'Dental Basic' } });
      fireEvent.click(screen.getByText('Create Plan'));

      await vi.waitFor(() => expect(mockCreatePlan).toHaveBeenCalledWith(expect.objectContaining({ name: 'Dental Basic' })));
      await vi.waitFor(() => expect(screen.queryByText('New Benefit Plan')).not.toBeInTheDocument());
    });

    it('pre-fills the edit modal and updates the existing plan by id', async () => {
      vi.mocked(client.useBenefitPlans).mockReturnValue({ data: [plan()], isLoading: false } as any);
      render(<BenefitsAdmin />);
      fireEvent.click(screen.getByText('Edit'));

      expect(screen.getByText('Edit Plan')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Premium Health Cover')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Save Changes'));
      await vi.waitFor(() => expect(mockUpdatePlan).toHaveBeenCalledWith({ planId: 'PLAN-1', data: expect.objectContaining({ name: 'Premium Health Cover' }) }));
    });

    it('deletes a plan after confirmation, and skips it when declined', async () => {
      vi.mocked(client.useBenefitPlans).mockReturnValue({ data: [plan()], isLoading: false } as any);
      mockConfirm.mockResolvedValueOnce(false);
      render(<BenefitsAdmin />);
      fireEvent.click(screen.getByText('Delete'));

      await vi.waitFor(() => expect(mockConfirm).toHaveBeenCalled());
      expect(mockDeletePlan).not.toHaveBeenCalled();
    });

    it('deletes the plan once confirmed', async () => {
      vi.mocked(client.useBenefitPlans).mockReturnValue({ data: [plan()], isLoading: false } as any);
      render(<BenefitsAdmin />);
      fireEvent.click(screen.getByText('Delete'));

      await vi.waitFor(() => expect(mockDeletePlan).toHaveBeenCalledWith('PLAN-1'));
    });
  });

  describe('Enrollments', () => {
    const openEnrollmentsTab = () => {
      render(<BenefitsAdmin />);
      fireEvent.click(screen.getByText('Enrollments'));
    };

    it('shows the empty state when there are no enrollments', () => {
      openEnrollmentsTab();
      expect(screen.getByText('No enrollments yet')).toBeInTheDocument();
    });

    it('offers "Waive" for an enrolled employee and "Reactivate" for a waived one', () => {
      vi.mocked(client.useAdminEnrollments).mockReturnValue({
        data: [
          { id: 'ENR-1', employeeName: 'Grace Hopper', status: 'enrolled', coverageLevel: 'Individual', plan: { name: 'Premium Health Cover' } },
          { id: 'ENR-2', employeeName: 'Ada Lovelace', status: 'waived', coverageLevel: 'Family', plan: { name: 'Dental Basic' } },
        ],
        isLoading: false,
      } as any);
      openEnrollmentsTab();

      expect(screen.getByText('Waive')).toBeInTheDocument();
      expect(screen.getByText('Reactivate')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Waive'));
      expect(mockUpdateEnrollmentStatus).toHaveBeenCalledWith({ enrollmentId: 'ENR-1', status: 'waived' });

      fireEvent.click(screen.getByText('Reactivate'));
      expect(mockUpdateEnrollmentStatus).toHaveBeenCalledWith({ enrollmentId: 'ENR-2', status: 'enrolled' });
    });

    it('requires both an employee and a plan before enrolling', async () => {
      openEnrollmentsTab();
      fireEvent.click(screen.getByText('Enroll Employee'));
      fireEvent.click(screen.getByText('Enroll'));

      await vi.waitFor(() => expect(mockAlert).toHaveBeenCalledWith('Select an employee and a plan.', 'Missing Info'));
      expect(mockEnrollEmployee).not.toHaveBeenCalled();
    });

    it('only lists active plans as enrollment options', () => {
      vi.mocked(client.useBenefitPlans).mockReturnValue({
        data: [plan(), plan({ id: 'PLAN-2', name: 'Retired Plan', status: 'inactive' })],
        isLoading: false,
      } as any);
      openEnrollmentsTab();
      fireEvent.click(screen.getByText('Enroll Employee'));

      const planSelect = screen.getByText('Select plan...').closest('select')!;
      expect(within(planSelect).getByText('Premium Health Cover')).toBeInTheDocument();
      expect(within(planSelect).queryByText('Retired Plan')).not.toBeInTheDocument();
    });

    it('enrolls the employee and resets the form on success', async () => {
      vi.mocked(client.useEmployees).mockReturnValue({ data: [{ id: 'EMP-1', name: 'Grace', lastName: 'Hopper' }] } as any);
      vi.mocked(client.useBenefitPlans).mockReturnValue({ data: [plan()], isLoading: false } as any);
      openEnrollmentsTab();
      fireEvent.click(screen.getByText('Enroll Employee'));

      fireEvent.change(screen.getByText('Select employee...').closest('select')!, { target: { value: 'EMP-1' } });
      fireEvent.change(screen.getByText('Select plan...').closest('select')!, { target: { value: 'PLAN-1' } });
      fireEvent.click(screen.getByText('Enroll'));

      await vi.waitFor(() => expect(mockEnrollEmployee).toHaveBeenCalledWith({ employeeId: 'EMP-1', planId: 'PLAN-1', coverageLevel: 'Individual' }));
    });
  });

  describe('Wellness Programs', () => {
    const openWellnessTab = () => {
      render(<BenefitsAdmin />);
      fireEvent.click(screen.getByText('Wellness Programs'));
    };

    it('shows the empty state when there are no programs', () => {
      openWellnessTab();
      expect(screen.getByText(/No wellness programs yet/)).toBeInTheDocument();
    });

    it('requires a program title before saving', async () => {
      openWellnessTab();
      fireEvent.click(screen.getByText('Add Program'));
      fireEvent.click(screen.getByText('Create Program'));

      await vi.waitFor(() => expect(mockAlert).toHaveBeenCalledWith('Program title is required.', 'Missing Info'));
      expect(mockCreateProgram).not.toHaveBeenCalled();
    });

    it('creates a wellness program', async () => {
      openWellnessTab();
      fireEvent.click(screen.getByText('Add Program'));
      fireEvent.change(screen.getByPlaceholderText('e.g. 10k Steps Daily'), { target: { value: '10k Steps Challenge' } });
      fireEvent.click(screen.getByText('Create Program'));

      await vi.waitFor(() => expect(mockCreateProgram).toHaveBeenCalledWith(expect.objectContaining({ title: '10k Steps Challenge' })));
    });

    it('opens the participants modal and shows the participant list', () => {
      vi.mocked(client.useAdminWellnessPrograms).mockReturnValue({
        data: [{ id: 'PROG-1', title: '10k Steps Challenge', category: 'fitness', goalTarget: 10000, goalLabel: 'Steps', status: 'active', participantCount: 2 }],
        isLoading: false,
      } as any);
      vi.mocked(client.useWellnessProgramParticipants).mockReturnValue({
        data: [{ id: 'P-1', employeeName: 'Grace Hopper', progress: '60%', status: 'active' }],
      } as any);
      openWellnessTab();

      fireEvent.click(screen.getByText('2 Participants'));
      expect(screen.getByText('Grace Hopper')).toBeInTheDocument();
    });

    it('deletes a program once confirmed', async () => {
      vi.mocked(client.useAdminWellnessPrograms).mockReturnValue({
        data: [{ id: 'PROG-1', title: '10k Steps Challenge', category: 'fitness', goalTarget: 10000, goalLabel: 'Steps', status: 'active', participantCount: 0 }],
        isLoading: false,
      } as any);
      openWellnessTab();
      fireEvent.click(screen.getByText('Delete'));

      await vi.waitFor(() => expect(mockDeleteProgram).toHaveBeenCalledWith('PROG-1'));
    });
  });

  describe('Claims', () => {
    const openClaimsTab = () => {
      render(<BenefitsAdmin />);
      fireEvent.click(screen.getByText('Claims'));
    };

    it('defaults the status filter to "pending" and refetches on filter change', () => {
      openClaimsTab();
      expect(screen.getByText('pending')).toHaveClass('bg-slate-800');

      fireEvent.click(screen.getByText('approved'));
      expect(vi.mocked(client.useAdminBenefitClaims)).toHaveBeenLastCalledWith({ status: 'approved' });
    });

    it('requests all statuses (undefined) when "All" is selected', () => {
      openClaimsTab();
      fireEvent.click(screen.getByText('All'));
      expect(vi.mocked(client.useAdminBenefitClaims)).toHaveBeenLastCalledWith({ status: undefined });
    });

    it('shows the empty state when there are no claims for the filter', () => {
      openClaimsTab();
      expect(screen.getByText('No claims here')).toBeInTheDocument();
    });

    it('shows approve/reject actions only for pending claims, and reviewer name otherwise', () => {
      vi.mocked(client.useAdminBenefitClaims).mockReturnValue({
        data: [
          { id: 'CLM-1', employeeName: 'Grace Hopper', kind: 'reimbursement', category: 'Dental', amount: 20000, status: 'pending' },
          { id: 'CLM-2', employeeName: 'Ada Lovelace', kind: 'reimbursement', category: 'Vision', amount: 15000, status: 'approved', reviewedByName: 'HR Admin' },
        ],
        isLoading: false,
      } as any);
      openClaimsTab();

      expect(screen.getByText('by HR Admin')).toBeInTheDocument();
    });

    it('prompts for a note, then approves the claim', async () => {
      vi.mocked(client.useAdminBenefitClaims).mockReturnValue({
        data: [{ id: 'CLM-1', employeeName: 'Grace Hopper', kind: 'reimbursement', category: 'Dental', amount: 20000, status: 'pending' }],
        isLoading: false,
      } as any);
      mockPrompt.mockResolvedValueOnce('Looks good');
      openClaimsTab();

      const approveBtn = document.querySelector('.lucide-circle-check')?.closest('button');
      fireEvent.click(approveBtn!);

      await vi.waitFor(() => expect(mockReviewClaim).toHaveBeenCalledWith({ claimId: 'CLM-1', status: 'approved', notes: 'Looks good' }));
    });

    it('does not review the claim when the reviewer cancels the prompt', async () => {
      vi.mocked(client.useAdminBenefitClaims).mockReturnValue({
        data: [{ id: 'CLM-1', employeeName: 'Grace Hopper', kind: 'reimbursement', category: 'Dental', amount: 20000, status: 'pending' }],
        isLoading: false,
      } as any);
      mockPrompt.mockResolvedValueOnce(null);
      openClaimsTab();

      const rejectBtn = document.querySelector('.lucide-circle-x')?.closest('button');
      fireEvent.click(rejectBtn!);

      await vi.waitFor(() => expect(mockPrompt).toHaveBeenCalled());
      expect(mockReviewClaim).not.toHaveBeenCalled();
    });
  });
});
