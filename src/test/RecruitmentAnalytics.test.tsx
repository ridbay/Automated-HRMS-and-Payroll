import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RecruitmentAnalytics, { RecruitmentAnalyticsBody } from '../features/recruitment/RecruitmentAnalytics';
import * as client from '../api/client';

const mockRefetch = vi.fn();

vi.mock('../api/client', () => ({
  useRecruitmentReport: vi.fn(() => ({ data: undefined, isLoading: false, isError: false, isFetching: false, refetch: mockRefetch })),
}));

const reportData = (overrides: any = {}) => ({
  summary: { totalRequisitions: 10, openPositions: 4, filledThisMonth: 2, avgDaysOpen: 12, avgTimeToFill: 21 },
  statusBreakdown: [{ name: 'Open', value: 4 }],
  byDepartment: [{ name: 'Engineering', value: 6 }],
  byPriority: [{ name: 'High', value: 3 }],
  monthlyTrend: [{ month: 'Jan', opened: 3, filled: 1 }],
  ...overrides,
});

describe('RecruitmentAnalyticsBody', () => {
  beforeEach(() => {
    mockRefetch.mockClear();
    vi.mocked(client.useRecruitmentReport).mockReturnValue({ data: undefined, isLoading: false, isError: false, isFetching: false, refetch: mockRefetch } as any);
  });

  it('shows a loading spinner while the report is loading', () => {
    vi.mocked(client.useRecruitmentReport).mockReturnValue({ data: undefined, isLoading: true, isError: false, isFetching: false, refetch: mockRefetch } as any);
    const { container } = render(<RecruitmentAnalyticsBody />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows a retry option on error, which calls refetch', () => {
    vi.mocked(client.useRecruitmentReport).mockReturnValue({ data: undefined, isLoading: false, isError: true, isFetching: false, refetch: mockRefetch } as any);
    render(<RecruitmentAnalyticsBody />);

    expect(screen.getByText("Couldn't load recruitment analytics right now.")).toBeInTheDocument();
    fireEvent.click(screen.getByText('Retry'));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('also shows the error state when there is simply no data yet, even without isError', () => {
    vi.mocked(client.useRecruitmentReport).mockReturnValue({ data: undefined, isLoading: false, isError: false, isFetching: false, refetch: mockRefetch } as any);
    render(<RecruitmentAnalyticsBody />);
    expect(screen.getByText("Couldn't load recruitment analytics right now.")).toBeInTheDocument();
  });

  it('renders the KPI values from the report, formatting a null avg-time-to-fill as an em dash', () => {
    vi.mocked(client.useRecruitmentReport).mockReturnValue({
      data: reportData({ summary: { totalRequisitions: 10, openPositions: 4, filledThisMonth: 2, avgDaysOpen: 12, avgTimeToFill: null } }),
      isLoading: false, isError: false, isFetching: false, refetch: mockRefetch,
    } as any);
    render(<RecruitmentAnalyticsBody />);

    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.queryByText('nulld')).not.toBeInTheDocument();
  });

  it('formats a known avg time to fill in days', () => {
    vi.mocked(client.useRecruitmentReport).mockReturnValue({ data: reportData(), isLoading: false, isError: false, isFetching: false, refetch: mockRefetch } as any);
    render(<RecruitmentAnalyticsBody />);
    expect(screen.getByText('21d')).toBeInTheDocument();
  });

  it('shows an empty state for the trend chart when every month is zero, instead of an empty chart', () => {
    vi.mocked(client.useRecruitmentReport).mockReturnValue({
      data: reportData({ monthlyTrend: [{ month: 'Jan', opened: 0, filled: 0 }, { month: 'Feb', opened: 0, filled: 0 }] }),
      isLoading: false, isError: false, isFetching: false, refetch: mockRefetch,
    } as any);
    render(<RecruitmentAnalyticsBody />);

    // One "No data yet" for the trend card; by-status/department/priority all have data in this fixture.
    expect(screen.getAllByText('No data yet')).toHaveLength(1);
  });

  it('shows an empty state per distribution card when its data is empty', () => {
    vi.mocked(client.useRecruitmentReport).mockReturnValue({
      data: reportData({ statusBreakdown: [], byDepartment: [], byPriority: [] }),
      isLoading: false, isError: false, isFetching: false, refetch: mockRefetch,
    } as any);
    render(<RecruitmentAnalyticsBody />);

    // Status, Department, and Priority cards are all empty (trend still has data in this fixture).
    expect(screen.getAllByText('No data yet')).toHaveLength(3);
  });
});

describe('RecruitmentAnalytics (standalone page)', () => {
  beforeEach(() => {
    mockRefetch.mockClear();
    vi.mocked(client.useRecruitmentReport).mockReturnValue({ data: reportData(), isLoading: false, isError: false, isFetching: false, refetch: mockRefetch } as any);
  });

  it('triggers a refetch from the header refresh button', () => {
    render(<RecruitmentAnalytics />);
    fireEvent.click(screen.getByTitle('Refresh'));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('disables the refresh button while a fetch is already in flight', () => {
    vi.mocked(client.useRecruitmentReport).mockReturnValue({ data: reportData(), isLoading: false, isError: false, isFetching: true, refetch: mockRefetch } as any);
    render(<RecruitmentAnalytics />);
    expect(screen.getByTitle('Refresh')).toBeDisabled();
  });
});
