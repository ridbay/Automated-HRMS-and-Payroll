import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SurveyModal } from '../features/admin/SurveyModal';
import * as surveyClient from '../api/survey.client';

const { mockCreateSurvey } = vi.hoisted(() => ({ mockCreateSurvey: vi.fn() }));

vi.mock('../api/survey.client', () => ({
  useCreateSurvey: vi.fn(() => ({ mutate: mockCreateSurvey, isPending: false })),
}));

describe('SurveyModal', () => {
  beforeEach(() => {
    mockCreateSurvey.mockClear();
  });

  it('renders nothing when closed', () => {
    const { container } = render(<SurveyModal isOpen={false} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('starts with a single blank question', () => {
    render(<SurveyModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Question 1')).toBeInTheDocument();
    expect(screen.queryByText('Question 2')).not.toBeInTheDocument();
  });

  it('adds and removes questions', () => {
    render(<SurveyModal isOpen={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('Add Question'));
    expect(screen.getByText('Question 2')).toBeInTheDocument();

    fireEvent.click(document.querySelectorAll('.lucide-trash-2')[0].closest('button')!);
    expect(screen.queryByText('Question 2')).not.toBeInTheDocument();
  });

  it('publishes the survey with title, type, status, and questions', () => {
    mockCreateSurvey.mockImplementation((_payload, { onSuccess }) => onSuccess());
    render(<SurveyModal isOpen={true} onClose={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('e.g. Q3 Employee Engagement'), { target: { value: 'Q1 Pulse Check' } });
    fireEvent.change(screen.getByPlaceholderText('What do you think about...'), { target: { value: 'How is morale?' } });
    fireEvent.change(screen.getByDisplayValue('Pulse Check'), { target: { value: 'eNPS' } });
    fireEvent.click(screen.getByText('Publish Survey'));

    expect(mockCreateSurvey).toHaveBeenCalledWith(
      {
        title: 'Q1 Pulse Check',
        description: '',
        type: 'eNPS',
        status: 'active',
        questions: [{ question: 'How is morale?', type: 'rating', options: [] }],
      },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });

  it('closes and resets the form on successful publish', () => {
    const onClose = vi.fn();
    mockCreateSurvey.mockImplementation((_payload, { onSuccess }) => onSuccess());
    render(<SurveyModal isOpen={true} onClose={onClose} />);

    fireEvent.change(screen.getByPlaceholderText('e.g. Q3 Employee Engagement'), { target: { value: 'Q1 Pulse Check' } });
    fireEvent.change(screen.getByPlaceholderText('What do you think about...'), { target: { value: 'How is morale?' } });
    fireEvent.click(screen.getByText('Publish Survey'));

    expect(onClose).toHaveBeenCalled();
  });

  it('closes via the X button', () => {
    const onClose = vi.fn();
    render(<SurveyModal isOpen={true} onClose={onClose} />);
    fireEvent.click(document.querySelector('.lucide-x')!.closest('button')!);
    expect(onClose).toHaveBeenCalled();
  });
});
