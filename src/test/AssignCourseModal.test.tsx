import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AssignCourseModal } from '../features/admin/AssignCourseModal';
import * as learningClient from '../api/learning.client';
import * as client from '../api/client';

const mockAlert = vi.fn().mockResolvedValue(undefined);
vi.mock('../components/PopupProvider', () => ({
  usePopup: () => ({ alert: mockAlert, confirm: vi.fn(), prompt: vi.fn() }),
}));

const { mockAssignCourse } = vi.hoisted(() => ({ mockAssignCourse: vi.fn() }));

vi.mock('../api/learning.client', () => ({
  useAssignCourse: vi.fn(() => ({ mutate: mockAssignCourse, isPending: false })),
  useCourseEnrollments: vi.fn(() => ({ data: [], isLoading: false })),
}));

vi.mock('../api/client', () => ({
  useDirectory: vi.fn(() => ({ data: [], isLoading: false })),
}));

const course = { id: 'C-1', title: 'React Fundamentals' };
const employees = [
  { id: 'EMP-1', name: 'Grace', lastName: 'Hopper', department: 'Engineering', email: 'grace@example.com' },
  { id: 'EMP-2', name: 'Bob', lastName: 'Marley', department: 'Sales', email: 'bob@example.com' },
];

describe('AssignCourseModal', () => {
  beforeEach(() => {
    mockAlert.mockClear();
    mockAssignCourse.mockClear();
    vi.mocked(client.useDirectory).mockReturnValue({ data: employees, isLoading: false } as any);
    vi.mocked(learningClient.useCourseEnrollments).mockReturnValue({ data: [], isLoading: false } as any);
  });

  it('renders nothing when there is no course', () => {
    const { container } = render(<AssignCourseModal course={null} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('lists candidate employees, excluding those already enrolled', () => {
    vi.mocked(learningClient.useCourseEnrollments).mockReturnValue({
      data: [{ enrollment: { id: 'ENR-1' }, employee: { id: 'EMP-1', name: 'Grace', lastName: 'Hopper' } }],
      isLoading: false,
    } as any);
    render(<AssignCourseModal course={course} onClose={vi.fn()} />);

    expect(screen.getByText('Already assigned (1)')).toBeInTheDocument();
    expect(screen.queryByText('Grace Hopper')).toBeInTheDocument(); // shown in the "already assigned" chip
    expect(screen.getByText('Bob Marley')).toBeInTheDocument();
  });

  it('filters the candidate list by search text', () => {
    render(<AssignCourseModal course={course} onClose={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('Search employees to assign...'), { target: { value: 'bob' } });

    expect(screen.getByText('Bob Marley')).toBeInTheDocument();
    expect(screen.queryByText('Grace Hopper')).not.toBeInTheDocument();
  });

  it('shows "No employees to assign" when the filtered list is empty', () => {
    render(<AssignCourseModal course={course} onClose={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('Search employees to assign...'), { target: { value: 'nonexistent' } });
    expect(screen.getByText('No employees to assign.')).toBeInTheDocument();
  });

  it('keeps the assign button disabled until at least one employee is checked', () => {
    render(<AssignCourseModal course={course} onClose={vi.fn()} />);
    const assignBtn = screen.getByText('Assign to Employees');
    expect(assignBtn).toBeDisabled();

    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    expect(screen.getByText('Assign to 1 Employee')).not.toBeDisabled();
  });

  it('assigns the course to the selected employees and shows a confirmation alert', () => {
    mockAssignCourse.mockImplementation((_payload, { onSuccess }) => onSuccess());
    render(<AssignCourseModal course={course} onClose={vi.fn()} />);

    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    fireEvent.click(screen.getByText('Assign to 1 Employee'));

    expect(mockAssignCourse).toHaveBeenCalledWith(
      { courseId: 'C-1', employeeIds: ['EMP-1'] },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
    expect(mockAlert).toHaveBeenCalledWith('Assigned "React Fundamentals" to 1 employee(s).', 'Assigned');
  });

  it('surfaces an assignment failure via alert', () => {
    mockAssignCourse.mockImplementation((_payload, { onError }) => onError({ message: 'Already enrolled' }));
    render(<AssignCourseModal course={course} onClose={vi.fn()} />);

    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    fireEvent.click(screen.getByText('Assign to 1 Employee'));
    expect(mockAlert).toHaveBeenCalledWith('Already enrolled', 'Error');
  });

  it('closes via the X button', () => {
    const onClose = vi.fn();
    render(<AssignCourseModal course={course} onClose={onClose} />);
    fireEvent.click(document.querySelector('.lucide-x')!.closest('button')!);
    expect(onClose).toHaveBeenCalled();
  });
});
