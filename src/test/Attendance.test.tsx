import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Attendance from '../features/employee/Attendance';
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

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'emp-1', name: 'Ada Lovelace', role: 'EMPLOYEE' } }),
}));

const mockSubmitOvertime = vi.fn();

vi.mock('../api/client', () => ({
  useMyAttendance: vi.fn(() => ({ data: { activeSession: null, todaySessions: [], totalWorkHours: 0, history: [] }, isLoading: false })),
  useClockIn: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useClockOut: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useOvertimeRequests: vi.fn(() => ({ data: [] })),
  useSubmitOvertime: vi.fn(() => ({ mutate: mockSubmitOvertime, isPending: false })),
}));

describe('Attendance (employee)', () => {
  beforeEach(() => {
    mockSubmitOvertime.mockClear();
    vi.mocked(client.useMyAttendance).mockReturnValue({
      data: { activeSession: null, todaySessions: [], totalWorkHours: 0, history: [] },
      isLoading: false,
    } as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Monthly stats derived from history', () => {
    it('counts present days and late entries this month, against weekdays elapsed so far', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 2, 15)); // Sun Mar 15, 2026 -> 10 weekdays elapsed (Mar 2-6, 9-13)

      vi.mocked(client.useMyAttendance).mockReturnValue({
        data: {
          activeSession: null, todaySessions: [], totalWorkHours: 0,
          history: [
            { date: '2026-03-02', clockIn: '2026-03-02T09:15:00', status: 'present', workHours: 8 },
            { date: '2026-03-03', clockIn: '2026-03-03T13:45:00', status: 'late', workHours: 7 },
            { date: '2026-02-15', clockIn: '2026-02-15T09:00:00', status: 'present', workHours: 8 }, // prior month, excluded
          ],
        },
        isLoading: false,
      } as any);
      render(<Attendance />);

      expect(screen.getByText('2 / 10')).toBeInTheDocument(); // 2 present days out of 10 elapsed weekdays
      // Avg arrival: (09:15 + 13:45) / 2 = 11:30 AM
      expect(screen.getByText('11:30 AM')).toBeInTheDocument();
    });

    it('converts midnight and noon clock-ins to 12-hour format correctly (the 0/12 edge cases)', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 2, 15));
      vi.mocked(client.useMyAttendance).mockReturnValue({
        data: { activeSession: null, todaySessions: [], totalWorkHours: 0, history: [{ date: '2026-03-02', clockIn: '2026-03-02T00:05:00', status: 'present', workHours: 8 }] },
        isLoading: false,
      } as any);
      const { rerender } = render(<Attendance />);
      expect(screen.getByText('12:05 AM')).toBeInTheDocument();

      vi.mocked(client.useMyAttendance).mockReturnValue({
        data: { activeSession: null, todaySessions: [], totalWorkHours: 0, history: [{ date: '2026-03-02', clockIn: '2026-03-02T12:00:00', status: 'present', workHours: 8 }] },
        isLoading: false,
      } as any);
      rerender(<Attendance />);
      expect(screen.getByText('12:00 PM')).toBeInTheDocument();
    });

    it('reports "Late Entries" only from records tagged late by the server policy', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 2, 15));
      vi.mocked(client.useMyAttendance).mockReturnValue({
        data: {
          activeSession: null, todaySessions: [], totalWorkHours: 0,
          history: [
            { date: '2026-03-02', clockIn: '2026-03-02T09:00:00', status: 'present', workHours: 8 },
            { date: '2026-03-03', clockIn: '2026-03-03T10:00:00', status: 'late', workHours: 7 },
            { date: '2026-03-04', clockIn: '2026-03-04T10:05:00', status: 'late', workHours: 7 },
          ],
        },
        isLoading: false,
      } as any);
      render(<Attendance />);

      fireEvent.click(screen.getByText('My Attendance'));
      expect(screen.getByText('2 Times')).toBeInTheDocument();
    });
  });

  describe('Overtime request', () => {
    const openOvertimeTab = () => {
      render(<Attendance />);
      fireEvent.click(screen.getByText('Overtime'));
    };

    it('does nothing when date, times, or reason are missing', () => {
      openOvertimeTab();
      fireEvent.click(screen.getByText('Submit for Approval'));
      expect(mockSubmitOvertime).not.toHaveBeenCalled();
    });

    it('computes the worked hours from start/end time and submits the request', () => {
      openOvertimeTab();

      fireEvent.change(document.querySelector('input[type="date"]')!, { target: { value: '2026-03-10' } });
      const timeInputs = document.querySelectorAll('input[type="time"]');
      fireEvent.change(timeInputs[0], { target: { value: '18:00' } });
      fireEvent.change(timeInputs[1], { target: { value: '20:30' } });
      fireEvent.change(screen.getByPlaceholderText(/Critical bug fix/), { target: { value: 'Release hotfix' } });
      fireEvent.click(screen.getByText('Submit for Approval'));

      expect(mockSubmitOvertime).toHaveBeenCalledWith(
        expect.objectContaining({ date: '2026-03-10', startTime: '18:00', endTime: '20:30', hours: 2.5, reason: 'Release hotfix' }),
        expect.objectContaining({ onSuccess: expect.any(Function) })
      );
    });

    it('wraps an overnight shift (end time before start time) into a positive duration', () => {
      openOvertimeTab();

      fireEvent.change(document.querySelector('input[type="date"]')!, { target: { value: '2026-03-10' } });
      const timeInputs = document.querySelectorAll('input[type="time"]');
      fireEvent.change(timeInputs[0], { target: { value: '23:00' } });
      fireEvent.change(timeInputs[1], { target: { value: '01:00' } }); // past midnight
      fireEvent.change(screen.getByPlaceholderText(/Critical bug fix/), { target: { value: 'Incident response' } });
      fireEvent.click(screen.getByText('Submit for Approval'));

      expect(mockSubmitOvertime).toHaveBeenCalledWith(
        expect.objectContaining({ hours: 2 }), // 23:00 -> 01:00 wraps to +2h, not -22h
        expect.anything()
      );
    });

    it('resets the form fields once the request is submitted successfully', () => {
      mockSubmitOvertime.mockImplementation((_payload, { onSuccess }) => onSuccess());
      openOvertimeTab();

      fireEvent.change(document.querySelector('input[type="date"]')!, { target: { value: '2026-03-10' } });
      const timeInputs = document.querySelectorAll('input[type="time"]');
      fireEvent.change(timeInputs[0], { target: { value: '18:00' } });
      fireEvent.change(timeInputs[1], { target: { value: '20:00' } });
      const reasonInput = screen.getByPlaceholderText(/Critical bug fix/) as HTMLTextAreaElement;
      fireEvent.change(reasonInput, { target: { value: 'Release hotfix' } });
      fireEvent.click(screen.getByText('Submit for Approval'));

      expect(reasonInput.value).toBe('');
    });
  });
});
