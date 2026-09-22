import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import PerformanceManagement from '../features/admin/PerformanceManagement';
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

vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();
  return { ...actual, ResponsiveContainer: ({ children }: any) => React.createElement('div', null, children) };
});

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'admin-1', role: 'HR_ADMIN' } }),
}));

const mockConfirm = vi.fn().mockResolvedValue(true);
vi.mock('../components/PopupProvider', () => ({
  usePopup: () => ({ alert: vi.fn(), confirm: mockConfirm, prompt: vi.fn() }),
}));

const {
  mockCreateCycle, mockActivateCycle, mockCloseCycle, mockDeleteCycle, mockUpdateStage,
  mockSubmitReview, mockCreateCompanyGoal,
} = vi.hoisted(() => ({
  mockCreateCycle: vi.fn(),
  mockActivateCycle: vi.fn(),
  mockCloseCycle: vi.fn(),
  mockDeleteCycle: vi.fn(),
  mockUpdateStage: vi.fn(),
  mockSubmitReview: vi.fn(),
  mockCreateCompanyGoal: vi.fn(),
}));

vi.mock('../api/client', () => ({
  useReviewCycles: vi.fn(() => ({ data: { cycles: [], ratingScale: [] } })),
  useCreateReviewCycle: vi.fn(() => ({ mutate: mockCreateCycle, isPending: false })),
  useActivateReviewCycle: vi.fn(() => ({ mutate: mockActivateCycle })),
  useCloseReviewCycle: vi.fn(() => ({ mutate: mockCloseCycle })),
  useDeleteReviewCycle: vi.fn(() => ({ mutate: mockDeleteCycle })),
  useAdminPerformanceAnalytics: vi.fn(() => ({ data: undefined })),
  useAdminAssessments: vi.fn(() => ({ data: { assessments: [] } })),
  useSubmitManagerReview: vi.fn(() => ({ mutate: mockSubmitReview, isPending: false })),
  useAdminGoals: vi.fn(() => ({ data: [] })),
  useCreateCompanyGoal: vi.fn(() => ({ mutate: mockCreateCompanyGoal, isPending: false })),
  useShoutouts: vi.fn(() => ({ data: [] })),
  useCycleStages: vi.fn(() => ({ data: [] })),
  useUpdateCycleStage: vi.fn(() => ({ mutate: mockUpdateStage })),
  useAdminPeerReviews: vi.fn(() => ({ data: { reviews: [] } })),
  useDepartments: vi.fn(() => ({ data: [] })),
}));

const cycle = (overrides: any = {}) => ({
  id: 'CYC-1', name: 'H1 2026', status: 'upcoming', startDate: '2026-01-01', endDate: '2026-06-30',
  selfReviewDueDate: null, managerReviewDueDate: null,
  ...overrides,
});

