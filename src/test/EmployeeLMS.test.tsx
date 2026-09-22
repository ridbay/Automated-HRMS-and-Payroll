import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EmployeeLMS from '../features/employee/EmployeeLMS';
import * as learningClient from '../api/learning.client';

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

const { mockUpdateProgress } = vi.hoisted(() => ({ mockUpdateProgress: vi.fn() }));

vi.mock('../api/learning.client', () => ({
  useMyCourses: vi.fn(() => ({ data: [], isLoading: false })),
  useUpdateCourseProgress: vi.fn(() => ({ mutate: mockUpdateProgress, isPending: false })),
}));

const enrollment = (overrides: any = {}) => ({
  id: 'ENR-1',
  enrollment: { id: 'ENR-1', progress: 0, ...overrides.enrollment },
  course: { id: 'C-1', title: 'React Fundamentals', description: 'Learn the basics', duration: '45 min', url: null, ...overrides.course },
});

describe('EmployeeLMS', () => {
  beforeEach(() => {
    mockUpdateProgress.mockClear();
    vi.spyOn(window, 'open').mockImplementation(() => null);
    vi.mocked(learningClient.useMyCourses).mockReturnValue({ data: [], isLoading: false } as any);
  });

  it('shows a loading spinner while courses load', () => {
    vi.mocked(learningClient.useMyCourses).mockReturnValue({ data: [], isLoading: true } as any);
    const { container } = render(<EmployeeLMS />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows the empty state when no courses are assigned', () => {
    render(<EmployeeLMS />);
    expect(screen.getByText('No courses assigned')).toBeInTheDocument();
  });

  it('buckets courses into In Progress, Not Started, and Completed sections', () => {
    vi.mocked(learningClient.useMyCourses).mockReturnValue({
      data: [
        enrollment({ id: 'E1', enrollment: { id: 'E1', progress: 40 }, course: { title: 'In Progress Course' } }),
        enrollment({ id: 'E2', enrollment: { id: 'E2', progress: 0 }, course: { title: 'Not Started Course' } }),
        enrollment({ id: 'E3', enrollment: { id: 'E3', progress: 100 }, course: { title: 'Completed Course' } }),
      ],
      isLoading: false,
    } as any);
    render(<EmployeeLMS />);

    expect(screen.getByText('In Progress', { selector: 'h2' })).toBeInTheDocument();
    expect(screen.getByText('Not Started', { selector: 'h2' })).toBeInTheDocument();
    expect(screen.getByText('Completed', { selector: 'h2' })).toBeInTheDocument();
    expect(screen.getByText('In Progress Course')).toBeInTheDocument();
    expect(screen.getByText('Not Started Course')).toBeInTheDocument();
    expect(screen.getByText('Completed Course')).toBeInTheDocument();
  });

  it('shows accurate in-progress and completed counts in the header chips', () => {
    vi.mocked(learningClient.useMyCourses).mockReturnValue({
      data: [
        enrollment({ id: 'E1', enrollment: { id: 'E1', progress: 40 } }),
        enrollment({ id: 'E2', enrollment: { id: 'E2', progress: 100 }, course: { title: 'Done' } }),
      ],
      isLoading: false,
    } as any);
    render(<EmployeeLMS />);
    expect(screen.getByText('1 in progress')).toBeInTheDocument();
    expect(screen.getByText('1 completed')).toBeInTheDocument();
  });

  it('does not offer a Start/Continue button for completed courses', () => {
    vi.mocked(learningClient.useMyCourses).mockReturnValue({
      data: [enrollment({ enrollment: { id: 'ENR-1', progress: 100 } })],
      isLoading: false,
    } as any);
    render(<EmployeeLMS />);
    expect(screen.queryByText('Start')).not.toBeInTheDocument();
    expect(screen.queryByText('Continue')).not.toBeInTheDocument();
  });

  it('labels the action "Continue" once progress has started, "Start" otherwise', () => {
    vi.mocked(learningClient.useMyCourses).mockReturnValue({
      data: [enrollment({ enrollment: { id: 'ENR-1', progress: 30 } })],
      isLoading: false,
    } as any);
    render(<EmployeeLMS />);
    expect(screen.getByText('Continue')).toBeInTheDocument();
  });

  it('opens the TakeCourseModal with the selected enrollment', () => {
    vi.mocked(learningClient.useMyCourses).mockReturnValue({
      data: [enrollment({ enrollment: { id: 'ENR-1', progress: 0 }, course: { title: 'React Fundamentals' } })],
      isLoading: false,
    } as any);
    render(<EmployeeLMS />);

    fireEvent.click(screen.getByText('Start'));
    expect(screen.getByText('Course Description')).toBeInTheDocument();
    expect(screen.getAllByText('React Fundamentals').length).toBeGreaterThan(0);
  });

  it('marks the course as started (10%) when opening a not-yet-started course via the modal', () => {
    vi.mocked(learningClient.useMyCourses).mockReturnValue({
      data: [enrollment({ enrollment: { id: 'ENR-1', progress: 0 }, course: { url: 'https://learn.example.com/react' } })],
      isLoading: false,
    } as any);
    render(<EmployeeLMS />);
    fireEvent.click(screen.getByText('Start'));
    fireEvent.click(screen.getByText('Open Course Link'));

    expect(mockUpdateProgress).toHaveBeenCalledWith({ enrollmentId: 'ENR-1', progress: 10 });
  });

  it('marks the course complete via the modal', () => {
    vi.mocked(learningClient.useMyCourses).mockReturnValue({
      data: [enrollment({ enrollment: { id: 'ENR-1', progress: 40 } })],
      isLoading: false,
    } as any);
    render(<EmployeeLMS />);
    fireEvent.click(screen.getByText('Continue'));
    fireEvent.click(screen.getByText('Mark as Completed'));

    expect(mockUpdateProgress).toHaveBeenCalledWith(
      { enrollmentId: 'ENR-1', progress: 100 },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });

  it('closes the modal via its close button', () => {
    vi.mocked(learningClient.useMyCourses).mockReturnValue({
      data: [enrollment({ enrollment: { id: 'ENR-1', progress: 0 } })],
      isLoading: false,
    } as any);
    render(<EmployeeLMS />);
    fireEvent.click(screen.getByText('Start'));
    expect(screen.getByText('Course Description')).toBeInTheDocument();

    fireEvent.click(document.querySelector('.lucide-x')!.closest('button')!);
    expect(screen.queryByText('Course Description')).not.toBeInTheDocument();
  });
});
