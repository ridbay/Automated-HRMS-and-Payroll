import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import Directory from '../features/core/Directory';
import * as client from '../api/client';

// Directory's org-chart nodes use framer-motion's `drag` — stripped down to a
// plain pass-through so jsdom doesn't have to simulate pointer-drag physics.
vi.mock('framer-motion', () => {
  const stripMotionProps = ({
    initial, animate, exit, transition, whileHover, whileTap, layout, layoutId, variants, drag, dragConstraints, ...rest
  }: any) => rest;
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

vi.mock('../api/client', () => ({
  useDirectory: vi.fn(() => ({ data: [], isLoading: false })),
}));

const employee = (overrides: any = {}) => ({
  id: 'EMP-1',
  name: 'Ada',
  lastName: 'Lovelace',
  role: 'Engineer',
  department: 'Engineering',
  email: 'ada@zenhr.test',
  phone: '555-0100',
  location: 'Lagos, NG',
  managerId: null,
  managerName: null,
  avatar: '',
  ...overrides,
});

describe('Directory', () => {
  beforeEach(() => {
    vi.mocked(client.useDirectory).mockReturnValue({ data: [], isLoading: false } as any);
  });

  it('shows a loading spinner while the directory loads', () => {
    vi.mocked(client.useDirectory).mockReturnValue({ data: [], isLoading: true } as any);
    const { container } = render(<Directory />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows the total headcount regardless of any active search filter', () => {
    vi.mocked(client.useDirectory).mockReturnValue({
      data: [employee(), employee({ id: 'EMP-2', name: 'Grace', lastName: 'Hopper' })],
      isLoading: false,
    } as any);
    render(<Directory />);

    expect(screen.getByText('Browse 2 team members')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Search people...'), { target: { value: 'Ada' } });
    // Still the full company count, not the filtered result count.
    expect(screen.getByText('Browse 2 team members')).toBeInTheDocument();
  });

  it('nests a report under their manager in the org tree (the default view)', () => {
    vi.mocked(client.useDirectory).mockReturnValue({
      data: [
        employee({ id: 'MGR-1', name: 'Jane', lastName: 'Boss', managerName: 'CEO' }),
        employee({ id: 'EMP-1', name: 'Ada', lastName: 'Lovelace', managerId: 'MGR-1', managerName: 'Jane Boss' }),
      ],
      isLoading: false,
    } as any);
    render(<Directory />);

    expect(screen.getByText('Jane Boss')).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
  });

  describe('List view', () => {
    const toListView = () => {
      // The tree/list toggle buttons are icon-only; the list toggle is the
      // second of the two buttons in that control group.
      const toggleButtons = document.querySelectorAll('.bg-slate-100.p-1.rounded-2xl button');
      fireEvent.click(toggleButtons[1]);
    };

    it('filters by name, role, or department, case-insensitively', () => {
      vi.mocked(client.useDirectory).mockReturnValue({
        data: [
          employee({ id: 'EMP-1', name: 'Ada', lastName: 'Lovelace', role: 'Engineer', department: 'Engineering' }),
          employee({ id: 'EMP-2', name: 'Grace', lastName: 'Hopper', role: 'Recruiter', department: 'People' }),
        ],
        isLoading: false,
      } as any);
      render(<Directory />);
      toListView();

      fireEvent.change(screen.getByPlaceholderText('Search people...'), { target: { value: 'people' } });

      expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument();
      expect(screen.getByText('Grace Hopper')).toBeInTheDocument();
    });

    it('shows "None" for an employee with no manager', () => {
      vi.mocked(client.useDirectory).mockReturnValue({ data: [employee({ managerName: null })], isLoading: false } as any);
      render(<Directory />);
      toListView();

      expect(screen.getByText('None')).toBeInTheDocument();
    });

    it('opens the employee detail slide-over on row click, showing contact and manager info', () => {
      vi.mocked(client.useDirectory).mockReturnValue({
        data: [employee({ managerName: 'Jane Boss', phone: '555-0100' })],
        isLoading: false,
      } as any);
      render(<Directory />);
      toListView();

      // The list row for this employee stays mounted behind the panel and
      // also shows their email/manager, so scope assertions to the panel.
      fireEvent.click(screen.getByText('Ada Lovelace'));
      const panel = within(screen.getByText('Close Details').closest('div')!);

      expect(panel.getByText('ada@zenhr.test')).toBeInTheDocument();
      expect(panel.getByText('555-0100')).toBeInTheDocument();
      expect(panel.getByText('Jane Boss')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Close Details'));
      expect(screen.queryByText('Close Details')).not.toBeInTheDocument();
    });

    it('falls back to "N/A" for a missing phone number in the detail panel', () => {
      vi.mocked(client.useDirectory).mockReturnValue({ data: [employee({ phone: null })], isLoading: false } as any);
      render(<Directory />);
      toListView();

      fireEvent.click(screen.getByText('Ada Lovelace'));
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });
  });
});
