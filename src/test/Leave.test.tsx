import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Leave from '../features/employee/Leave';
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

vi.mock('../context/NavigationContext', () => ({
  useNavigation: () => ({ setActiveTab: vi.fn() }),
}));

const mockAlert = vi.fn();
vi.mock('../components/PopupProvider', () => ({
  usePopup: () => ({ alert: mockAlert, confirm: vi.fn(), prompt: vi.fn() }),
}));

const mockApplyLeave = vi.fn();

vi.mock('../api/client', () => ({
  useMyLeave: vi.fn(() => ({ data: { balances: [] }, isLoading: false })),
  useApplyLeave: vi.fn(() => ({ mutate: mockApplyLeave, isPending: false })),
  useDirectory: vi.fn(() => ({ data: [] })),
  useMyProfile: vi.fn(() => ({ data: undefined })),
  useTeamLeaves: vi.fn(() => ({ data: [], isLoading: false })),
}));

const balances = [
  { type: 'Annual Leave', total: 20, used: 8, color: 'indigo' },
  { type: 'Sick Leave', total: 10, used: 2, color: 'emerald' },
];

describe('Leave (employee)', () => {
  beforeEach(() => {
    mockApplyLeave.mockClear();
    mockAlert.mockClear();
    vi.mocked(client.useMyLeave).mockReturnValue({ data: { balances }, isLoading: false } as any);
  });

  const openApplyFlow = () => {
    render(<Leave />);
    fireEvent.click(screen.getByText('+ Custom Request'));
  };

  it('shows a loading spinner while leave data loads', () => {
    vi.mocked(client.useMyLeave).mockReturnValue({ data: undefined, isLoading: true } as any);
    const { container } = render(<Leave />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  describe('calculateDays (business-day counting)', () => {
    it('counts only weekdays across a range spanning a weekend', () => {
      openApplyFlow();
      fireEvent.click(screen.getByText('Annual Leave'));

      // Mon 2026-03-02 to Mon 2026-03-09: 6 weekdays (excludes the Sat/Sun in between)
      fireEvent.change(document.querySelector('input[type="date"]')!, { target: { value: '2026-03-02' } });
      const dateInputs = document.querySelectorAll('input[type="date"]');
      fireEvent.change(dateInputs[1], { target: { value: '2026-03-09' } });

      expect(screen.getByText(/You are requesting 6 days\./)).toBeInTheDocument();
    });

    it('counts a half-day as 0.5 and hides the end-date field', () => {
      openApplyFlow();
      fireEvent.click(screen.getByText('Annual Leave'));
      fireEvent.click(screen.getByText('Half Day'));

      fireEvent.change(document.querySelector('input[type="date"]')!, { target: { value: '2026-03-02' } });

      expect(screen.getByText(/You are requesting 0\.5 days\./)).toBeInTheDocument();
      expect(document.querySelectorAll('input[type="date"]')).toHaveLength(1);
    });

    it('disables Next Step when the end date is before the start date', () => {
      openApplyFlow();
      fireEvent.click(screen.getByText('Annual Leave'));

      const dateInputs = () => document.querySelectorAll('input[type="date"]');
      fireEvent.change(dateInputs()[0], { target: { value: '2026-03-10' } });
      fireEvent.change(dateInputs()[1], { target: { value: '2026-03-05' } });

      expect(screen.getByText('Next Step')).toBeDisabled();
    });
  });

  it('submits the full request with the computed day count and closes back to the dashboard', () => {
    mockApplyLeave.mockImplementation((_payload, { onSuccess }) => onSuccess());
    openApplyFlow();

    // Step 1: type
    fireEvent.click(screen.getByText('Annual Leave'));
    // Step 2: dates (Mon-Fri, 5 weekdays)
    const dateInputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(dateInputs[0], { target: { value: '2026-03-02' } });
    fireEvent.change(dateInputs[1], { target: { value: '2026-03-06' } });
    fireEvent.click(screen.getByText('Next Step'));
    // Step 3: reason
    fireEvent.click(screen.getByText('Vacation'));
    fireEvent.click(screen.getByText('Next Step'));
    // Step 4: handover (optional) -> "Skip / Next"
    fireEvent.click(screen.getByText('Skip / Next'));
    // Step 5: review & submit
    fireEvent.click(screen.getByText('Submit Request'));

    expect(mockApplyLeave).toHaveBeenCalledWith(
      { type: 'Annual Leave', startDate: '2026-03-02', endDate: '2026-03-06', days: 5, reason: 'Vacation' },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
  });

  it('surfaces an error via popup instead of throwing when the application fails', () => {
    mockApplyLeave.mockImplementation((_payload, { onError }) => onError({ message: 'Insufficient balance' }));
    openApplyFlow();

    fireEvent.click(screen.getByText('Annual Leave'));
    const dateInputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(dateInputs[0], { target: { value: '2026-03-02' } });
    fireEvent.change(dateInputs[1], { target: { value: '2026-03-06' } });
    fireEvent.click(screen.getByText('Next Step'));
    fireEvent.click(screen.getByText('Vacation'));
    fireEvent.click(screen.getByText('Next Step'));
    fireEvent.click(screen.getByText('Skip / Next'));
    fireEvent.click(screen.getByText('Submit Request'));

    expect(mockAlert).toHaveBeenCalledWith('Insufficient balance', 'Error');
  });
});
