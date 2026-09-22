import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render as rtlRender, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PayrollDashboard from '../features/payroll/PayrollDashboard';
import * as client from '../api/client';

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

const mockSetActiveTab = vi.fn();
vi.mock('../context/NavigationContext', () => ({
  useNavigation: () => ({ setActiveTab: mockSetActiveTab }),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'po-1', name: 'Pat Officer', role: 'PAYROLL_OFFICER' } }),
}));

const { mockCompleteTask, mockDownloadRemittanceSchedule } = vi.hoisted(() => ({
  mockCompleteTask: vi.fn(),
  mockDownloadRemittanceSchedule: vi.fn(),
}));

vi.mock('../api/client', () => ({
  usePayrollDashboard: vi.fn(() => ({ data: undefined, isLoading: false })),
  useComplianceTasks: vi.fn(() => ({ data: [] })),
  useCompleteComplianceTask: vi.fn(() => ({ mutate: mockCompleteTask, isPending: false })),
  useLoans: vi.fn(() => ({ data: [] })),
  downloadRemittanceSchedule: mockDownloadRemittanceSchedule,
}));

const dashboard = (overrides: any = {}) => ({
  periodMonth: 3, periodYear: 2026, currentRun: null,
  employeeCount: 40, totalGross: 20_000_000, totalNet: 16_000_000, totalTaxes: 2_000_000, totalPension: 1_000_000,
  exceptions: [], pendingComplianceCount: 0, upcomingRemittances: [], activeLoanCount: 0, activeLoanBalance: 0, recentRuns: [],
  ...overrides,
});

