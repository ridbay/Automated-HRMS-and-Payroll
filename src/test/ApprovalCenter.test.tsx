import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ApprovalCenter from '../features/manager/components/ApprovalCenter';

const leaveRequest = (overrides: any = {}) => ({
  id: 'LR-1',
  name: 'Ada Lovelace',
  avatar: '',
  type: 'Annual Leave',
  range: 'Mar 1 - Mar 5',
  days: 5,
  reason: 'Family trip',
  impact: null,
  ...overrides,
});

describe('ApprovalCenter', () => {
  it('shows the pending count in the tab badge', () => {
    render(<ApprovalCenter approvals={{ leave: [leaveRequest(), leaveRequest({ id: 'LR-2' })] }} />);
    expect(screen.getByText('Pending (2)')).toBeInTheDocument();
  });

  it('shows an empty state when there is nothing pending', () => {
    render(<ApprovalCenter approvals={{ leave: [] }} />);
    expect(screen.getByText('Nothing pending')).toBeInTheDocument();
  });

  it('renders each leave request with its details', () => {
    render(<ApprovalCenter approvals={{ leave: [leaveRequest({ impact: 'Team will be short-staffed' })] }} />);

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('Mar 1 - Mar 5 • 5 Days')).toBeInTheDocument();
    expect(screen.getByText('Team will be short-staffed')).toBeInTheDocument();
  });

  it('does not render the Team Impact block when there is no impact note', () => {
    render(<ApprovalCenter approvals={{ leave: [leaveRequest()] }} />);
    expect(screen.queryByText('Team Impact')).not.toBeInTheDocument();
  });

  it('calls onLeaveAction with "approved" or "rejected" and the request id', () => {
    const onLeaveAction = vi.fn();
    render(<ApprovalCenter approvals={{ leave: [leaveRequest()] }} onLeaveAction={onLeaveAction} />);

    fireEvent.click(screen.getByText('Approve'));
    expect(onLeaveAction).toHaveBeenCalledWith('LR-1', 'approved');

    fireEvent.click(screen.getByText('Reject'));
    expect(onLeaveAction).toHaveBeenCalledWith('LR-1', 'rejected');
  });

  it('disables both action buttons while an action is pending', () => {
    render(<ApprovalCenter approvals={{ leave: [leaveRequest()] }} isLeaveActionPending />);
    expect(screen.getByText('Approve')).toBeDisabled();
    expect(screen.getByText('Reject')).toBeDisabled();
  });

  it('switches to the History tab, which always shows the static placeholder', () => {
    render(<ApprovalCenter approvals={{ leave: [leaveRequest()] }} />);
    fireEvent.click(screen.getByText('History'));

    expect(screen.getByText('No recent history')).toBeInTheDocument();
    expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument();
  });
});
