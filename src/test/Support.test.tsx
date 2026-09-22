import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Support from '../features/support/Support';
import * as client from '../api/client';

// Support wraps the create-ticket modal in framer-motion's AnimatePresence —
// see Payroll.test.tsx / Onboarding.test.tsx for why this needs stripping
// down in jsdom (exit transitions never resolve, leaving stale DOM behind).
vi.mock('framer-motion', () => {
  const stripMotionProps = ({
    initial, animate, exit, transition, whileHover, whileTap, layout, layoutId, variants, ...rest
  }: any) => rest;
  // Cached per tag so the same component type is reused across renders —
  // an uncached Proxy trap returns a brand-new forwardRef() on every access,
  // and React remounts (rather than updates) a subtree whose component type
  // changed identity, which silently invalidates any DOM node reference a
  // test captured before a re-render.
  const componentCache = new Map<string, any>();
  const motion = new Proxy(
    {},
    {
      get: (_target, tag: string) => {
        if (!componentCache.has(tag)) {
          componentCache.set(
            tag,
            React.forwardRef((props: any, ref: any) => React.createElement(tag, { ...stripMotionProps(props), ref }))
          );
        }
        return componentCache.get(tag);
      },
    }
  );
  return {
    motion,
    AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
  };
});

const mockUser: any = { id: 'emp-1', name: 'Sarah Connor', role: 'HR_ADMIN' };

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

const {
  mockCreateTicket, mockUpdateTicket, mockAddMessage,
} = vi.hoisted(() => ({
  mockCreateTicket: vi.fn(),
  mockUpdateTicket: vi.fn(),
  mockAddMessage: vi.fn(),
}));

vi.mock('../api/client', () => ({
  useSupportTickets: vi.fn(() => ({ data: [], isLoading: false })),
  useCreateSupportTicket: vi.fn(() => ({ mutate: mockCreateTicket, isPending: false })),
  useUpdateSupportTicket: vi.fn(() => ({ mutate: mockUpdateTicket, isPending: false })),
  useTicketMessages: vi.fn(() => ({ data: [] })),
  useAddTicketMessage: vi.fn(() => ({ mutate: mockAddMessage, isPending: false })),
}));

const ticket = (overrides: any = {}) => ({
  id: 'TKT-1',
  subject: 'VPN not connecting',
  description: 'Cannot connect to the office VPN since this morning.',
  category: 'IT',
  priority: 'High',
  status: 'Open',
  employeeName: 'Grace Hopper',
  employeeAvatar: '',
  createdAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('Support', () => {
  beforeEach(() => {
    mockCreateTicket.mockClear();
    mockUpdateTicket.mockClear();
    mockAddMessage.mockClear();
    mockUser.role = 'HR_ADMIN';
    vi.mocked(client.useSupportTickets).mockReturnValue({ data: [], isLoading: false } as any);
    vi.mocked(client.useTicketMessages).mockReturnValue({ data: [] } as any);
  });

  it('shows the empty state when there are no tickets', () => {
    render(<Support />);
    expect(screen.getByText('No tickets found')).toBeInTheDocument();
  });

  it('filters tickets by subject, category, or status (case-insensitively)', () => {
    vi.mocked(client.useSupportTickets).mockReturnValue({
      data: [ticket({ id: 'TKT-1', subject: 'VPN not connecting', category: 'IT' }), ticket({ id: 'TKT-2', subject: 'Payslip missing', category: 'Payroll' })],
      isLoading: false,
    } as any);

    render(<Support />);
    fireEvent.change(screen.getByPlaceholderText('Search tickets...'), { target: { value: 'payroll' } });

    expect(screen.queryByText('VPN not connecting')).not.toBeInTheDocument();
    expect(screen.getByText('Payslip missing')).toBeInTheDocument();
  });

  it('shows an editable status dropdown for an admin, and a read-only badge for an employee', () => {
    vi.mocked(client.useSupportTickets).mockReturnValue({ data: [ticket()], isLoading: false } as any);

    const { rerender } = render(<Support />);
    fireEvent.click(screen.getAllByText('VPN not connecting')[0]);
    expect(screen.getByRole('combobox')).toBeInTheDocument();

    // Ticket selection is preserved across the rerender (component state),
    // so this re-checks the same open detail panel under the new role.
    mockUser.role = 'EMPLOYEE';
    rerender(<Support />);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('updates ticket status as an admin, sending both the ticket id and new status', () => {
    vi.mocked(client.useSupportTickets).mockReturnValue({ data: [ticket()], isLoading: false } as any);

    render(<Support />);
    fireEvent.click(screen.getByText('VPN not connecting'));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'In Progress' } });

    expect(mockUpdateTicket).toHaveBeenCalledWith({ id: 'TKT-1', status: 'In Progress' });
  });

  it('hides the reply box once a ticket is Resolved', () => {
    vi.mocked(client.useSupportTickets).mockReturnValue({ data: [ticket({ status: 'Resolved' })], isLoading: false } as any);

    render(<Support />);
    fireEvent.click(screen.getByText('VPN not connecting'));

    expect(screen.queryByPlaceholderText('Type your reply...')).not.toBeInTheDocument();
    expect(screen.getByText(/marked as resolved and is now closed/)).toBeInTheDocument();
  });

  it('does not send a whitespace-only reply', () => {
    vi.mocked(client.useSupportTickets).mockReturnValue({ data: [ticket()], isLoading: false } as any);

    render(<Support />);
    fireEvent.click(screen.getByText('VPN not connecting'));
    fireEvent.change(screen.getByPlaceholderText('Type your reply...'), { target: { value: '   ' } });
    fireEvent.click(screen.getByPlaceholderText('Type your reply...').parentElement!.querySelector('button')!);

    expect(mockAddMessage).not.toHaveBeenCalled();
  });

  it('sends a reply and clears the input afterwards', () => {
    mockAddMessage.mockImplementation((_payload, { onSuccess }) => onSuccess());
    vi.mocked(client.useSupportTickets).mockReturnValue({ data: [ticket()], isLoading: false } as any);

    render(<Support />);
    fireEvent.click(screen.getByText('VPN not connecting'));
    const replyInput = screen.getByPlaceholderText('Type your reply...') as HTMLInputElement;
    fireEvent.change(replyInput, { target: { value: 'Looking into it now.' } });
    fireEvent.keyDown(replyInput, { key: 'Enter' });

    expect(mockAddMessage).toHaveBeenCalledWith(
      { ticketId: 'TKT-1', message: 'Looking into it now.' },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
    expect(replyInput.value).toBe('');
  });

  it('submits a new ticket with the form fields and closes the modal on success', async () => {
    mockCreateTicket.mockImplementation((_payload, { onSuccess }) => onSuccess());

    render(<Support />);
    fireEvent.click(screen.getByText('New Ticket'));

    fireEvent.change(screen.getByPlaceholderText('Briefly describe the issue'), { target: { value: 'Laptop broken' } });
    fireEvent.change(screen.getByPlaceholderText('Provide more details...'), { target: { value: 'Screen is cracked.' } });
    fireEvent.click(screen.getByText('Submit Ticket'));

    expect(mockCreateTicket).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'Laptop broken', description: 'Screen is cracked.', category: 'IT', priority: 'Low' }),
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
    await waitFor(() => expect(screen.queryByText('New Support Ticket')).not.toBeInTheDocument());
  });
});
