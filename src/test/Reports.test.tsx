import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import Reports from '../features/admin/Reports';
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

// Recharts' ResponsiveContainer needs real layout dimensions to render children
// in jsdom, which we don't have. Its actual chart internals aren't under test
// here (the data-shaping logic in Reports.tsx is), so stub it out to just
// render children directly.
vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: any) => React.createElement('div', null, children),
  };
});

const mockUser: any = { id: 'admin-1', role: 'HR_ADMIN' };
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

const { mockRefetch, mockDownloadReportCsv } = vi.hoisted(() => ({
  mockRefetch: vi.fn(),
  mockDownloadReportCsv: vi.fn(),
}));

vi.mock('../api/client', () => ({
  useReportsOverview: vi.fn(),
  downloadReportCsv: mockDownloadReportCsv,
}));

const overview = (overrides: any = {}) => ({
  workforce: {
    summary: {
      totalHeadcount: 42, attritionRate: 5, exitsLast12Months: 2, avgTenureYears: 3,
      activeCount: 38, onboardingCount: 3, onNoticeCount: 1, newHiresThisMonth: 4,
    },
    headcountTrend: [],
    departmentDistribution: [{ name: 'Engineering', value: 20 }],
    genderDistribution: [{ name: 'Female', value: 20 }, { name: 'Male', value: 22 }],
    tenureDistribution: [{ name: '0-1y', value: 10 }],
    employmentTypeDistribution: [{ name: 'Full-time', value: 40 }],
    locationDistribution: [{ name: 'Lagos', value: 30 }],
    statusBreakdown: [{ name: 'Active', value: 38 }],
    exitReasonBreakdown: [],
    ...overrides.workforce,
  },
  recruitment: {
    summary: { totalRequisitions: 10, openPositions: 3, filledThisMonth: 2, avgDaysOpen: 15, avgTimeToFill: 21 },
    statusBreakdown: [{ name: 'Open', value: 3 }],
    byDepartment: [{ name: 'Engineering', value: 2 }],
    byPriority: [{ name: 'High', value: 1 }],
    monthlyTrend: [{ month: 'Jan', opened: 2, filled: 1 }],
    ...overrides.recruitment,
  },
  payroll: {
    summary: {
      monthlyRunRate: 5_000_000, pendingComplianceCount: 1, pendingComplianceAmount: 150_000,
      lastPaidRunNet: 4_800_000, lastPaidRunPeriod: 'February 2026',
    },
    costTrend: [],
    costByDepartment: [{ name: 'Engineering', value: 2_000_000 }],
    salaryBands: [{ name: '0-500k', value: 5 }],
    complianceSummary: { pending: 1, completed: 4, byType: [{ name: 'PAYE', value: 1 }] },
    ...overrides.payroll,
  },
  leaveAttendance: {
    leaveByType: [{ name: 'Annual', value: 12 }],
    ...overrides.leaveAttendance,
  },
  performance: {
    totalGoals: 5,
    goalsByStatus: [{ name: 'On Track', value: 5 }],
    avgGoalProgress: 60,
    ...overrides.performance,
  },
});

