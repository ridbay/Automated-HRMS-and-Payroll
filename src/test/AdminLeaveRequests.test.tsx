import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminLeaveRequests from '../features/admin/AdminLeaveRequests';
import * as client from '../api/client';

const mockMutate = vi.fn();

vi.mock('../api/client', () => ({
  useAdminLeaveRequests: vi.fn(() => ({ data: [], isLoading: false })),
  useUpdateLeaveRequest: vi.fn(() => ({ mutate: mockMutate, isPending: false })),
}));

const REQUESTS = [
  { id: 'LR-1', employeeId: 'EMP-1', type: 'Annual Leave', startDate: '2026-03-01', endDate: '2026-03-05', days: 5, status: 'pending', reason: 'Family trip' },
  { id: 'LR-2', employeeId: 'EMP-2', type: 'Sick Leave', startDate: '2026-03-10', endDate: '2026-03-11', days: 2, status: 'approved', reason: '', managerComment: 'Get well soon' },
];

describe('AdminLeaveRequests', () => {
  beforeEach(() => {
    mockMutate.mockClear();
    vi.mocked(client.useAdminLeaveRequests).mockReturnValue({ data: REQUESTS, isLoading: false } as any);
    vi.mocked(client.useUpdateLeaveRequest).mockReturnValue({ mutate: mockMutate, isPending: false } as any);
  });

  it('shows a loading spinner instead of the table while requests are loading', () => {
    vi.mocked(client.useAdminLeaveRequests).mockReturnValue({ data: [], isLoading: true } as any);

    const { container } = render(<AdminLeaveRequests />);

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByText('Leave Approvals')).not.toBeInTheDocument();
  });

  it('lists all requests with a status badge each', () => {
    render(<AdminLeaveRequests />);

    expect(screen.getByText('LR-1')).toBeInTheDocument();
    expect(screen.getByText('LR-2')).toBeInTheDocument();
    expect(screen.getByText('PENDING')).toBeInTheDocument();
    expect(screen.getByText('APPROVED')).toBeInTheDocument();
  });

  it('filters requests by id or type, case-insensitively', () => {
    render(<AdminLeaveRequests />);

    fireEvent.change(screen.getByPlaceholderText('Search requests...'), { target: { value: 'sick' } });

    expect(screen.queryByText('LR-1')).not.toBeInTheDocument();
    expect(screen.getByText('LR-2')).toBeInTheDocument();
  });

  it('shows an empty state when the search matches nothing', () => {
    render(<AdminLeaveRequests />);

    fireEvent.change(screen.getByPlaceholderText('Search requests...'), { target: { value: 'nonexistent' } });

    expect(screen.getByText('No leave requests found.')).toBeInTheDocument();
  });

  it('pre-fills the review modal with the request\'s requested days and existing manager comment', () => {
    render(<AdminLeaveRequests />);

    fireEvent.click(screen.getAllByText('Review')[1]); // LR-2

    expect(screen.getByText('Review Request LR-2')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2')).toBeInTheDocument(); // approvedDays defaults to req.days
    expect(screen.getByDisplayValue('Get well soon')).toBeInTheDocument();
  });

  it('closes the modal via Cancel without calling the mutation', () => {
    render(<AdminLeaveRequests />);

    fireEvent.click(screen.getAllByText('Review')[0]);
    expect(screen.getByText('Review Request LR-1')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancel'));

    expect(screen.queryByText('Review Request LR-1')).not.toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('approves with the requested days when the manager does not edit the duration', () => {
    render(<AdminLeaveRequests />);

    fireEvent.click(screen.getAllByText('Review')[0]); // LR-1, 5 days requested
    fireEvent.click(screen.getByText('Approve'));

    expect(mockMutate).toHaveBeenCalledWith(
      { id: 'LR-1', status: 'approved', days: 5, managerComment: '' },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });

  it('submits a manager-adjusted duration instead of the originally requested days', () => {
    render(<AdminLeaveRequests />);

    fireEvent.click(screen.getAllByText('Review')[0]); // LR-1, 5 days requested
    fireEvent.change(screen.getByDisplayValue('5'), { target: { value: '3' } });
    fireEvent.change(screen.getByPlaceholderText('Add a note about this decision...'), { target: { value: 'Partial approval only' } });
    fireEvent.click(screen.getByText('Approve'));

    expect(mockMutate).toHaveBeenCalledWith(
      { id: 'LR-1', status: 'approved', days: 3, managerComment: 'Partial approval only' },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });

  it('declines with status "rejected" via the Decline button', () => {
    render(<AdminLeaveRequests />);

    fireEvent.click(screen.getAllByText('Review')[0]);
    fireEvent.click(screen.getByText('Decline'));

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'LR-1', status: 'rejected' }),
      expect.anything()
    );
  });

  it('closes the modal once the mutation succeeds', () => {
    mockMutate.mockImplementation((_payload, { onSuccess }) => onSuccess());
    render(<AdminLeaveRequests />);

    fireEvent.click(screen.getAllByText('Review')[0]);
    fireEvent.click(screen.getByText('Approve'));

    expect(screen.queryByText('Review Request LR-1')).not.toBeInTheDocument();
  });
});
