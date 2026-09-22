import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TeamReports from '../features/manager/TeamReports';
import * as client from '../api/client';

const mockRefetch = vi.fn();

vi.mock('../api/client', () => ({
  useTeamReport: vi.fn(() => ({ data: undefined, isLoading: false, isError: false, isFetching: false, refetch: mockRefetch })),
}));

const reportData = (overrides: any = {}) => ({
  teamSize: 3,
  team: [{ id: 'EMP-1', name: 'Ada Lovelace', avatar: '', department: 'Engineering' }],
  workforce: {
    summary: { onNoticeCount: 1, avgTenureYears: 2.5 },
    tenureDistribution: [{ name: '0-1y', value: 1 }],
    genderDistribution: [{ name: 'Female', value: 2 }],
    statusBreakdown: [{ name: 'Active', value: 3 }],
  },
  leaveAttendance: { leaveByType: [{ name: 'Annual', value: 5 }] },
  performance: { avgGoalProgress: 72, totalGoals: 4, goalsByStatus: [{ name: 'On Track', value: 3 }] },
  ...overrides,
});

describe('TeamReports (manager)', () => {
  beforeEach(() => {
    mockRefetch.mockClear();
    vi.mocked(client.useTeamReport).mockReturnValue({ data: undefined, isLoading: false, isError: false, isFetching: false, refetch: mockRefetch } as any);
  });

  it('shows a loading spinner while the report loads', () => {
    vi.mocked(client.useTeamReport).mockReturnValue({ data: undefined, isLoading: true, isError: false, isFetching: false, refetch: mockRefetch } as any);
    const { container } = render(<TeamReports />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows a retry option on error, which calls refetch', () => {
    vi.mocked(client.useTeamReport).mockReturnValue({ data: undefined, isLoading: false, isError: true, isFetching: false, refetch: mockRefetch } as any);
    render(<TeamReports />);

    expect(screen.getByText("Couldn't load your team's reports right now.")).toBeInTheDocument();
    fireEvent.click(screen.getByText('Retry'));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('shows the "no direct reports" empty state and skips the charts entirely when teamSize is 0', () => {
    vi.mocked(client.useTeamReport).mockReturnValue({
      data: reportData({ teamSize: 0, team: [] }), isLoading: false, isError: false, isFetching: false, refetch: mockRefetch,
    } as any);
    render(<TeamReports />);

    expect(screen.getByText('No direct reports yet')).toBeInTheDocument();
    expect(screen.queryByText('Team Roster')).not.toBeInTheDocument();
  });

  it('pluralizes "direct reports" for a team of 1 vs many', () => {
    vi.mocked(client.useTeamReport).mockReturnValue({ data: reportData({ teamSize: 1 }), isLoading: false, isError: false, isFetching: false, refetch: mockRefetch } as any);
    const { rerender } = render(<TeamReports />);
    expect(screen.getByText('Insights for your 1 direct report.')).toBeInTheDocument();

    vi.mocked(client.useTeamReport).mockReturnValue({ data: reportData({ teamSize: 3 }), isLoading: false, isError: false, isFetching: false, refetch: mockRefetch } as any);
    rerender(<TeamReports />);
    expect(screen.getByText('Insights for your 3 direct reports.')).toBeInTheDocument();
  });

  it('shows an empty state for the tenure chart when every bucket is zero', () => {
    vi.mocked(client.useTeamReport).mockReturnValue({
      data: reportData({ workforce: { ...reportData().workforce, tenureDistribution: [{ name: '0-1y', value: 0 }, { name: '1-3y', value: 0 }] } }),
      isLoading: false, isError: false, isFetching: false, refetch: mockRefetch,
    } as any);
    render(<TeamReports />);
    expect(screen.getAllByText('No data yet').length).toBeGreaterThan(0);
  });

  it('shows a dedicated empty state for goals when the team has none logged, not the generic one', () => {
    vi.mocked(client.useTeamReport).mockReturnValue({
      data: reportData({ performance: { avgGoalProgress: 0, totalGoals: 0, goalsByStatus: [] } }),
      isLoading: false, isError: false, isFetching: false, refetch: mockRefetch,
    } as any);
    render(<TeamReports />);
    expect(screen.getByText('No goals logged yet')).toBeInTheDocument();
  });

  it('triggers a refetch from the header refresh button', () => {
    vi.mocked(client.useTeamReport).mockReturnValue({ data: reportData(), isLoading: false, isError: false, isFetching: false, refetch: mockRefetch } as any);
    render(<TeamReports />);
    fireEvent.click(screen.getByTitle('Refresh'));
    expect(mockRefetch).toHaveBeenCalled();
  });
});
