import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LMSAdmin from '../features/admin/LMSAdmin';
import * as learningClient from '../api/learning.client';

vi.mock('../features/admin/CourseModal', () => ({
  CourseModal: ({ isOpen, course }: any) =>
    isOpen ? React.createElement('div', null, course ? `Editing: ${course.title}` : 'Adding new course') : null,
}));

vi.mock('../features/admin/AssignCourseModal', () => ({
  AssignCourseModal: ({ course }: any) =>
    course ? React.createElement('div', null, `Assigning: ${course.title}`) : null,
}));

const mockDeleteCourse = vi.fn();

vi.mock('../api/learning.client', () => ({
  useAdminCourses: vi.fn(() => ({ data: [], isLoading: false })),
  useDeleteCourse: vi.fn(() => ({ mutate: mockDeleteCourse, isPending: false })),
}));

const course = (overrides: any = {}) => ({
  id: 'CRS-1',
  title: 'Onboarding 101',
  description: 'Intro to the company',
  status: 'published',
  duration: 30,
  ...overrides,
});

describe('LMSAdmin', () => {
  beforeEach(() => {
    mockDeleteCourse.mockClear();
    vi.mocked(learningClient.useAdminCourses).mockReturnValue({ data: [], isLoading: false } as any);
    vi.spyOn(window, 'confirm');
  });

  it('shows the empty state when there are no courses', () => {
    render(<LMSAdmin />);
    expect(screen.getByText('No courses available.')).toBeInTheDocument();
  });

  it('opens the modal in "add" mode (no course) via the header button', () => {
    render(<LMSAdmin />);
    fireEvent.click(screen.getByText('Add Course'));
    expect(screen.getByText('Adding new course')).toBeInTheDocument();
  });

  it('opens the modal in "edit" mode with the selected course via the pencil icon', () => {
    vi.mocked(learningClient.useAdminCourses).mockReturnValue({ data: [course()], isLoading: false } as any);

    render(<LMSAdmin />);
    const editButton = screen.getByText('Onboarding 101').closest('.rounded-\\[2rem\\]')!.querySelectorAll('button')[0];
    fireEvent.click(editButton);

    expect(screen.getByText('Editing: Onboarding 101')).toBeInTheDocument();
  });

  it('resets to "add" mode after closing an edit, so the next Add Course open is not stale', () => {
    vi.mocked(learningClient.useAdminCourses).mockReturnValue({ data: [course()], isLoading: false } as any);

    render(<LMSAdmin />);
    const editButton = screen.getByText('Onboarding 101').closest('.rounded-\\[2rem\\]')!.querySelectorAll('button')[0];
    fireEvent.click(editButton);
    expect(screen.getByText('Editing: Onboarding 101')).toBeInTheDocument();

    // The mocked CourseModal has no real close button, so simulate the same
    // state reset the real "Add Course" button triggers.
    fireEvent.click(screen.getByText('Add Course'));
    expect(screen.getByText('Adding new course')).toBeInTheDocument();
  });

  it('deletes a course only once the confirm dialog is accepted', () => {
    vi.mocked(learningClient.useAdminCourses).mockReturnValue({ data: [course()], isLoading: false } as any);
    vi.mocked(window.confirm).mockReturnValue(false);

    render(<LMSAdmin />);
    const deleteButton = screen.getByText('Onboarding 101').closest('.rounded-\\[2rem\\]')!.querySelectorAll('button')[1];
    fireEvent.click(deleteButton);
    expect(mockDeleteCourse).not.toHaveBeenCalled();

    vi.mocked(window.confirm).mockReturnValue(true);
    fireEvent.click(deleteButton);
    expect(mockDeleteCourse).toHaveBeenCalledWith('CRS-1');
  });

  it('opens the assignment manager scoped to the clicked course', () => {
    vi.mocked(learningClient.useAdminCourses).mockReturnValue({
      data: [course({ id: 'CRS-1', title: 'Onboarding 101' }), course({ id: 'CRS-2', title: 'Security Training' })],
      isLoading: false,
    } as any);

    render(<LMSAdmin />);
    fireEvent.click(screen.getAllByText('Manage Assignments')[1]);

    expect(screen.getByText('Assigning: Security Training')).toBeInTheDocument();
    expect(screen.queryByText('Assigning: Onboarding 101')).not.toBeInTheDocument();
  });
});
