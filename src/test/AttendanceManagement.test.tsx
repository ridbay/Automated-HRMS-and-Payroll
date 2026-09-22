import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react';
import AttendanceManagement from '../features/admin/AttendanceManagement';
import * as client from '../api/client';

const mockUser: any = { id: 'admin-1', role: 'HR_ADMIN' };
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

const {
  mockCreateRecord, mockUpdateRecord, mockDeleteRecord,
  mockUpdateAdminOt, mockUpdateTeamOt, mockUpdatePolicy,
} = vi.hoisted(() => ({
  mockCreateRecord: vi.fn(),
  mockUpdateRecord: vi.fn(),
  mockDeleteRecord: vi.fn(),
  mockUpdateAdminOt: vi.fn(),
  mockUpdateTeamOt: vi.fn(),
  mockUpdatePolicy: vi.fn(),
}));

vi.mock('../api/client', () => ({
  useAdminAttendance: vi.fn(() => ({ data: [], isLoading: false })),
  useAdminAttendanceSummary: vi.fn(() => ({ data: undefined })),
  useMyTeamAttendanceToday: vi.fn(() => ({ data: [] })),
  useTeamPendingOvertime: vi.fn(() => ({ data: [] })),
  useUpdateTeamOvertimeStatus: vi.fn(() => ({ mutate: mockUpdateTeamOt, isPending: false })),
  useAdminOvertimeRequests: vi.fn(() => ({ data: [] })),
  useUpdateAdminOvertimeStatus: vi.fn(() => ({ mutate: mockUpdateAdminOt, isPending: false })),
  useCreateAttendanceRecord: vi.fn(() => ({ mutate: mockCreateRecord, isPending: false })),
  useUpdateAttendanceRecord: vi.fn(() => ({ mutate: mockUpdateRecord, isPending: false })),
  useDeleteAttendanceRecord: vi.fn(() => ({ mutate: mockDeleteRecord })),
  useAttendancePolicy: vi.fn(() => ({ data: undefined })),
  useUpdateAttendancePolicy: vi.fn(() => ({ mutate: mockUpdatePolicy, isPending: false })),
}));

const record = (overrides: any = {}) => ({
  id: 'ATT-1', employeeId: 'EMP-1', name: 'Grace', lastName: 'Hopper',
  date: '2026-03-10', clockIn: '2026-03-10T09:00:00', clockOut: '2026-03-10T17:00:00',
  status: 'present', workHours: 8, overtime: 0, department: 'Engineering', locationIn: 'Lagos HQ',
  ...overrides,
});

