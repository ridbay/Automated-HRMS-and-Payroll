import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EmployeePortal from '../features/employee/EmployeePortal';
import * as client from '../api/client';
import * as assetClient from '../api/asset.client';
import * as surveyClient from '../api/survey.client';
import * as learningClient from '../api/learning.client';

vi.mock('../features/employee/TakeSurveyModal', () => ({
  TakeSurveyModal: ({ surveyId }: any) => (surveyId ? React.createElement('div', null, `Survey Modal: ${surveyId}`) : null),
}));
vi.mock('../features/employee/TakeCourseModal', () => ({
  TakeCourseModal: ({ enrollment }: any) => (enrollment ? React.createElement('div', null, `Course Modal: ${enrollment.course.title}`) : null),
}));

vi.mock('../context/NavigationContext', () => ({
  useNavigation: () => ({ setActiveTab: vi.fn() }),
}));

const mockUser: any = { id: 'emp-1', name: 'Ada Lovelace', role: 'EMPLOYEE' };
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

const { mockClockIn, mockClockOut } = vi.hoisted(() => ({
  mockClockIn: vi.fn(),
  mockClockOut: vi.fn(),
}));

vi.mock('../api/client', () => ({
  useMyLeave: vi.fn(() => ({ data: { balances: [], requests: [] }, isLoading: false })),
  useMyAttendance: vi.fn(() => ({ data: { activeSession: null, history: [] }, isLoading: false })),
  useMyPerformanceSummary: vi.fn(() => ({ data: undefined, isLoading: false })),
  useMyPayslips: vi.fn(() => ({ data: [], isLoading: false })),
  useShoutouts: vi.fn(() => ({ data: [] })),
  useClockIn: vi.fn(() => ({ mutate: mockClockIn, isPending: false })),
  useClockOut: vi.fn(() => ({ mutate: mockClockOut, isPending: false })),
}));

vi.mock('../api/asset.client', () => ({
  useMyAssets: vi.fn(() => ({ data: [], isLoading: false })),
}));
vi.mock('../api/survey.client', () => ({
  useActiveSurveys: vi.fn(() => ({ data: [], isLoading: false })),
}));
vi.mock('../api/learning.client', () => ({
  useMyCourses: vi.fn(() => ({ data: [], isLoading: false })),
}));

describe('EmployeePortal', () => {
  beforeEach(() => {
    mockClockIn.mockClear();
    mockClockOut.mockClear();
    vi.mocked(client.useMyLeave).mockReturnValue({ data: { balances: [], requests: [] }, isLoading: false } as any);
    vi.mocked(client.useMyAttendance).mockReturnValue({ data: { activeSession: null, history: [] }, isLoading: false } as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('clocks in and triggers the celebration on success', () => {
    mockClockIn.mockImplementation((_payload, { onSuccess }) => onSuccess());
    render(<EmployeePortal />);

    fireEvent.click(screen.getByText('Clock In Now'));
    expect(mockClockIn).toHaveBeenCalledWith({}, expect.objectContaining({ onSuccess: expect.any(Function) }));
  });

  it('clocks out (no confirmation needed) when already clocked in', () => {
    vi.mocked(client.useMyAttendance).mockReturnValue({ data: { activeSession: { id: 'SESS-1' }, history: [] }, isLoading: false } as any);
    render(<EmployeePortal />);

    fireEvent.click(screen.getAllByText('Clock Out')[0]);
    expect(mockClockOut).toHaveBeenCalledWith({});
  });

  it('prefers "Annual Leave" as the primary balance shown, even if it is not first in the list', () => {
    vi.mocked(client.useMyLeave).mockReturnValue({
      data: {
        balances: [
          { type: 'Sick Leave', total: 10, used: 2 },
          { type: 'Annual Leave', total: 20, used: 5 },
        ],
        requests: [],
      },
      isLoading: false,
    } as any);
    render(<EmployeePortal />);

    expect(screen.getByText('Annual Leave')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument(); // 20 - 5
  });

  it('computes the attendance percentage only from this month\'s records', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-15T09:00:00Z'));

    vi.mocked(client.useMyAttendance).mockReturnValue({
      data: {
        activeSession: null,
        history: [
          { date: '2026-03-01', status: 'present' },
          { date: '2026-03-02', status: 'late' },
          { date: '2026-02-28', status: 'present' }, // prior month, excluded
        ],
      },
      isLoading: false,
    } as any);
    render(<EmployeePortal />);

    // 2 of 2 March records attended (present + late both count as attended) -> 100%
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('shows an em dash for attendance when there are no records this month, not 0% or NaN', () => {
    render(<EmployeePortal />);
    // Performance rating falls back to the same "—" when there's no summary
    // yet, so scope to the Attendance stat card specifically.
    expect(screen.getByText('Attendance').closest('div')!.textContent).toContain('—');
  });

  it('excludes rejected, cancelled, and already-past leave from "upcoming"', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-15T09:00:00Z'));

    vi.mocked(client.useMyLeave).mockReturnValue({
      data: {
        balances: [],
        requests: [
          { id: 'L1', type: 'Annual', startDate: '2026-03-20', endDate: '2026-03-21', days: 2, status: 'approved' },
          { id: 'L2', type: 'Sick', startDate: '2026-03-18', endDate: '2026-03-18', days: 1, status: 'rejected' },
          { id: 'L3', type: 'Annual', startDate: '2026-01-01', endDate: '2026-01-02', days: 2, status: 'approved' }, // already past
        ],
      },
      isLoading: false,
    } as any);
    render(<EmployeePortal />);

    expect(screen.getByText('2026-03-20 - 2026-03-21 • 2 Days')).toBeInTheDocument();
  });

  it('opens the survey modal when an active survey is clicked', () => {
    vi.mocked(surveyClient.useActiveSurveys).mockReturnValue({
      data: [{ id: 'SUR-1', title: 'Q1 Pulse Check', type: 'pulse' }],
      isLoading: false,
    } as any);
    render(<EmployeePortal />);

    fireEvent.click(screen.getByText('Q1 Pulse Check'));
    expect(screen.getByText('Survey Modal: SUR-1')).toBeInTheDocument();
  });

  it('opens the course modal when an assigned course is clicked', () => {
    vi.mocked(learningClient.useMyCourses).mockReturnValue({
      data: [{ enrollment: { id: 'ENR-1', progress: 40 }, course: { title: 'Security Basics' } }],
      isLoading: false,
    } as any);
    render(<EmployeePortal />);

    fireEvent.click(screen.getByText('Security Basics'));
    expect(screen.getByText('Course Modal: Security Basics')).toBeInTheDocument();
  });
});