describe('Reports (admin)', () => {
  beforeEach(() => {
    mockUser.role = 'HR_ADMIN';
    mockRefetch.mockClear();
    mockDownloadReportCsv.mockClear();
    mockDownloadReportCsv.mockResolvedValue(undefined);
    vi.mocked(client.useReportsOverview).mockReturnValue({
      data: overview(), isLoading: false, isError: false, refetch: mockRefetch, isFetching: false,
    } as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a loading spinner while the overview loads', () => {
    vi.mocked(client.useReportsOverview).mockReturnValue({
      data: undefined, isLoading: true, isError: false, refetch: mockRefetch, isFetching: false,
    } as any);
    const { container } = render(<Reports />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows an error state with a retry button that calls refetch', () => {
    vi.mocked(client.useReportsOverview).mockReturnValue({
      data: undefined, isLoading: false, isError: true, refetch: mockRefetch, isFetching: false,
    } as any);
    render(<Reports />);

    expect(screen.getByText("Couldn't load reports right now.")).toBeInTheDocument();
    fireEvent.click(screen.getByText('Retry'));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders the overview tab by default with headline KPIs', () => {
    render(<Reports />);

    expect(screen.getByText('Total Headcount')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('5%')).toBeInTheDocument(); // attrition rate
    expect(screen.getByText('2 exits')).toBeInTheDocument();
  });

  it('marks attrition as positive (green) only when under 10%, and pending compliance as clear only at zero', () => {
    render(<Reports />);
    const attritionTrend = screen.getByText('2 exits');
    expect(attritionTrend).toHaveClass('text-emerald-500');

    const pendingTrend = screen.getByText('₦150,000');
    expect(pendingTrend).toHaveClass('text-rose-500');
  });

  it('shows "All clear" for pending compliance once the count is zero', () => {
    vi.mocked(client.useReportsOverview).mockReturnValue({
      data: overview({ payroll: { summary: { monthlyRunRate: 0, pendingComplianceCount: 0, pendingComplianceAmount: 0, lastPaidRunNet: null, lastPaidRunPeriod: null }, costTrend: [], costByDepartment: [], salaryBands: [], complianceSummary: { pending: 0, completed: 0, byType: [] } } }),
      isLoading: false, isError: false, refetch: mockRefetch, isFetching: false,
    } as any);
    render(<Reports />);
    expect(screen.getByText('All clear')).toBeInTheDocument();
  });

  it('shows the full tab set for an HR admin', () => {
    render(<Reports />);
    ['Overview', 'Workforce', 'Recruitment', 'Payroll', 'Exports'].forEach((name) => {
      expect(screen.getByRole('button', { name: new RegExp(name) })).toBeInTheDocument();
    });
  });

  it('restricts a payroll officer to only the Payroll and Exports tabs, defaulting to Payroll', () => {
    mockUser.role = 'PAYROLL_OFFICER';
    render(<Reports />);

    expect(screen.queryByRole('button', { name: /Overview/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Workforce/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Recruitment/ })).not.toBeInTheDocument();
    // Payroll tab content is shown by default (it's the first available tab)
    expect(screen.getByText('Monthly Run-Rate')).toBeInTheDocument();
  });

  it('hides employee-roster, requisition, and leave exports for a payroll officer, keeping only payroll', () => {
    mockUser.role = 'PAYROLL_OFFICER';
    render(<Reports />);
    fireEvent.click(screen.getByRole('button', { name: /Exports/ }));

    expect(screen.queryByText('Workforce Roster')).not.toBeInTheDocument();
    expect(screen.queryByText('Job Requisitions')).not.toBeInTheDocument();
    expect(screen.queryByText('Leave Requests')).not.toBeInTheDocument();
    expect(screen.getByText('Payroll Run (Payslips)')).toBeInTheDocument();
  });

  it('switches to the Workforce tab and shows its KPIs', () => {
    render(<Reports />);
    fireEvent.click(screen.getByRole('button', { name: /Workforce/ }));

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('38')).toBeInTheDocument();
    expect(screen.getByText('Onboarding')).toBeInTheDocument();
  });

  it('switches to the Recruitment tab and shows time-to-fill, falling back to an em dash when null', () => {
    vi.mocked(client.useReportsOverview).mockReturnValue({
      data: overview({ recruitment: { summary: { totalRequisitions: 1, openPositions: 1, filledThisMonth: 0, avgDaysOpen: 5, avgTimeToFill: null }, statusBreakdown: [], byDepartment: [], byPriority: [], monthlyTrend: [] } }),
      isLoading: false, isError: false, refetch: mockRefetch, isFetching: false,
    } as any);
    render(<Reports />);
    fireEvent.click(screen.getByRole('button', { name: /Recruitment/ }));

    expect(screen.getByText('Avg. Time to Fill')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('shows an empty state when a distribution has no data', () => {
    vi.mocked(client.useReportsOverview).mockReturnValue({
      data: overview({ recruitment: { summary: { totalRequisitions: 0, openPositions: 0, filledThisMonth: 0, avgDaysOpen: 0, avgTimeToFill: null }, statusBreakdown: [], byDepartment: [], byPriority: [], monthlyTrend: [] } }),
      isLoading: false, isError: false, refetch: mockRefetch, isFetching: false,
    } as any);
    render(<Reports />);
    fireEvent.click(screen.getByRole('button', { name: /Recruitment/ }));

    expect(screen.getAllByText('No data yet').length).toBeGreaterThan(0);
  });

  it('switches to the Payroll tab and shows the compliance breakdown', () => {
    render(<Reports />);
    fireEvent.click(screen.getByRole('button', { name: /Payroll/ }));

    const complianceCard = screen.getByText('Compliance (Statutory Remittances)').closest('div')!;
    expect(within(complianceCard).getByText('Pending').previousSibling).toHaveTextContent('1');
    expect(within(complianceCard).getByText('Completed').previousSibling).toHaveTextContent('4');
  });

  it('triggers a refresh via the refresh button', () => {
    render(<Reports />);
    fireEvent.click(screen.getByTitle('Refresh'));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('disables the refresh button while a refetch is already in flight', () => {
    vi.mocked(client.useReportsOverview).mockReturnValue({
      data: overview(), isLoading: false, isError: false, refetch: mockRefetch, isFetching: true,
    } as any);
    render(<Reports />);
    expect(screen.getByTitle('Refresh')).toBeDisabled();
  });

  describe('Exports', () => {
    const openExportsTab = () => {
      render(<Reports />);
      fireEvent.click(screen.getByRole('button', { name: /Exports/ }));
    };

    it('downloads the employee roster with no extra params', async () => {
      openExportsTab();
      const card = screen.getByText('Workforce Roster').closest('div')!;
      fireEvent.click(within(card).getByText('Download CSV'));

      await waitFor(() => expect(mockDownloadReportCsv).toHaveBeenCalledWith('employees', undefined));
    });

    it('downloads the payroll export with the selected month and year', async () => {
      openExportsTab();
      const card = screen.getByText('Payroll Run (Payslips)').closest('div')!;
      const selects = within(card).getAllByRole('combobox');
      fireEvent.change(selects[0], { target: { value: '3' } }); // March
      fireEvent.change(selects[1], { target: { value: '2025' } });
      fireEvent.click(within(card).getByText('Download CSV'));

      await waitFor(() => expect(mockDownloadReportCsv).toHaveBeenCalledWith('payroll', { month: 3, year: 2025 }));
    });

    it('shows "Generating…" while the export is in flight, then reverts', async () => {
      let resolveExport: () => void;
      mockDownloadReportCsv.mockReturnValue(new Promise<void>((resolve) => { resolveExport = resolve; }));
      openExportsTab();
      const card = screen.getByText('Workforce Roster').closest('div')!;
      fireEvent.click(within(card).getByText('Download CSV'));

      expect(within(card).getByText('Generating…')).toBeInTheDocument();
      resolveExport!();
      await waitFor(() => expect(within(card).getByText('Download CSV')).toBeInTheDocument());
    });

    it('surfaces an export failure via alert', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      mockDownloadReportCsv.mockRejectedValue(new Error('Export failed: network error'));
      openExportsTab();
      const card = screen.getByText('Workforce Roster').closest('div')!;
      fireEvent.click(within(card).getByText('Download CSV'));

      await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Export failed: network error'));
      alertSpy.mockRestore();
    });
  });
});
