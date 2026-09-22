import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HRDashboard from '../features/admin/HRDashboard';
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

const mockSetActiveTab = vi.fn();
vi.mock('../context/NavigationContext', () => ({
  useNavigation: () => ({ setActiveTab: mockSetActiveTab }),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'admin-1', name: 'Ada Lovelace', role: 'HR_ADMIN' } }),
}));

const { mockDownloadReportCsv } = vi.hoisted(() => ({ mockDownloadReportCsv: vi.fn() }));

vi.mock('../api/client', () => ({
  useDashboardStats: vi.fn(() => ({ data: undefined, isLoading: false })),
  downloadReportCsv: mockDownloadReportCsv,
}));

const dashboardData = (overrides: any = {}) => ({
  totalHeadcount: 50,
  newHires: 4,
  attritionRate: '5%',
  openPositions: 3,
  totalPayroll: 12_500_000,
  deptData: [{ name: 'Engineering', value: 20, fill: '#6366f1' }],
  diversityData: [{ name: 'Female', value: 25, fill: '#f43f5e' }],
  headcountTrend: [{ month: 'Jan', total: 45 }],
  alerts: [],
  recentActivity: [],
  events: { birthdays: [], anniversaries: [] },
  ...overrides,
});

describe('HRDashboard (admin)', () => {
  beforeEach(() => {
    mockSetActiveTab.mockClear();
    mockDownloadReportCsv.mockClear();
    mockDownloadReportCsv.mockResolvedValue(undefined);
    vi.mocked(client.useDashboardStats).mockReturnValue({ data: dashboardData(), isLoading: false } as any);
  });

  it('shows a loading spinner while stats load', () => {
    vi.mocked(client.useDashboardStats).mockReturnValue({ data: undefined, isLoading: true } as any);
    const { container } = render(<HRDashboard />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders KPI values from the dashboard stats, formatting payroll in millions', () => {
    render(<HRDashboard />);
    expect(screen.getByText('Total Headcount').closest('div')!.parentElement!.textContent).toContain('50');
    expect(screen.getByText('₦12.5M')).toBeInTheDocument();
  });

  it('shows "All clear" with no pending-actions badge when there are no alerts', () => {
    render(<HRDashboard />);
    expect(screen.getByText('All clear!')).toBeInTheDocument();
    expect(screen.getByText('Pending Actions').closest('div')!.parentElement!.textContent).toContain('0');
  });

  it('lists alerts and shows the pending-actions count when present', () => {
    vi.mocked(client.useDashboardStats).mockReturnValue({
      data: dashboardData({ alerts: [{ type: 'red', iconType: 'FileText', title: 'Missing tax docs', sub: '3 employees' }] }),
      isLoading: false,
    } as any);
    render(<HRDashboard />);
    expect(screen.getByText('Missing tax docs')).toBeInTheDocument();
    expect(screen.getByText('Pending Actions').closest('div')!.parentElement!.textContent).toContain('1');
  });

  it('renders recent activity entries', () => {
    vi.mocked(client.useDashboardStats).mockReturnValue({
      data: dashboardData({ recentActivity: [{ ev: 'Grace Hopper was onboarded', t: '2h ago', color: 'bg-emerald-500' }] }),
      isLoading: false,
    } as any);
    render(<HRDashboard />);
    expect(screen.getByText('Grace Hopper was onboarded')).toBeInTheDocument();
  });

  it('shows fallback text when there are no birthdays or anniversaries this month', () => {
    render(<HRDashboard />);
    expect(screen.getByText('No birthdays')).toBeInTheDocument();
    expect(screen.getByText('No anniversaries')).toBeInTheDocument();
  });

  it('lists birthdays and anniversaries when present', () => {
    vi.mocked(client.useDashboardStats).mockReturnValue({
      data: dashboardData({ events: { birthdays: ['Grace Hopper', 'Ada Lovelace'], anniversaries: ['Bob Marley'] } }),
      isLoading: false,
    } as any);
    render(<HRDashboard />);
    expect(screen.getByText('Grace Hopper, Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('Bob Marley')).toBeInTheDocument();
  });

  it('navigates to the directory when the search form is submitted', () => {
    render(<HRDashboard />);
    fireEvent.change(screen.getByPlaceholderText('Search employee, policy...'), { target: { value: 'Grace' } });
    fireEvent.submit(screen.getByPlaceholderText('Search employee, policy...').closest('form')!);
    expect(mockSetActiveTab).toHaveBeenCalledWith('directory');
  });

  it('navigates via a KPI card action button', () => {
    render(<HRDashboard />);
    fireEvent.click(screen.getByText('Recruitment', { selector: 'button' }));
    expect(mockSetActiveTab).toHaveBeenCalledWith('recruitment');
  });

  it('navigates via a quick-action button in the orchestration matrix', () => {
    render(<HRDashboard />);
    fireEvent.click(screen.getByText('Post Job'));
    expect(mockSetActiveTab).toHaveBeenCalledWith('recruitment');
  });

  it('exports the employee report as CSV, showing progress state', async () => {
    let resolveExport: () => void;
    mockDownloadReportCsv.mockReturnValue(new Promise<void>((resolve) => { resolveExport = resolve; }));
    render(<HRDashboard />);

    fireEvent.click(screen.getByText('Report'));
    expect(screen.getByText('Exporting…')).toBeInTheDocument();
    expect(mockDownloadReportCsv).toHaveBeenCalledWith('employees');

    resolveExport!();
    await waitFor(() => expect(screen.getByText('Report')).toBeInTheDocument());
  });

  it('does not crash the export flow when the download rejects', async () => {
    mockDownloadReportCsv.mockRejectedValue(new Error('network error'));
    render(<HRDashboard />);
    fireEvent.click(screen.getByText('Report'));
    await waitFor(() => expect(screen.getByText('Report')).toBeInTheDocument());
  });
});
