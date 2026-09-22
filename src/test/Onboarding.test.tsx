import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Onboarding from '../features/admin/Onboarding';
import * as client from '../api/client';

// Onboarding wraps its detail slide-over and wizard steps in framer-motion's
// AnimatePresence (the wizard explicitly uses mode="wait"), which doesn't
// resolve its exit transition in jsdom — see the note in Payroll.test.tsx /
// EmployeeOnboarding.test.tsx for the full explanation.
vi.mock('framer-motion', () => {
  const stripMotionProps = ({
    initial, animate, exit, transition, whileHover, whileTap, layout, layoutId, variants, ...rest
  }: any) => rest;
  const motion = new Proxy(
    {},
    {
      get: (_target, tag: string) =>
        React.forwardRef((props: any, ref: any) => React.createElement(tag, { ...stripMotionProps(props), ref })),
    }
  );
  return {
    motion,
    AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
  };
});

const { mockUpdateTask, mockCancelTransition, mockConfirm } = vi.hoisted(() => ({
  mockUpdateTask: vi.fn(),
  mockCancelTransition: vi.fn(),
  mockConfirm: vi.fn().mockResolvedValue(true),
}));

vi.mock('../context/NavigationContext', () => ({
  useNavigation: () => ({ setActiveTab: vi.fn() }),
}));

vi.mock('../components/PopupProvider', () => ({
  usePopup: () => ({ alert: vi.fn(), confirm: mockConfirm, prompt: vi.fn() }),
}));

vi.mock('../api/client', () => ({
  useEmployees: vi.fn(() => ({ data: [], isLoading: false })),
  useTransitions: vi.fn(() => ({ data: [], isLoading: false })),
  useCreateTransition: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useUpdateTransitionTask: vi.fn(() => ({ mutate: mockUpdateTask, isPending: false })),
  useCancelTransition: vi.fn(() => ({ mutate: mockCancelTransition, isPending: false })),
}));

const workflow = (overrides: any = {}) => ({
  id: 'TRN-1',
  employeeId: 'EMP-1',
  employeeName: 'Ada Lovelace',
  employee: { avatar: '', role: 'Engineer' },
  type: 'Onboarding',
  stage: 'Orientation',
  status: 'Active',
  progress: 40,
  startDate: '2026-01-01',
  tasks: [
    { id: 'TSK-1', title: 'Sign Offer Letter', category: 'HR', status: 'pending', dueDate: null, assignedTo: null },
    { id: 'TSK-2', title: 'Provision IT Accounts', category: 'IT', status: 'completed', dueDate: null, assignedTo: null },
  ],
  ...overrides,
});

