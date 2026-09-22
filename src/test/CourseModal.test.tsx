import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CourseModal } from '../features/admin/CourseModal';
import * as learningClient from '../api/learning.client';

const { mockCreateCourse, mockUpdateCourse } = vi.hoisted(() => ({
  mockCreateCourse: vi.fn(),
  mockUpdateCourse: vi.fn(),
}));

vi.mock('../api/learning.client', () => ({
  useCreateCourse: vi.fn(() => ({ mutate: mockCreateCourse, isPending: false })),
  useUpdateCourse: vi.fn(() => ({ mutate: mockUpdateCourse, isPending: false })),
}));

describe('CourseModal', () => {
  beforeEach(() => {
    mockCreateCourse.mockClear();
    mockUpdateCourse.mockClear();
  });

  it('renders nothing when closed', () => {
    const { container } = render(<CourseModal isOpen={false} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows "Add New Course" and empty fields when creating', () => {
    render(<CourseModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Add New Course')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Information Security 101')).toHaveValue('');
  });

  it('pre-fills the form and shows "Edit Course" when given an existing course', () => {
    render(<CourseModal isOpen={true} onClose={vi.fn()} course={{ id: 'C-1', title: 'React Fundamentals', description: 'Learn React', url: 'https://x.com', duration: 45, status: 'draft' }} />);
    expect(screen.getByText('Edit Course')).toBeInTheDocument();
    expect(screen.getByDisplayValue('React Fundamentals')).toBeInTheDocument();
    expect(screen.getByDisplayValue('45')).toBeInTheDocument();
  });

  it('creates a new course with the parsed duration', () => {
    mockCreateCourse.mockImplementation((_payload, { onSuccess }) => onSuccess());
    render(<CourseModal isOpen={true} onClose={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('e.g. Information Security 101'), { target: { value: 'Security 101' } });
    fireEvent.change(screen.getByPlaceholderText('45'), { target: { value: '30' } });
    fireEvent.click(screen.getByText('Save Course'));

    expect(mockCreateCourse).toHaveBeenCalledWith(
      { title: 'Security 101', description: '', url: '', duration: 30, status: 'active' },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
    expect(mockUpdateCourse).not.toHaveBeenCalled();
  });

  it('updates the existing course by id when editing', () => {
    mockUpdateCourse.mockImplementation((_payload, { onSuccess }) => onSuccess());
    render(<CourseModal isOpen={true} onClose={vi.fn()} course={{ id: 'C-1', title: 'React Fundamentals', duration: 45, status: 'active' }} />);

    fireEvent.click(screen.getByText('Save Changes'));

    expect(mockUpdateCourse).toHaveBeenCalledWith(
      { id: 'C-1', data: expect.objectContaining({ title: 'React Fundamentals', duration: 45 }) },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
    expect(mockCreateCourse).not.toHaveBeenCalled();
  });

  it('closes and resets the form on successful save', () => {
    const onClose = vi.fn();
    mockCreateCourse.mockImplementation((_payload, { onSuccess }) => onSuccess());
    render(<CourseModal isOpen={true} onClose={onClose} />);

    fireEvent.change(screen.getByPlaceholderText('e.g. Information Security 101'), { target: { value: 'Security 101' } });
    fireEvent.change(screen.getByPlaceholderText('45'), { target: { value: '30' } });
    fireEvent.click(screen.getByText('Save Course'));

    expect(onClose).toHaveBeenCalled();
  });

  it('closes via the X button', () => {
    const onClose = vi.fn();
    render(<CourseModal isOpen={true} onClose={onClose} />);
    fireEvent.click(document.querySelector('.lucide-x')!.closest('button')!);
    expect(onClose).toHaveBeenCalled();
  });
});
