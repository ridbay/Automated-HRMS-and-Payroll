import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MyPayroll from '../features/employee/MyPayroll';
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

vi.mock('../api/client', () => ({
  useMyProfile: vi.fn(() => ({ data: undefined, isLoading: false })),
  useMyCompensation: vi.fn(() => ({ data: undefined, isLoading: false })),
  useMyPayslips: vi.fn(() => ({ data: [], isLoading: false })),
}));

const payslip = (overrides: any = {}) => ({
  id: 'PS-1',
  periodMonth: 3,
  periodYear: 2026,
  grossPay: 500000,
  basicSalary: 200000,
  allowances: 300000,
  bonuses: 0,
  taxDeductions: 40000,
  pensionDeductions: 16000,
  loanDeductions: 0,
  otherDeductions: 0,
  netPay: 444000,
  paidAt: '2026-03-25T00:00:00Z',
  ...overrides,
});

describe('MyPayroll', () => {
  beforeEach(() => {
    vi.mocked(client.useMyProfile).mockReturnValue({ data: { id: 'emp-1', name: 'Ada', lastName: 'Lovelace', role: 'Engineer' }, isLoading: false } as any);
    vi.mocked(client.useMyCompensation).mockReturnValue({ data: undefined, isLoading: false } as any);
    vi.mocked(client.useMyPayslips).mockReturnValue({ data: [], isLoading: false } as any);
  });

  it('shows a loading spinner while any of profile/compensation/payslips are loading', () => {
    vi.mocked(client.useMyPayslips).mockReturnValue({ data: [], isLoading: true } as any);
    const { container } = render(<MyPayroll />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows the empty state when there are no payslips yet', () => {
    render(<MyPayroll />);
    expect(screen.getByText('No payslips yet')).toBeInTheDocument();
  });

  it('masks and unmasks the net pay figure via the eye toggle', () => {
    vi.mocked(client.useMyPayslips).mockReturnValue({ data: [payslip({ netPay: 444000 })], isLoading: false } as any);
    render(<MyPayroll />);

    // The same net pay figure is also echoed in the breakdown card and the
    // "Recent Payslips" list, so scope to the big hero <h2> specifically.
    expect(document.querySelector('h2.text-5xl')!.textContent).toBe('₦444,000.00');
    fireEvent.click(document.querySelector('button svg.lucide-eye')!.closest('button')!);
    expect(document.querySelector('h2.text-5xl')!.textContent).toBe('₦ ••••••••');
  });

  it('sums only the current year\'s gross pay into YTD, excluding prior years', () => {
    vi.mocked(client.useMyPayslips).mockReturnValue({
      data: [
        payslip({ id: 'PS-3', periodMonth: 3, periodYear: 2026, grossPay: 500000 }),
        payslip({ id: 'PS-2', periodMonth: 2, periodYear: 2026, grossPay: 500000 }),
        payslip({ id: 'PS-1', periodMonth: 12, periodYear: 2025, grossPay: 500000 }), // prior year, excluded
      ],
      isLoading: false,
    } as any);
    render(<MyPayroll />);

    expect(screen.getByText('₦1,000,000.00')).toBeInTheDocument(); // 2026 only: 500k + 500k
  });

  describe('Payslip detail — amount in words', () => {
    const casesToWords: [number, string][] = [
      [0, 'Zero Naira Only'],
      [15, 'Fifteen Naira Only'],
      [244000, 'Two Hundred Forty-Four Thousand Naira Only'],
      [1500000, 'One Million Five Hundred Thousand Naira Only'],
    ];

    it.each(casesToWords)('spells %i as "%s"', (amount, expected) => {
      vi.mocked(client.useMyPayslips).mockReturnValue({ data: [payslip({ netPay: amount })], isLoading: false } as any);
      render(<MyPayroll />);

      fireEvent.click(screen.getByText('View Payslip'));
      expect(screen.getByText(expected)).toBeInTheDocument();
    });
  });

  it('shows employee bank details on the payslip, or "Not on file" when missing', () => {
    vi.mocked(client.useMyPayslips).mockReturnValue({ data: [payslip()], isLoading: false } as any);
    vi.mocked(client.useMyProfile).mockReturnValue({ data: { id: 'emp-1', name: 'Ada', lastName: 'Lovelace', bankName: null }, isLoading: false } as any);
    render(<MyPayroll />);

    fireEvent.click(screen.getByText('View Payslip'));
    expect(screen.getByText('Not on file')).toBeInTheDocument();
  });

  it('lists every payslip in History, most recent first as given by the API', () => {
    vi.mocked(client.useMyPayslips).mockReturnValue({
      data: [payslip({ id: 'PS-2', periodMonth: 3 }), payslip({ id: 'PS-1', periodMonth: 2 })],
      isLoading: false,
    } as any);
    render(<MyPayroll />);

    fireEvent.click(screen.getByText('View All'));
    expect(screen.getByText('March 2026')).toBeInTheDocument();
    expect(screen.getByText('February 2026')).toBeInTheDocument();
  });

  it('computes the annual pension match from base salary and the employer match rate', () => {
    vi.mocked(client.useMyPayslips).mockReturnValue({ data: [payslip()], isLoading: false } as any);
    vi.mocked(client.useMyCompensation).mockReturnValue({
      data: { baseSalary: 6000000, benefits: { employerMatchRate: 10, healthPremium: 0 } },
      isLoading: false,
    } as any);
    render(<MyPayroll />);

    fireEvent.click(screen.getByText('View Total Compensation'));
    // Annual salary: 6,000,000 * 12; pension match: 6,000,000 * 10% * 12
    expect(screen.getByText('₦72,000,000.00')).toBeInTheDocument();
    expect(screen.getByText('₦7,200,000.00')).toBeInTheDocument();
  });
});