describe('PerformanceManagement (admin)', () => {
  beforeEach(() => {
    [mockCreateCycle, mockActivateCycle, mockCloseCycle, mockDeleteCycle, mockUpdateStage, mockSubmitReview, mockCreateCompanyGoal, mockConfirm]
      .forEach((m) => m.mockClear());
    mockConfirm.mockResolvedValue(true);
    vi.mocked(client.useReviewCycles).mockReturnValue({ data: { cycles: [], ratingScale: [] } } as any);
    vi.mocked(client.useAdminPerformanceAnalytics).mockReturnValue({ data: undefined } as any);
    vi.mocked(client.useAdminAssessments).mockReturnValue({ data: { assessments: [] } } as any);
    vi.mocked(client.useAdminGoals).mockReturnValue({ data: [] } as any);
    vi.mocked(client.useShoutouts).mockReturnValue({ data: [] } as any);
    vi.mocked(client.useCycleStages).mockReturnValue({ data: [] } as any);
    vi.mocked(client.useAdminPeerReviews).mockReturnValue({ data: { reviews: [] } } as any);
    vi.mocked(client.useDepartments).mockReturnValue({ data: [] } as any);
  });

  describe('Overview tab', () => {
    it('shows the default stat placeholders when there is no analytics data', () => {
      render(<PerformanceManagement />);
      expect(screen.getByText('Avg. Rating').closest('div')!.textContent).toContain('—');
      expect(screen.getByText('Goal Completion Rate').closest('div')!.textContent).toContain('0%');
    });

    it('renders the loaded analytics stats', () => {
      vi.mocked(client.useAdminPerformanceAnalytics).mockReturnValue({
        data: { avgRating: 4.2, pendingManagerReview: 3, completedReviews: 12, goalStats: { completionRate: 75 }, cycle: { name: 'H1 2026' } },
      } as any);
      render(<PerformanceManagement />);
      expect(screen.getByText('Avg. Rating').closest('div')!.textContent).toContain('4.2 / 5');
      expect(screen.getByText('Goal Completion Rate').closest('div')!.textContent).toContain('75%');
    });

    it('shows "No ratings recorded yet" when there is no distribution', () => {
      render(<PerformanceManagement />);
      expect(screen.getByText('No ratings recorded yet.')).toBeInTheDocument();
    });
  });

  describe('Review Cycles tab', () => {
    const openCyclesTab = () => {
      render(<PerformanceManagement />);
      fireEvent.click(screen.getByText('Review Cycles'));
    };

    it('shows the empty state when there are no cycles', () => {
      openCyclesTab();
      expect(screen.getByText(/No review cycles yet/)).toBeInTheDocument();
    });

    it('requires a cycle name before creating', () => {
      openCyclesTab();
      fireEvent.click(screen.getByText('New Cycle'));
      fireEvent.click(screen.getByText('Create Cycle'));

      expect(screen.getByText('Cycle name is required.')).toBeInTheDocument();
      expect(mockCreateCycle).not.toHaveBeenCalled();
    });

    it('creates a cycle and closes the modal on success', () => {
      mockCreateCycle.mockImplementation((_payload, { onSuccess }) => onSuccess());
      openCyclesTab();
      fireEvent.click(screen.getByText('New Cycle'));
      fireEvent.change(screen.getByPlaceholderText('H2 2026'), { target: { value: 'H1 2026' } });
      fireEvent.click(screen.getByText('Create Cycle'));

      expect(mockCreateCycle).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'H1 2026' }),
        expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
      );
      expect(screen.queryByText('New Review Cycle')).not.toBeInTheDocument();
    });

    it('offers Activate for a non-active cycle and Close for the active one', () => {
      vi.mocked(client.useReviewCycles).mockReturnValue({
        data: { cycles: [cycle({ status: 'upcoming' }), cycle({ id: 'CYC-2', name: 'H2 2025', status: 'active' })], ratingScale: [] },
      } as any);
      openCyclesTab();

      fireEvent.click(screen.getByText('Activate'));
      expect(mockActivateCycle).toHaveBeenCalledWith('CYC-1');

      fireEvent.click(screen.getByText('Close'));
      expect(mockCloseCycle).toHaveBeenCalledWith('CYC-2');
    });

    it('deletes a cycle after confirmation', async () => {
      vi.mocked(client.useReviewCycles).mockReturnValue({ data: { cycles: [cycle()], ratingScale: [] } } as any);
      openCyclesTab();

      fireEvent.click(document.querySelector('.lucide-trash-2')!.closest('button')!);
      await vi.waitFor(() => expect(mockDeleteCycle).toHaveBeenCalledWith('CYC-1'));
    });

    it('skips deletion when the confirmation is declined', async () => {
      mockConfirm.mockResolvedValueOnce(false);
      vi.mocked(client.useReviewCycles).mockReturnValue({ data: { cycles: [cycle()], ratingScale: [] } } as any);
      openCyclesTab();

      fireEvent.click(document.querySelector('.lucide-trash-2')!.closest('button')!);
      await vi.waitFor(() => expect(mockConfirm).toHaveBeenCalled());
      expect(mockDeleteCycle).not.toHaveBeenCalled();
    });

    it('opens the stage timeline editor and saves only the stages that were edited', () => {
      vi.mocked(client.useReviewCycles).mockReturnValue({ data: { cycles: [cycle()], ratingScale: [] } } as any);
      vi.mocked(client.useCycleStages).mockReturnValue({
        data: [{ id: 'STG-1', name: 'Self Review', startDate: '', dueDate: '' }, { id: 'STG-2', name: 'Manager Review', startDate: '', dueDate: '' }],
      } as any);
      openCyclesTab();

      fireEvent.click(document.querySelector('.lucide-settings-2')!.closest('button')!);
      expect(screen.getByText('Stage Timeline')).toBeInTheDocument();

      const dateInputs = document.querySelectorAll('input[type="date"]');
      fireEvent.change(dateInputs[0], { target: { value: '2026-01-01' } }); // only STG-1's start date
      fireEvent.click(screen.getByText('Save Timeline'));

      expect(mockUpdateStage).toHaveBeenCalledTimes(1);
      expect(mockUpdateStage).toHaveBeenCalledWith({
        cycleId: 'CYC-1', stageId: 'STG-1', data: { startDate: '2026-01-01', dueDate: null },
      });
    });
  });

  describe('Reviews tab', () => {
    const openReviewsTab = () => {
      render(<PerformanceManagement />);
      fireEvent.click(screen.getByText('Reviews'));
    };

    it('shows the empty state when no assessments match the filters', () => {
      openReviewsTab();
      expect(screen.getByText('No assessments match these filters.')).toBeInTheDocument();
    });

    it('labels a completed assessment\'s action as "Edit Review" and others as "Review"', () => {
      vi.mocked(client.useAdminAssessments).mockReturnValue({
        data: {
          assessments: [
            { id: 'A-1', employeeName: 'Grace', employeeLastName: 'Hopper', department: 'Eng', cycleName: 'H1 2026', status: 'completed', selfRating: 'exceeds', managerRating: 'meets' },
            { id: 'A-2', employeeName: 'Ada', employeeLastName: 'Lovelace', department: 'Eng', cycleName: 'H1 2026', status: 'submitted', selfRating: null, managerRating: null },
          ],
        },
      } as any);
      openReviewsTab();

      expect(screen.getByText('Edit Review')).toBeInTheDocument();
      expect(screen.getByText('Review')).toBeInTheDocument();
    });

    it('opens the review modal pre-filled and requires a rating before submitting', () => {
      vi.mocked(client.useReviewCycles).mockReturnValue({
        data: { cycles: [], ratingScale: [{ value: 'exceeds', label: 'Exceeds Expectations' }, { value: 'meets', label: 'Meets Expectations' }] },
      } as any);
      vi.mocked(client.useAdminAssessments).mockReturnValue({
        data: { assessments: [{ id: 'A-1', employeeName: 'Grace', employeeLastName: 'Hopper', department: 'Eng', cycleName: 'H1 2026', status: 'submitted', selfRating: 'exceeds', managerRating: null }] },
      } as any);
      openReviewsTab();
      fireEvent.click(screen.getByText('Review'));

      expect(screen.getByText('Review Grace Hopper')).toBeInTheDocument();
      expect(screen.getByText('Submit Review')).toBeDisabled();

      fireEvent.change(screen.getByDisplayValue('Select rating…'), { target: { value: 'meets' } });
      fireEvent.click(screen.getByText('Submit Review'));

      expect(mockSubmitReview).toHaveBeenCalledWith(
        { id: 'A-1', managerRating: 'meets', managerComment: '' },
        expect.objectContaining({ onSuccess: expect.any(Function) })
      );
    });
  });

  describe('360 Reviews tab', () => {
    it('shows the empty state when there are no peer/upward reviews', () => {
      render(<PerformanceManagement />);
      fireEvent.click(screen.getByText('360 Reviews'));
      expect(screen.getByText('No peer or upward reviews yet this cycle.')).toBeInTheDocument();
    });

    it('tags an upward review distinctly from a peer review', () => {
      vi.mocked(client.useAdminPeerReviews).mockReturnValue({
        data: {
          reviews: [
            { id: 'R-1', revieweeName: 'Grace', revieweeLastName: 'Hopper', direction: 'peer', status: 'submitted', rating: 'meets', submittedAt: '2026-03-01T10:00:00Z' },
            { id: 'R-2', revieweeName: 'Ada', revieweeLastName: 'Lovelace', direction: 'upward', status: 'pending', rating: null, submittedAt: null },
          ],
        },
      } as any);
      render(<PerformanceManagement />);
      fireEvent.click(screen.getByText('360 Reviews'));

      expect(screen.getByText('peer')).toBeInTheDocument();
      expect(screen.getByText('upward')).toBeInTheDocument();
    });
  });

  describe('Goals tab', () => {
    const openGoalsTab = () => {
      render(<PerformanceManagement />);
      fireEvent.click(screen.getByText('Goals'));
    };

    it('shows the empty state when there are no goals', () => {
      openGoalsTab();
      expect(screen.getByText('No goals match these filters yet.')).toBeInTheDocument();
    });

    it('disables "Establish Objective" until a title is entered', () => {
      openGoalsTab();
      fireEvent.click(screen.getByText('Set Objective'));
      expect(screen.getByText('Establish Objective')).toBeDisabled();

      fireEvent.change(screen.getByPlaceholderText(/Africa's Leading Payroll Engine/), { target: { value: 'Ship v2' } });
      expect(screen.getByText('Establish Objective')).not.toBeDisabled();
    });

    it('requires a department when the scope is "department"', () => {
      openGoalsTab();
      fireEvent.click(screen.getByText('Set Objective'));
      fireEvent.change(screen.getByPlaceholderText(/Africa's Leading Payroll Engine/), { target: { value: 'Ship v2' } });
      fireEvent.change(screen.getByDisplayValue('Company'), { target: { value: 'department' } });

      expect(screen.getByText('Establish Objective')).toBeDisabled();
    });

    it('creates a company-wide goal tagged with the current user as sponsor', () => {
      openGoalsTab();
      fireEvent.click(screen.getByText('Set Objective'));
      fireEvent.change(screen.getByPlaceholderText(/Africa's Leading Payroll Engine/), { target: { value: 'Ship v2' } });
      fireEvent.click(screen.getByText('Establish Objective'));

      expect(mockCreateCompanyGoal).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Ship v2', scope: 'company', employeeOwnerId: 'admin-1' }),
        expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
      );
    });
  });

  describe('Recognition tab', () => {
    it('shows the empty state when there are no shoutouts', () => {
      render(<PerformanceManagement />);
      fireEvent.click(screen.getByText('Recognition'));
      expect(screen.getByText('No shoutouts yet.')).toBeInTheDocument();
    });

    it('renders shoutouts on the recognition wall', () => {
      vi.mocked(client.useShoutouts).mockReturnValue({
        data: [{ id: 'S-1', toEmployeeName: 'Grace Hopper', type: 'praise', message: 'Great work!', createdAt: '2026-03-01T10:00:00Z' }],
      } as any);
      render(<PerformanceManagement />);
      fireEvent.click(screen.getByText('Recognition'));

      expect(screen.getByText('"Great work!"')).toBeInTheDocument();
    });
  });
});
