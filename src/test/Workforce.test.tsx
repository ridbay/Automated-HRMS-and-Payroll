import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import Workforce from '../features/admin/Workforce';
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

vi.mock('../features/admin/EmployeeDetail', () => ({
  default: ({ employee, onBack }: any) => (
    <div>
      <p>Employee Detail: {employee.name}</p>
      <button onClick={onBack}>Back</button>
    </div>
  ),
}));

const mockAlert = vi.fn().mockResolvedValue(undefined);
const mockConfirm = vi.fn().mockResolvedValue(true);
vi.mock('../components/PopupProvider', () => ({
  usePopup: () => ({ alert: mockAlert, confirm: mockConfirm, prompt: vi.fn() }),
}));

const { mockCreateEmployee, mockUpdateEmployee, mockDeleteEmployee } = vi.hoisted(() => ({
  mockCreateEmployee: vi.fn(),
  mockUpdateEmployee: vi.fn(),
  mockDeleteEmployee: vi.fn(),
}));

vi.mock('../api/client', () => ({
  useEmployees: vi.fn(() => ({ data: [] })),
  useCreateEmployee: vi.fn(() => ({ mutate: mockCreateEmployee, mutateAsync: mockCreateEmployee, isPending: false })),
  useDeleteAdminEmployee: vi.fn(() => ({ mutate: mockDeleteEmployee, mutateAsync: mockDeleteEmployee })),
  useUpdateAdminEmployee: vi.fn(() => ({ mutate: mockUpdateEmployee, mutateAsync: mockUpdateEmployee, isPending: false })),
  useDepartments: vi.fn(() => ({ data: [] })),
  useRoles: vi.fn(() => ({ data: [] })),
}));

const employee = (overrides: any = {}) => ({
  id: 'EMP-1', name: 'Grace', lastName: 'Hopper', email: 'grace@example.com', role: 'Software Engineer', department: 'Engineering',
  status: 'active', hireDate: '2024-01-15', managerName: 'Ada Lovelace', location: 'Lagos Hub', avatar: null, salary: 150000,
  ...overrides,
});

