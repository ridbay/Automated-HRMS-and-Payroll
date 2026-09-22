import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render as rtlRender, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Performance from '../features/employee/Performance';
import * as client from '../api/client';

// The component calls useQueryClient() directly (to invalidate queries after
// saving/submitting an assessment), so it needs a real provider in the tree
// even though every query/mutation hook itself is mocked.
const render = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return rtlRender(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

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

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'emp-1', name: 'Ada Lovelace', role: 'EMPLOYEE' } }),
}));

const {
  mockCreateGoal, mockUpdateGoal, mockSendShoutout,
} = vi.hoisted(() => ({
  mockCreateGoal: vi.fn(),
  mockUpdateGoal: vi.fn(),
  mockSendShoutout: vi.fn(),
}));

vi.mock('../api/client', () => ({
  useShoutouts: vi.fn(() => ({ data: [] })),
  useSendShoutout: vi.fn(() => ({ mutate: mockSendShoutout, isPending: false })),
  useActiveCycleAssessment: vi.fn(() => ({ data: undefined })),
  createAssessment: vi.fn(),
  updateAssessment: vi.fn(),
  submitAssessment: vi.fn(),
  useMyGoals: vi.fn(() => ({ data: [] })),
  useCreateGoal: vi.fn(() => ({ mutate: mockCreateGoal, isPending: false })),
  useUpdateGoal: vi.fn(() => ({ mutate: mockUpdateGoal, isPending: false })),
  useMyPerformanceSummary: vi.fn(() => ({ data: undefined })),
  useMyObjectives: vi.fn(() => ({ data: [] })),
  useDirectory: vi.fn(() => ({ data: [] })),
  useMyProfile: vi.fn(() => ({ data: undefined })),
  useMyAssessments: vi.fn(() => ({ data: [] })),
  useMyNominations: vi.fn(() => ({ data: [] })),
  useNominatePeers: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useReviewsAssignedToMe: vi.fn(() => ({ data: [] })),
  useSubmitPeerReview: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useSubmitUpwardReview: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useMyReceivedReviews: vi.fn(() => ({ data: undefined })),
  useAssessmentEvidence: vi.fn(() => ({ data: [] })),
  useUploadEvidence: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

const goal = (overrides: any = {}) => ({
  id: 'GOAL-1',
  title: 'Ship v2',
  description: '',
  priority: 'medium',
  status: 'on_track',
  progress: 40,
  dueDate: null,
  keyResults: [
    { text: 'Design finalized', completed: true },
    { text: 'Backend shipped', completed: false },
  ],
  ...overrides,
});

describe('Performance (employee)', () => {
  beforeEach(() => {
    mockCreateGoal.mockClear();
    mockUpdateGoal.mockClear();
    mockSendShoutout.mockClear();
    vi.mocked(client.useMyGoals).mockReturnValue({ data: [] } as any);
    vi.mocked(client.useDirectory).mockReturnValue({ data: [] } as any);
  });

  describe('Objectives (goals)', () => {
    const openObjectivesTab = () => {
      render(<Performance />);
      fireEvent.click(screen.getByText('Objectives'));
    };

    it('shows the empty state when there are no goals yet', () => {
      openObjectivesTab();
      expect(screen.getByText('No objectives yet — set your first one above.')).toBeInTheDocument();
    });

    it('keeps "Establish Goal" disabled until a title is entered', () => {
      openObjectivesTab();
      fireEvent.click(screen.getByText('New Objective'));

      expect(screen.getByText('Establish Goal')).toBeDisabled();
      fireEvent.change(screen.getByPlaceholderText(/Master the new Wallet Engine/), { target: { value: 'Ship v2' } });
      expect(screen.getByText('Establish Goal')).not.toBeDisabled();
    });

    it('creates the goal with the selected scope, and closes the modal on success', () => {
      mockCreateGoal.mockImplementation((_payload, { onSuccess }) => onSuccess());
      openObjectivesTab();
      fireEvent.click(screen.getByText('New Objective'));

      fireEvent.change(screen.getByPlaceholderText(/Master the new Wallet Engine/), { target: { value: 'Ship v2' } });
      fireEvent.click(screen.getByText('Establish Goal'));

      expect(mockCreateGoal).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Ship v2', scope: 'individual' }),
        expect.objectContaining({ onSuccess: expect.any(Function) })
      );
      expect(screen.queryByPlaceholderText(/Master the new Wallet Engine/)).not.toBeInTheDocument();
    });

    it('toggles only the clicked key result, leaving the others untouched', () => {
      vi.mocked(client.useMyGoals).mockReturnValue({ data: [goal()] } as any);
      openObjectivesTab();

      fireEvent.click(screen.getByText('Backend shipped'));

      expect(mockUpdateGoal).toHaveBeenCalledWith({
        id: 'GOAL-1',
        data: {
          keyResults: [
            { text: 'Design finalized', completed: true }, // untouched
            { text: 'Backend shipped', completed: true }, // toggled
          ],
        },
      });
    });

    it('marks a goal complete at 100% progress via the checkmark action', () => {
      vi.mocked(client.useMyGoals).mockReturnValue({ data: [goal({ status: 'on_track' })] } as any);
      openObjectivesTab();

      fireEvent.click(screen.getByTitle('Mark as complete'));

      expect(mockUpdateGoal).toHaveBeenCalledWith(
        { id: 'GOAL-1', data: { progress: 100, status: 'completed' } },
        expect.objectContaining({ onSuccess: expect.any(Function) })
      );
    });

    it('does not offer "Mark as complete" for a goal that is already completed', () => {
      vi.mocked(client.useMyGoals).mockReturnValue({ data: [goal({ status: 'completed' })] } as any);
      openObjectivesTab();
      expect(screen.queryByTitle('Mark as complete')).not.toBeInTheDocument();
    });
  });

  describe('Shoutouts (recognition)', () => {
    const openShoutoutModal = () => {
      render(<Performance />);
      fireEvent.click(screen.getByRole('button', { name: /Shoutouts/ }));
      fireEvent.click(screen.getByText('Give Recognition'));
    };

    it('keeps "Send Now" disabled until recipient, type, and message are all filled in', () => {
      openShoutoutModal();
      const sendButton = screen.getByText('Send Now');
      expect(sendButton).toBeDisabled();

      fireEvent.change(screen.getByPlaceholderText('Who deserves recognition today?'), { target: { value: 'Grace Hopper' } });
      expect(sendButton).toBeDisabled(); // still missing type + message

      fireEvent.click(screen.getByText('Bravo 💡'));
      expect(sendButton).toBeDisabled(); // still missing message

      fireEvent.change(screen.getByPlaceholderText("Tell them why they're awesome..."), { target: { value: 'Great work on the release!' } });
      expect(sendButton).not.toBeDisabled();
    });

    it('filters the recipient dropdown by name as the admin types', () => {
      vi.mocked(client.useDirectory).mockReturnValue({
        data: [
          { id: 'EMP-1', name: 'Grace', lastName: 'Hopper' },
          { id: 'EMP-2', name: 'Ada', lastName: 'Lovelace' },
        ],
      } as any);
      openShoutoutModal();

      fireEvent.change(screen.getByPlaceholderText('Who deserves recognition today?'), { target: { value: 'gra' } });

      expect(screen.getByText('Grace Hopper')).toBeInTheDocument();
      expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument();
    });

    it('sends the shoutout with the chosen recipient id, type, and trimmed message, then resets the form', () => {
      mockSendShoutout.mockImplementation((_payload, { onSuccess }) => onSuccess());
      vi.mocked(client.useDirectory).mockReturnValue({ data: [{ id: 'EMP-1', name: 'Grace', lastName: 'Hopper' }] } as any);
      openShoutoutModal();

      const recipientInput = screen.getByPlaceholderText('Who deserves recognition today?');
      fireEvent.change(recipientInput, { target: { value: 'Grace' } });
      fireEvent.mouseDown(screen.getByText('Grace Hopper'));
      fireEvent.click(screen.getByText('Praise 👏'));
      fireEvent.change(screen.getByPlaceholderText("Tell them why they're awesome..."), { target: { value: '  Amazing work!  ' } });
      fireEvent.click(screen.getByText('Send Now'));

      expect(mockSendShoutout).toHaveBeenCalledWith(
        { toEmployeeName: 'Grace Hopper', toEmployeeId: 'EMP-1', type: 'praise', message: 'Amazing work!' },
        expect.objectContaining({ onSuccess: expect.any(Function) })
      );
    });
  });
});