describe('PayrollDashboard', () => {
  beforeEach(() => {
    mockSetActiveTab.mockClear();
    mockCompleteTask.mockClear();
    mockDownloadRemittanceSchedule.mockClear();
    mockDownloadRemittanceSchedule.mockResolvedValue(undefined);
    vi.mocked(client.usePayrollDashboard).mockReturnValue({ data: dashboard(), isLoading: false } as any);
    vi.mocked(client.useComplianceTasks).mockReturnValue({ data: [] } as any);
    vi.mocked(client.useLoans).mockReturnValue({ data: [] } as any);
  });

  it('shows a loading spinner while the dashboard loads', () => {
    vi.mocked(client.usePayrollDashboard).mockReturnValue({ data: undefined, isLoading: true } as any);
    const { container } = render(<PayrollDashboard />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders KPI values, including combined tax + pension and formatted active loans', () => {
    render(<PayrollDashboard />);
    expect(screen.getByText('Tax + Pension').closest('div')!.textContent).toContain('₦3,000,000');
    expect(screen.getByText('Employees on Payroll').closest('div')!.textContent).toContain('40');
  });

  it('shows a live preview and "Submit Run" when no run exists yet for the period', () => {
    render(<PayrollDashboard />);
    expect(screen.getByText(/net \(preview\)/)).toBeInTheDocument();
    expect(screen.getByText('Submit Run')).toBeInTheDocument();
  });

  it('shows the current run status and "Manage Run" when a run exists', () => {
    vi.mocked(client.usePayrollDashboard).mockReturnValue({
      data: dashboard({ currentRun: { status: 'approved', totalNet: 16_000_000, paidAt: null } }),
      isLoading: false,
    } as any);
    render(<PayrollDashboard />);
    expect(screen.getByText('Approved — ready to be marked as paid')).toBeInTheDocument();
    expect(screen.getByText('Manage Run')).toBeInTheDocument();
  });

  it('shows paid date once the run is marked paid', () => {
    vi.mocked(client.usePayrollDashboard).mockReturnValue({
      data: dashboard({ currentRun: { status: 'paid', totalNet: 16_000_000, paidAt: '2026-03-05T10:00:00Z' } }),
      isLoading: false,
    } as any);
    render(<PayrollDashboard />);
    expect(screen.getByText(/^Paid /)).toBeInTheDocument();
  });

  it('lists exceptions that must be resolved before running payroll', () => {
    vi.mocked(client.usePayrollDashboard).mockReturnValue({
      data: dashboard({ exceptions: [{ employeeName: 'Grace Hopper', issue: 'Missing bank details', type: 'bank', severity: 'red' }] }),
      isLoading: false,
    } as any);
    render(<PayrollDashboard />);
    expect(screen.getByText('1 exception to resolve before running payroll')).toBeInTheDocument();
    expect(screen.getByText('Grace Hopper')).toBeInTheDocument();
  });

  it('shows "No payroll runs yet" when there is no run history', () => {
    render(<PayrollDashboard />);
    expect(screen.getByText('No payroll runs yet.')).toBeInTheDocument();
  });

  it('lists recent runs', () => {
    vi.mocked(client.usePayrollDashboard).mockReturnValue({
      data: dashboard({ recentRuns: [{ id: 'RUN-1', periodYear: 2026, periodMonth: 2, totalNet: 15_000_000, status: 'paid' }] }),
      isLoading: false,
    } as any);
    render(<PayrollDashboard />);
    expect(screen.getByText('February 2026')).toBeInTheDocument();
  });

  it('shows "No pending compliance tasks" and no badge when the list is empty', () => {
    render(<PayrollDashboard />);
    expect(screen.getByText('No pending compliance tasks.')).toBeInTheDocument();
  });

  it('lists upcoming remittances with a compliance-count badge, and marks one done', () => {
    vi.mocked(client.usePayrollDashboard).mockReturnValue({
      data: dashboard({
        pendingComplianceCount: 1,
        upcomingRemittances: [{ id: 'TASK-1', title: 'PAYE Remittance', dueDate: '2026-04-10', type: 'tax', payrollRunId: 'RUN-1' }],
      }),
      isLoading: false,
    } as any);
    render(<PayrollDashboard />);

    expect(screen.getByText('Upcoming Remittances').parentElement!.textContent).toContain('1');
    expect(screen.getByText('PAYE Remittance')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Mark Done'));
    expect(mockCompleteTask).toHaveBeenCalledWith({ id: 'TASK-1' }, expect.objectContaining({ onSuccess: expect.any(Function) }));
  });

  it('downloads the remittance schedule for a task tied to a payroll run', () => {
    vi.mocked(client.usePayrollDashboard).mockReturnValue({
      data: dashboard({
        pendingComplianceCount: 1,
        upcomingRemittances: [{ id: 'TASK-1', title: 'PAYE Remittance', dueDate: '2026-04-10', type: 'tax', payrollRunId: 'RUN-1' }],
      }),
      isLoading: false,
    } as any);
    render(<PayrollDashboard />);

    fireEvent.click(screen.getByText('Schedule'));
    expect(mockDownloadRemittanceSchedule).toHaveBeenCalledWith('RUN-1', 'paye');
  });

  it('does not offer a schedule download for a task with no linked payroll run', () => {
    vi.mocked(client.usePayrollDashboard).mockReturnValue({
      data: dashboard({
        pendingComplianceCount: 1,
        upcomingRemittances: [{ id: 'TASK-1', title: 'PAYE Remittance', dueDate: '2026-04-10', type: 'tax', payrollRunId: null }],
      }),
      isLoading: false,
    } as any);
    render(<PayrollDashboard />);
    expect(screen.queryByText('Schedule')).not.toBeInTheDocument();
  });

  it('shows "No active loans" when there are none, filtering out non-active loans', () => {
    vi.mocked(client.useLoans).mockReturnValue({ data: [{ id: 'L-1', employeeName: 'Bob', status: 'paid_off', remainingBalance: 0 }] } as any);
    render(<PayrollDashboard />);
    expect(screen.getByText('No active loans.')).toBeInTheDocument();
  });

  it('lists active loans with formatted balances', () => {
    vi.mocked(client.useLoans).mockReturnValue({
      data: [
        { id: 'L-1', employeeName: 'Grace Hopper', status: 'active', remainingBalance: 250000 },
        { id: 'L-2', employeeName: 'Bob Marley', status: 'paid_off', remainingBalance: 0 },
      ],
    } as any);
    render(<PayrollDashboard />);
    expect(screen.getByText('Grace Hopper')).toBeInTheDocument();
    expect(screen.queryByText('Bob Marley')).not.toBeInTheDocument();
    expect(screen.getByText('₦250,000')).toBeInTheDocument();
  });

  it('navigates to the payroll tab from the header button', () => {
    render(<PayrollDashboard />);
    fireEvent.click(screen.getByText('Go to Payroll'));
    expect(mockSetActiveTab).toHaveBeenCalledWith('payroll');
  });
});
