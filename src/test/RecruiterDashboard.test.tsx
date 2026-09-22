import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import RecruiterDashboard from '../features/recruitment/RecruiterDashboard';
import * as client from '../api/client';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'emp-1', name: 'Riya Recruiter', role: 'RECRUITER' } }),
}));

vi.mock('../context/NavigationContext', () => ({
  useNavigation: () => ({ setActiveTab: vi.fn() }),
}));

vi.mock('../api/client', () => ({
  useRecruitmentReport: vi.fn(() => ({ data: undefined, isLoading: false })),
  useJobRequisitions: vi.fn(() => ({ data: [], isLoading: false })),
}));

describe('RecruiterDashboard', () => {
  beforeEach(() => {
    vi.mocked(client.useRecruitmentReport).mockReturnValue({ data: undefined, isLoading: false } as any);
    vi.mocked(client.useJobRequisitions).mockReturnValue({ data: [], isLoading: false } as any);
  });

  it('shows a loading spinner while either the report or requisitions are loading', () => {
    vi.mocked(client.useJobRequisitions).mockReturnValue({ data: [], isLoading: true } as any);
    const { container } = render(<RecruiterDashboard />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('falls back to safe defaults when the report has not loaded any summary yet', () => {
    render(<RecruiterDashboard />);
    // avgTimeToFill defaults to null -> rendered as an em dash, not "nulld".
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('formats a known avg time to fill in days', () => {
    vi.mocked(client.useRecruitmentReport).mockReturnValue({
      data: { summary: { totalRequisitions: 10, openPositions: 4, filledThisMonth: 2, avgDaysOpen: 12, avgTimeToFill: 21 }, statusBreakdown: [], byDepartment: [], monthlyTrend: [] },
      isLoading: false,
    } as any);
    render(<RecruiterDashboard />);
    expect(screen.getByText('21d')).toBeInTheDocument();
  });

  it('only lists Open requisitions, sorted with the longest-open first', () => {
    vi.mocked(client.useJobRequisitions).mockReturnValue({
      data: [
        { id: 'REQ-1', title: 'Backend Engineer', department: 'Engineering', location: 'Lagos', priority: 'Medium', status: 'Open', daysOpen: 5 },
        { id: 'REQ-2', title: 'Recruiter', department: 'People', location: 'Remote', priority: 'Low', status: 'Filled', daysOpen: 40 },
        { id: 'REQ-3', title: 'Frontend Engineer', department: 'Engineering', location: 'Lagos', priority: 'High', status: 'Open', daysOpen: 30 },
      ],
      isLoading: false,
    } as any);

    render(<RecruiterDashboard />);

    expect(screen.getByText('Open Positions (2)')).toBeInTheDocument();
    expect(screen.queryByText('Recruiter')).not.toBeInTheDocument(); // Filled, excluded
    const names = screen.getAllByText(/Engineer$/).map((el) => el.textContent);
    expect(names).toEqual(['Frontend Engineer', 'Backend Engineer']); // 30 days before 5 days
  });

  it('shows the empty state when there are no open positions', () => {
    render(<RecruiterDashboard />);
    expect(screen.getByText('No open positions right now.')).toBeInTheDocument();
  });
});
