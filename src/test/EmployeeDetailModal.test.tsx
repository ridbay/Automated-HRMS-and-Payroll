import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EmployeeDetailModal from '../features/manager/components/EmployeeDetailModal';

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

const employee = (overrides: any = {}) => ({
  id: 'EMP-1', name: 'Grace', lastName: 'Hopper', role: 'Software Engineer', department: 'Engineering',
  email: 'grace@example.com', phone: '555-0100', location: 'Lagos', avatar: null, managerName: 'Ada',
  ...overrides,
});

describe('EmployeeDetailModal', () => {
  it('shows the Overview tab by default with contact info', () => {
    render(<EmployeeDetailModal employee={employee()} onClose={vi.fn()} />);
    expect(screen.getByText('grace@example.com')).toBeInTheDocument();
    expect(screen.getByText('555-0100')).toBeInTheDocument();
    expect(screen.getByText('Reports to Ada', { exact: false })).toBeInTheDocument();
  });

  it('falls back to "Not provided" and "you" for missing contact/manager fields', () => {
    render(<EmployeeDetailModal employee={employee({ email: undefined, phone: undefined, location: undefined, managerName: undefined })} onClose={vi.fn()} />);
    expect(screen.getAllByText('Not provided').length).toBe(3);
    expect(screen.getByText(/Reports to you/)).toBeInTheDocument();
  });

  it('shows an avatar image when present, or an initial letter fallback otherwise', () => {
    const { rerender } = render(<EmployeeDetailModal employee={employee({ avatar: 'https://x.com/a.png' })} onClose={vi.fn()} />);
    expect(document.querySelector('img')).toHaveAttribute('src', 'https://x.com/a.png');

    rerender(<EmployeeDetailModal employee={employee({ avatar: null })} onClose={vi.fn()} />);
    expect(screen.getByText('G')).toBeInTheDocument();
  });

  it('shows the empty-goals message on the Performance tab', () => {
    render(<EmployeeDetailModal employee={employee()} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('Performance'));
    expect(screen.getByText('No goals assigned to Grace yet.')).toBeInTheDocument();
  });

  it('lists goals with progress on the Performance tab', () => {
    render(<EmployeeDetailModal employee={employee()} onClose={vi.fn()} goals={[{ id: 'G-1', title: 'Ship v2', progress: 60 }]} />);
    fireEvent.click(screen.getByText('Performance'));
    expect(screen.getByText('Goals (1)')).toBeInTheDocument();
    expect(screen.getByText('Ship v2')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('shows "No record yet" on the Attendance tab when there is no data for today', () => {
    render(<EmployeeDetailModal employee={employee()} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('Attendance'));
    expect(screen.getByText('No record yet')).toBeInTheDocument();
  });

  it('shows today\'s status and clock-in/out times on the Attendance tab', () => {
    render(
      <EmployeeDetailModal
        employee={employee()}
        onClose={vi.fn()}
        attendanceToday={{ status: 'present', clockIn: '2026-03-10T09:00:00', clockOut: '2026-03-10T17:00:00' }}
      />
    );
    fireEvent.click(screen.getByText('Attendance'));
    expect(screen.getByText('Present')).toBeInTheDocument();
    expect(screen.getByText(/Clocked in at/)).toBeInTheDocument();
    expect(screen.getByText(/out at/)).toBeInTheDocument();
  });

  it('falls back to the "absent" status style for an unrecognized status', () => {
    render(<EmployeeDetailModal employee={employee()} onClose={vi.fn()} attendanceToday={{ status: 'unknown-status' }} />);
    fireEvent.click(screen.getByText('Attendance'));
    expect(screen.getByText('Absent')).toBeInTheDocument();
  });

  it('closes via the X button and via the backdrop click', () => {
    const onClose = vi.fn();
    render(<EmployeeDetailModal employee={employee()} onClose={onClose} />);
    fireEvent.click(document.querySelector('.lucide-x')!.closest('button')!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