describe('AttendanceManagement (admin)', () => {
  beforeEach(() => {
    mockUser.role = 'HR_ADMIN';
    Object.values({
      mockCreateRecord, mockUpdateRecord, mockDeleteRecord,
      mockUpdateAdminOt, mockUpdateTeamOt, mockUpdatePolicy,
    }).forEach((m) => m.mockClear());
    vi.mocked(client.useAdminAttendance).mockReturnValue({ data: [], isLoading: false } as any);
    vi.mocked(client.useAdminAttendanceSummary).mockReturnValue({ data: undefined } as any);
    vi.mocked(client.useMyTeamAttendanceToday).mockReturnValue({ data: [] } as any);
    vi.mocked(client.useAdminOvertimeRequests).mockReturnValue({ data: [] } as any);
    vi.mocked(client.useTeamPendingOvertime).mockReturnValue({ data: [] } as any);
    vi.mocked(client.useAttendancePolicy).mockReturnValue({ data: undefined } as any);
  });

  describe('Today tab', () => {
    it('shows an em dash for every summary stat while no summary has loaded', () => {
      render(<AttendanceManagement />);
      expect(screen.getByText('Team').closest('div')!.textContent).toContain('—');
    });

    it('renders the live summary counts once loaded', () => {
      vi.mocked(client.useAdminAttendanceSummary).mockReturnValue({
        data: { totalEmployees: 50, present: 40, late: 5, absent: 5, onLeave: 2, avgWorkHours: 7.5 },
      } as any);
      render(<AttendanceManagement />);
      expect(screen.getByText('Present').closest('div')!.textContent).toContain('40');
      expect(screen.getByText('Avg Hours').closest('div')!.textContent).toContain('7.5h');
    });

    it('lists today\'s clocked-in records with formatted times', () => {
      vi.mocked(client.useAdminAttendance).mockReturnValue({ data: [record()], isLoading: false } as any);
      render(<AttendanceManagement />);
      expect(screen.getByText('Grace Hopper')).toBeInTheDocument();
    });

    it('shows the empty state when there is no activity at all today', () => {
      render(<AttendanceManagement />);
      expect(screen.getByText('No activity logged yet today.')).toBeInTheDocument();
    });

    it('does not show the manager-only "not clocked in" fallback rows for an admin', () => {
      vi.mocked(client.useMyTeamAttendanceToday).mockReturnValue({
        data: [{ employeeId: 'EMP-2', name: 'Ada', lastName: 'Lovelace', status: 'absent' }],
      } as any);
      render(<AttendanceManagement />);
      expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument();
    });

    it('shows not-clocked-in team members for a manager, but only the ones marked absent', () => {
      mockUser.role = 'MANAGER';
      vi.mocked(client.useMyTeamAttendanceToday).mockReturnValue({
        data: [
          { employeeId: 'EMP-2', name: 'Ada', lastName: 'Lovelace', status: 'absent' },
          { employeeId: 'EMP-3', name: 'Bob', lastName: 'Marley', status: 'present' },
        ],
      } as any);
      render(<AttendanceManagement />);
      expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
      expect(screen.queryByText('Bob Marley')).not.toBeInTheDocument();
    });
  });

  describe('Records tab', () => {
    const openRecordsTab = () => {
      render(<AttendanceManagement />);
      fireEvent.click(screen.getByText('Records'));
    };

    it('filters the record list by employee name', () => {
      vi.mocked(client.useAdminAttendance).mockReturnValue({
        data: [record(), record({ id: 'ATT-2', name: 'Bob', lastName: 'Marley', employeeId: 'EMP-2' })],
        isLoading: false,
      } as any);
      openRecordsTab();

      fireEvent.change(screen.getByPlaceholderText('Search employee...'), { target: { value: 'bob' } });

      expect(screen.getByText('Bob Marley')).toBeInTheDocument();
      expect(screen.queryByText('Grace Hopper')).not.toBeInTheDocument();
    });

    it('shows the Manual Entry action for an admin but not a manager', () => {
      openRecordsTab();
      expect(screen.getByText('Manual Entry')).toBeInTheDocument();

      cleanup();
      mockUser.role = 'MANAGER';
      openRecordsTab();
      expect(screen.queryByText('Manual Entry')).not.toBeInTheDocument();
    });

    it('creates a manual record, sending clockOut as null and clockIn as ISO when provided', () => {
      openRecordsTab();
      fireEvent.click(screen.getByText('Manual Entry'));

      fireEvent.change(screen.getByPlaceholderText('e.g. EMP-1234'), { target: { value: 'EMP-9' } });
      fireEvent.change(document.querySelector('input[type="datetime-local"]')!, { target: { value: '2026-03-10T09:00' } });
      fireEvent.click(screen.getByText('Save'));

      expect(mockCreateRecord).toHaveBeenCalledWith(
        expect.objectContaining({ employeeId: 'EMP-9', clockOut: null, clockIn: new Date('2026-03-10T09:00').toISOString() }),
        expect.objectContaining({ onSuccess: expect.any(Function) })
      );
    });

    it('disables Save on the create form until an employee id is entered', () => {
      openRecordsTab();
      fireEvent.click(screen.getByText('Manual Entry'));
      expect(screen.getByText('Save')).toBeDisabled();
    });

    it('opens the edit modal pre-filled and updates the existing record by id', () => {
      vi.mocked(client.useAdminAttendance).mockReturnValue({ data: [record()], isLoading: false } as any);
      openRecordsTab();

      fireEvent.click(document.querySelector('.lucide-pencil')!.closest('button')!);
      expect(screen.getByText('Edit Attendance Record')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('e.g. EMP-1234')).not.toBeInTheDocument();

      fireEvent.click(screen.getByText('Save'));
      expect(mockUpdateRecord).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'ATT-1' }),
        expect.objectContaining({ onSuccess: expect.any(Function) })
      );
    });

    it('asks for confirmation before deleting a record, and skips the delete when declined', () => {
      vi.mocked(client.useAdminAttendance).mockReturnValue({ data: [record()], isLoading: false } as any);
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      openRecordsTab();

      fireEvent.click(document.querySelector('.lucide-trash-2')!.closest('button')!);
      expect(confirmSpy).toHaveBeenCalled();
      expect(mockDeleteRecord).not.toHaveBeenCalled();
      confirmSpy.mockRestore();
    });

    it('deletes the record once confirmed', () => {
      vi.mocked(client.useAdminAttendance).mockReturnValue({ data: [record()], isLoading: false } as any);
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      openRecordsTab();

      fireEvent.click(document.querySelector('.lucide-trash-2')!.closest('button')!);
      expect(mockDeleteRecord).toHaveBeenCalledWith('ATT-1');
    });
  });

  describe('Overtime tab', () => {
    const openOvertimeTab = () => {
      render(<AttendanceManagement />);
      fireEvent.click(screen.getByText('Overtime'));
    };

    it('shows status filter buttons for an admin, defaulting to pending', () => {
      openOvertimeTab();
      expect(screen.getByText('pending')).toHaveClass('bg-indigo-600');
    });

    it('hides the status filter for a manager', () => {
      mockUser.role = 'MANAGER';
      openOvertimeTab();
      expect(screen.queryByText('pending')).not.toBeInTheDocument();
    });

    it('opens the review modal pre-filled with the request\'s hours and comment', () => {
      vi.mocked(client.useAdminOvertimeRequests).mockReturnValue({
        data: [{ id: 'OT-1', name: 'Grace', lastName: 'Hopper', date: '2026-03-10', startTime: '18:00', endTime: '20:00', hours: 2, reason: 'Release', status: 'pending', managerComment: '' }],
      } as any);
      openOvertimeTab();

      fireEvent.click(screen.getByText('Review'));
      expect(screen.getByText('Review Overtime Request')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2')).toBeInTheDocument();
    });

    it('approves via the admin mutation for an admin reviewer', () => {
      vi.mocked(client.useAdminOvertimeRequests).mockReturnValue({
        data: [{ id: 'OT-1', name: 'Grace', lastName: 'Hopper', date: '2026-03-10', startTime: '18:00', endTime: '20:00', hours: 2, reason: 'Release', status: 'pending' }],
      } as any);
      openOvertimeTab();
      fireEvent.click(screen.getByText('Review'));
      fireEvent.click(screen.getByText('Approve'));

      expect(mockUpdateAdminOt).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'OT-1', status: 'approved', hours: 2 }),
        expect.objectContaining({ onSuccess: expect.any(Function) })
      );
      expect(mockUpdateTeamOt).not.toHaveBeenCalled();
    });

    it('declines via the team mutation for a manager reviewer', () => {
      mockUser.role = 'MANAGER';
      vi.mocked(client.useTeamPendingOvertime).mockReturnValue({
        data: [{ id: 'OT-2', name: 'Bob', lastName: 'Marley', date: '2026-03-10', startTime: '18:00', endTime: '20:00', hours: 3, reason: 'Deploy', status: 'pending' }],
      } as any);
      openOvertimeTab();
      fireEvent.click(screen.getByText('Review'));
      fireEvent.click(screen.getByText('Decline'));

      expect(mockUpdateTeamOt).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'OT-2', status: 'rejected' }),
        expect.objectContaining({ onSuccess: expect.any(Function) })
      );
      expect(mockUpdateAdminOt).not.toHaveBeenCalled();
    });
  });

  describe('Policy tab', () => {
    it('is only offered to an admin', () => {
      render(<AttendanceManagement />);
      expect(screen.getByText('Policy')).toBeInTheDocument();

      cleanup();
      mockUser.role = 'MANAGER';
      render(<AttendanceManagement />);
      expect(screen.queryAllByText('Policy')).toHaveLength(0);
    });

    it('hydrates the form from the fetched policy and saves edits', () => {
      vi.mocked(client.useAttendancePolicy).mockReturnValue({
        data: { attendanceStartTime: '08:30', attendanceEndTime: '16:30', attendanceGraceMinutes: 10 },
      } as any);
      render(<AttendanceManagement />);
      fireEvent.click(screen.getByText('Policy'));

      const graceInput = screen.getByDisplayValue('10');
      fireEvent.change(graceInput, { target: { value: '20' } });
      fireEvent.click(screen.getByText('Save Policy'));

      expect(mockUpdatePolicy).toHaveBeenCalledWith({
        attendanceStartTime: '08:30', attendanceEndTime: '16:30', attendanceGraceMinutes: 20,
      });
    });
  });
});