describe('Onboarding (admin transitions board)', () => {
  beforeEach(() => {
    mockUpdateTask.mockClear();
    mockCancelTransition.mockClear();
    mockConfirm.mockClear().mockResolvedValue(true);
    vi.mocked(client.useEmployees).mockReturnValue({ data: [], isLoading: false } as any);
    vi.mocked(client.useTransitions).mockReturnValue({ data: [], isLoading: false } as any);
  });

  it('hides Cancelled journeys from the workflow list', () => {
    vi.mocked(client.useTransitions).mockReturnValue({
      data: [workflow({ id: 'TRN-1', employeeName: 'Ada Lovelace' }), workflow({ id: 'TRN-2', employeeName: 'Bob Marley', status: 'Cancelled' })],
      isLoading: false,
    } as any);

    render(<Onboarding />);

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.queryByText('Bob Marley')).not.toBeInTheDocument();
  });

  it('shows the empty state when there are no journeys of the active type', () => {
    render(<Onboarding />);

    expect(screen.getByText('No onboarding journeys yet')).toBeInTheDocument();
  });

  it('toggles a pending task to completed when clicked', () => {
    vi.mocked(client.useTransitions).mockReturnValue({ data: [workflow()], isLoading: false } as any);

    render(<Onboarding />);
    fireEvent.click(screen.getByText('Ada Lovelace'));
    fireEvent.click(screen.getByText('Sign Offer Letter'));

    expect(mockUpdateTask).toHaveBeenCalledWith({ transitionId: 'TRN-1', taskId: 'TSK-1', status: 'completed' });
  });

  it('toggles a completed task back to pending when clicked', () => {
    vi.mocked(client.useTransitions).mockReturnValue({ data: [workflow()], isLoading: false } as any);

    render(<Onboarding />);
    fireEvent.click(screen.getByText('Ada Lovelace'));
    fireEvent.click(screen.getByText('Provision IT Accounts'));

    expect(mockUpdateTask).toHaveBeenCalledWith({ transitionId: 'TRN-1', taskId: 'TSK-2', status: 'pending' });
  });

  it('only shows "Cancel This Journey" for an Active workflow, not a Completed one', () => {
    vi.mocked(client.useTransitions).mockReturnValue({ data: [workflow({ status: 'Completed' })], isLoading: false } as any);

    render(<Onboarding />);
    fireEvent.click(screen.getByText('Ada Lovelace'));

    expect(screen.queryByText('Cancel This Journey')).not.toBeInTheDocument();
  });

  it('cancels the journey and closes the detail panel once confirmed', async () => {
    vi.mocked(client.useTransitions).mockReturnValue({ data: [workflow()], isLoading: false } as any);
    mockCancelTransition.mockImplementation((_id, { onSuccess }) => onSuccess());

    render(<Onboarding />);
    fireEvent.click(screen.getByText('Ada Lovelace'));
    expect(screen.getByText('Cancel This Journey')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText('Cancel This Journey'));
      await Promise.resolve(); // let the confirm() promise settle
    });

    expect(mockConfirm).toHaveBeenCalled();
    expect(mockCancelTransition).toHaveBeenCalledWith('TRN-1', expect.objectContaining({ onSuccess: expect.any(Function) }));
    expect(screen.queryByText('Cancel This Journey')).not.toBeInTheDocument();
  });

  it('does not cancel when the confirmation is declined', async () => {
    mockConfirm.mockResolvedValue(false);
    vi.mocked(client.useTransitions).mockReturnValue({ data: [workflow()], isLoading: false } as any);

    render(<Onboarding />);
    fireEvent.click(screen.getByText('Ada Lovelace'));
    await act(async () => {
      fireEvent.click(screen.getByText('Cancel This Journey'));
      await Promise.resolve();
    });

    expect(mockCancelTransition).not.toHaveBeenCalled();
  });

  it('excludes employees already mid-onboarding from the "Start New Onboarding" candidate picker', () => {
    vi.mocked(client.useEmployees).mockReturnValue({
      data: [
        { id: 'EMP-1', name: 'Ada', lastName: 'Lovelace', status: 'onboarding', role: 'Engineer', department: 'Eng' },
        { id: 'EMP-2', name: 'Grace', lastName: 'Hopper', status: 'active', role: 'Engineer', department: 'Eng' },
      ],
      isLoading: false,
    } as any);
    // Ada already has an Active onboarding journey.
    vi.mocked(client.useTransitions).mockReturnValue({
      data: [workflow({ employeeId: 'EMP-1', employeeName: 'Ada Lovelace', status: 'Active' })],
      isLoading: false,
    } as any);

    render(<Onboarding />);
    fireEvent.click(screen.getByText('Start New Onboarding'));

    // Scoped to <h4> because the workflow list card behind the wizard modal
    // independently renders "Ada Lovelace" as an <h3> — that's a different
    // element, not the candidate picker, and would give a false pass/fail.
    expect(screen.getByText('Select Employee')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 4, name: 'Ada Lovelace' })).not.toBeInTheDocument(); // excluded: already mid-journey
    expect(screen.getByRole('heading', { level: 4, name: 'Grace Hopper' })).toBeInTheDocument();
  });

  it('restricts the "Start New Offboarding" candidate picker to active employees not already mid-journey', () => {
    vi.mocked(client.useEmployees).mockReturnValue({
      data: [
        { id: 'EMP-1', name: 'Ada', lastName: 'Lovelace', status: 'active', role: 'Engineer', department: 'Eng' },
        { id: 'EMP-2', name: 'Grace', lastName: 'Hopper', status: 'onboarding', role: 'Engineer', department: 'Eng' }, // not active yet
        { id: 'EMP-3', name: 'Bob', lastName: 'Marley', status: 'active', role: 'Sales', department: 'Sales' },
      ],
      isLoading: false,
    } as any);
    // Bob already has an active offboarding journey underway.
    vi.mocked(client.useTransitions).mockReturnValue({
      data: [workflow({ employeeId: 'EMP-3', employeeName: 'Bob Marley', type: 'Offboarding', status: 'Active' })],
      isLoading: false,
    } as any);

    render(<Onboarding />);
    fireEvent.click(screen.getByText('Offboarding'));
    fireEvent.click(screen.getByText('Start New Offboarding'));

    expect(screen.getByRole('heading', { level: 4, name: 'Ada Lovelace' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 4, name: 'Grace Hopper' })).not.toBeInTheDocument(); // not "active" status
    expect(screen.queryByRole('heading', { level: 4, name: 'Bob Marley' })).not.toBeInTheDocument(); // already mid-journey
  });
});
