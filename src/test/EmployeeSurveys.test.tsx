import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EmployeeSurveys from '../features/employee/EmployeeSurveys';
import * as surveyClient from '../api/survey.client';

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

const { mockSubmitSurvey } = vi.hoisted(() => ({ mockSubmitSurvey: vi.fn() }));

vi.mock('../api/survey.client', () => ({
  useActiveSurveys: vi.fn(() => ({ data: [], isLoading: false })),
  useSurveyDetails: vi.fn(() => ({ data: undefined, isLoading: false })),
  useSubmitSurvey: vi.fn(() => ({ mutate: mockSubmitSurvey, isPending: false })),
}));

const survey = (overrides: any = {}) => ({
  id: 'SUR-1', title: 'Q1 Pulse Check', description: 'How are we doing?', hasResponded: false, questionCount: 2,
  ...overrides,
});

describe('EmployeeSurveys', () => {
  beforeEach(() => {
    mockSubmitSurvey.mockClear();
    vi.mocked(surveyClient.useActiveSurveys).mockReturnValue({ data: [], isLoading: false } as any);
    vi.mocked(surveyClient.useSurveyDetails).mockReturnValue({ data: undefined, isLoading: false } as any);
  });

  it('shows a loading spinner while surveys load', () => {
    vi.mocked(surveyClient.useActiveSurveys).mockReturnValue({ data: [], isLoading: true } as any);
    const { container } = render(<EmployeeSurveys />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows the empty state when there are no active surveys', () => {
    render(<EmployeeSurveys />);
    expect(screen.getByText('No active surveys')).toBeInTheDocument();
  });

  it('buckets surveys into pending and completed sections with accurate counts', () => {
    vi.mocked(surveyClient.useActiveSurveys).mockReturnValue({
      data: [survey(), survey({ id: 'SUR-2', title: 'Q4 eNPS', hasResponded: true })],
      isLoading: false,
    } as any);
    render(<EmployeeSurveys />);

    expect(screen.getByText('1 pending')).toBeInTheDocument();
    expect(screen.getByText('1 completed')).toBeInTheDocument();
    expect(screen.getByText('Awaiting Your Response')).toBeInTheDocument();
    expect(screen.getByText('Q1 Pulse Check')).toBeInTheDocument();
    expect(screen.getByText('Q4 eNPS')).toBeInTheDocument();
  });

  it('opens the TakeSurveyModal for the selected pending survey', () => {
    vi.mocked(surveyClient.useActiveSurveys).mockReturnValue({ data: [survey()], isLoading: false } as any);
    vi.mocked(surveyClient.useSurveyDetails).mockReturnValue({
      data: { id: 'SUR-1', title: 'Q1 Pulse Check', type: 'pulse', questions: [] },
      isLoading: false,
    } as any);
    render(<EmployeeSurveys />);

    fireEvent.click(screen.getByText('Take Survey'));
    expect(screen.getByText('Pulse Check')).toBeInTheDocument();
  });

  it('shows "Survey not found" if the details request comes back empty', () => {
    vi.mocked(surveyClient.useActiveSurveys).mockReturnValue({ data: [survey()], isLoading: false } as any);
    render(<EmployeeSurveys />);
    fireEvent.click(screen.getByText('Take Survey'));
    expect(screen.getByText('Survey not found.')).toBeInTheDocument();
  });

  it('disables submit until every question is answered, then submits formatted answers', () => {
    vi.mocked(surveyClient.useActiveSurveys).mockReturnValue({ data: [survey()], isLoading: false } as any);
    vi.mocked(surveyClient.useSurveyDetails).mockReturnValue({
      data: {
        id: 'SUR-1', title: 'Q1 Pulse Check', type: 'eNPS',
        questions: [
          { id: 'Q1', question: 'How likely are you to recommend us?', type: 'rating' },
          { id: 'Q2', question: 'Anything else?', type: 'text' },
        ],
      },
      isLoading: false,
    } as any);
    render(<EmployeeSurveys />);
    fireEvent.click(screen.getByText('Take Survey'));

    const submitBtn = screen.getByText('Submit Answers Anonymously');
    expect(submitBtn).toBeDisabled();

    fireEvent.click(screen.getByText('4', { selector: 'button' }));
    expect(submitBtn).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText('Type your answer here...'), { target: { value: 'Great culture' } });
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);
    expect(mockSubmitSurvey).toHaveBeenCalledWith(
      {
        surveyId: 'SUR-1',
        answers: expect.arrayContaining([
          { questionId: 'Q1', answer: '4' },
          { questionId: 'Q2', answer: 'Great culture' },
        ]),
      },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });

  it('closes the modal via its close button', () => {
    vi.mocked(surveyClient.useActiveSurveys).mockReturnValue({ data: [survey()], isLoading: false } as any);
    vi.mocked(surveyClient.useSurveyDetails).mockReturnValue({
      data: { id: 'SUR-1', title: 'Q1 Pulse Check', type: 'pulse', questions: [] },
      isLoading: false,
    } as any);
    render(<EmployeeSurveys />);
    fireEvent.click(screen.getByText('Take Survey'));
    expect(screen.getByText('Pulse Check')).toBeInTheDocument();

    fireEvent.click(document.querySelector('.lucide-x')!.closest('button')!);
    expect(screen.queryByText('Pulse Check')).not.toBeInTheDocument();
  });
});