describe('Workforce (admin)', () => {
  beforeEach(() => {
    mockAlert.mockClear();
    mockConfirm.mockClear();
    mockConfirm.mockResolvedValue(true);
    mockCreateEmployee.mockClear();
    mockUpdateEmployee.mockClear();
    mockDeleteEmployee.mockClear();
    vi.mocked(client.useEmployees).mockReturnValue({ data: [] } as any);
    vi.mocked(client.useDepartments).mockReturnValue({ data: [{ id: 'D-1', name: 'Engineering' }, { id: 'D-2', name: 'Sales' }] } as any);
    vi.mocked(client.useRoles).mockReturnValue({ data: [] } as any);
  });

  it('filters the employee grid by name or id, case-insensitively', () => {
    vi.mocked(client.useEmployees).mockReturnValue({
      data: [employee(), employee({ id: 'EMP-2', name: 'Bob', lastName: 'Marley' })],
    } as any);
    render(<Workforce />);

    fireEvent.change(screen.getByPlaceholderText(/Search by name, ID/), { target: { value: 'grace' } });
    expect(screen.getByText('Grace')).toBeInTheDocument();
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
  });

  it('switches between Gallery, Roster, and Org Map views', () => {
    vi.mocked(client.useEmployees).mockReturnValue({ data: [employee()], isLoading: false } as any);
    render(<Workforce />);

    // Gallery (grid) is default: shows the card's "Profile" button
    expect(screen.getByText('Profile')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Roster'));
    expect(screen.getByText('Employee Info')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Org Map'));
    expect(screen.getByText('Grace Hopper')).toBeInTheDocument();
  });

  it('shows "No employees available to map" for an empty org chart', () => {
    render(<Workforce />);
    fireEvent.click(screen.getByText('Org Map'));
    expect(screen.getByText('No employees available to map.')).toBeInTheDocument();
  });

  describe('Selection and bulk actions', () => {
    it('selects an employee via the grid card and shows the floating bulk bar', () => {
      vi.mocked(client.useEmployees).mockReturnValue({ data: [employee()], isLoading: false } as any);
      render(<Workforce />);

      fireEvent.click(screen.getByText('Grace').closest('.cursor-pointer')!);
      expect(screen.getByText('1 Members Selected')).toBeInTheDocument();
    });

    it('deletes the selected employees after confirmation via the bulk bar', async () => {
      vi.mocked(client.useEmployees).mockReturnValue({
        data: [employee(), employee({ id: 'EMP-2', name: 'Bob', lastName: 'Marley' })],
      } as any);
      mockDeleteEmployee.mockResolvedValue(undefined);
      render(<Workforce />);

      fireEvent.click(screen.getByText('Grace').closest('.cursor-pointer')!);
      fireEvent.click(screen.getByText('Bob').closest('.cursor-pointer')!);
      fireEvent.click(screen.getByText('Delete'));

      await vi.waitFor(() => expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to delete 2 employees?'));
      await vi.waitFor(() => expect(mockDeleteEmployee).toHaveBeenCalledTimes(2));
    });
  });

  describe('Roster row actions', () => {
    const openRoster = () => {
      render(<Workforce />);
      fireEvent.click(screen.getByText('Roster'));
    };

    it('opens the employee profile detail view', () => {
      vi.mocked(client.useEmployees).mockReturnValue({ data: [employee()], isLoading: false } as any);
      openRoster();

      fireEvent.click(document.querySelector('.lucide-eye')!.closest('button')!);
      expect(screen.getByText('Employee Detail: Grace')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Back'));
      expect(screen.getByText('Employee Info')).toBeInTheDocument();
    });

    it('asks for confirmation before deleting a single employee, skipping when declined', async () => {
      vi.mocked(client.useEmployees).mockReturnValue({ data: [employee()], isLoading: false } as any);
      mockConfirm.mockResolvedValueOnce(false);
      openRoster();

      fireEvent.click(document.querySelector('.lucide-trash')!.closest('button')!);
      await vi.waitFor(() => expect(mockConfirm).toHaveBeenCalled());
      expect(mockDeleteEmployee).not.toHaveBeenCalled();
    });

    it('deletes the employee once confirmed', async () => {
      vi.mocked(client.useEmployees).mockReturnValue({ data: [employee()], isLoading: false } as any);
      openRoster();

      fireEvent.click(document.querySelector('.lucide-trash')!.closest('button')!);
      await vi.waitFor(() => expect(mockDeleteEmployee).toHaveBeenCalledWith('EMP-1'));
    });

    it('opens the hiring wizard pre-filled for editing an existing employee', () => {
      vi.mocked(client.useEmployees).mockReturnValue({ data: [employee()], isLoading: false } as any);
      openRoster();

      fireEvent.click(document.querySelector('.lucide-settings-2')!.closest('button')!);
      expect(screen.getByDisplayValue('Grace')).toBeInTheDocument();
      expect(screen.getByText('Onboard New Talent')).toBeInTheDocument();
    });
  });

  describe('Filters sidebar', () => {
    it('filters by department and can be reset', () => {
      vi.mocked(client.useEmployees).mockReturnValue({
        data: [employee(), employee({ id: 'EMP-2', name: 'Bob', lastName: 'Marley', department: 'Sales' })],
      } as any);
      render(<Workforce />);
      fireEvent.click(screen.getByText('Filters'));

      fireEvent.click(screen.getByRole('button', { name: 'Sales' }));
      fireEvent.click(screen.getByText('Apply Filters'));

      expect(screen.queryByText('Grace')).not.toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Filters'));
      fireEvent.click(screen.getByText('Reset All'));
      fireEvent.click(screen.getByText('Apply Filters'));

      expect(screen.getByText('Grace')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  describe('Onboarding wizard', () => {
    const openWizard = () => {
      render(<Workforce />);
      fireEvent.click(screen.getByText('Add Employee'));
    };

    it('blocks advancing past step 1 without name and email', () => {
      openWizard();
      fireEvent.click(screen.getByText('Next: Continue'));

      expect(mockAlert).toHaveBeenCalledWith('Please provide Name and Email to continue.');
      expect(screen.getByText('First Name is required')).toBeInTheDocument();
    });

    it('blocks advancing past step 2 without a job title', () => {
      openWizard();
      fireEvent.change(screen.getByPlaceholderText('John'), { target: { value: 'Grace' } });
      fireEvent.change(screen.getByPlaceholderText('john.doe@gmail.com'), { target: { value: 'grace@example.com' } });
      fireEvent.click(screen.getByText('Next: Continue'));

      fireEvent.change(screen.getByPlaceholderText('e.g. Senior Backend Dev'), { target: { value: '' } });
      fireEvent.click(screen.getByText('Next: Continue'));

      expect(mockAlert).toHaveBeenCalledWith('Please provide Role and Department to continue.');
    });

    it('walks through all 4 steps and creates the employee on confirmation', () => {
      mockCreateEmployee.mockImplementation((_payload, { onSuccess }) => onSuccess({}));
      openWizard();

      // Step 1
      fireEvent.change(screen.getByPlaceholderText('John'), { target: { value: 'Grace' } });
      fireEvent.change(screen.getByPlaceholderText('john.doe@gmail.com'), { target: { value: 'grace@example.com' } });
      fireEvent.click(screen.getByText('Next: Continue'));

      // Step 2 (role/department already have sensible defaults)
      fireEvent.change(screen.getByText('Select department...').closest('select')!, { target: { value: 'D-1' } });
      fireEvent.click(screen.getByText('Next: Continue'));

      // Step 3 (salary defaults to 120000)
      fireEvent.click(screen.getByText('Next: Finalize'));

      // Step 4: review & confirm
      expect(screen.getByText('Final Review & Sign-off')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Confirm & Create Employee'));

      expect(mockCreateEmployee).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Grace', email: 'grace@example.com', status: 'onboarding' }),
        expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
      );
      expect(screen.queryByText('Onboard New Talent')).not.toBeInTheDocument();
    });

    it('shows the temporary password modal after creating a brand-new employee', () => {
      mockCreateEmployee.mockImplementation((_payload, { onSuccess }) => onSuccess({ temporaryPassword: 'Xy9!aBcD' }));
      openWizard();
      fireEvent.change(screen.getByPlaceholderText('John'), { target: { value: 'Grace' } });
      fireEvent.change(screen.getByPlaceholderText('john.doe@gmail.com'), { target: { value: 'grace@example.com' } });
      fireEvent.click(screen.getByText('Next: Continue'));
      fireEvent.change(screen.getByText('Select department...').closest('select')!, { target: { value: 'D-1' } });
      fireEvent.click(screen.getByText('Next: Continue'));
      fireEvent.click(screen.getByText('Next: Finalize'));
      fireEvent.click(screen.getByText('Confirm & Create Employee'));

      expect(screen.getByText('Employee Created!')).toBeInTheDocument();
      expect(screen.getByText('Xy9!aBcD')).toBeInTheDocument();
    });

    it('surfaces a create failure via popup instead of throwing', () => {
      mockCreateEmployee.mockImplementation((_payload, { onError }) => onError({ message: 'Email already in use' }));
      openWizard();
      fireEvent.change(screen.getByPlaceholderText('John'), { target: { value: 'Grace' } });
      fireEvent.change(screen.getByPlaceholderText('john.doe@gmail.com'), { target: { value: 'grace@example.com' } });
      fireEvent.click(screen.getByText('Next: Continue'));
      fireEvent.change(screen.getByText('Select department...').closest('select')!, { target: { value: 'D-1' } });
      fireEvent.click(screen.getByText('Next: Continue'));
      fireEvent.click(screen.getByText('Next: Finalize'));
      fireEvent.click(screen.getByText('Confirm & Create Employee'));

      expect(mockAlert).toHaveBeenCalledWith('Email already in use');
    });

    it('requires name, last name, and email before saving a draft', () => {
      openWizard();
      fireEvent.click(screen.getByText('Save Draft'));

      expect(mockAlert).toHaveBeenCalledWith('Please fill in Name, Last Name, and Email to save a draft.');
      expect(mockCreateEmployee).not.toHaveBeenCalled();
    });

    it('saves a draft with status "draft" once required fields are present', () => {
      mockCreateEmployee.mockImplementation((_payload, { onSuccess }) => onSuccess({}));
      openWizard();
      fireEvent.change(screen.getByPlaceholderText('John'), { target: { value: 'Grace' } });
      fireEvent.change(screen.getByPlaceholderText('Doe'), { target: { value: 'Hopper' } });
      fireEvent.change(screen.getByPlaceholderText('john.doe@gmail.com'), { target: { value: 'grace@example.com' } });
      fireEvent.click(screen.getByText('Save Draft'));

      expect(mockCreateEmployee).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'draft' }),
        expect.objectContaining({ onSuccess: expect.any(Function) })
      );
      expect(mockAlert).toHaveBeenCalledWith('Draft saved successfully.');
    });

    it('updates the existing employee (not create) when editing', () => {
      mockUpdateEmployee.mockImplementation((_payload, { onSuccess }) => onSuccess({}));
      vi.mocked(client.useEmployees).mockReturnValue({ data: [employee()], isLoading: false } as any);
      render(<Workforce />);
      fireEvent.click(screen.getByText('Roster'));
      fireEvent.click(document.querySelector('.lucide-settings-2')!.closest('button')!);

      fireEvent.click(screen.getByText('Next: Continue'));
      fireEvent.click(screen.getByText('Next: Continue'));
      fireEvent.click(screen.getByText('Next: Finalize'));
      fireEvent.click(screen.getByText('Confirm & Update Employee'));

      expect(mockUpdateEmployee).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'EMP-1', data: expect.objectContaining({ status: 'onboarding' }) }),
        expect.objectContaining({ onSuccess: expect.any(Function) })
      );
      expect(mockCreateEmployee).not.toHaveBeenCalled();
    });
  });
});
