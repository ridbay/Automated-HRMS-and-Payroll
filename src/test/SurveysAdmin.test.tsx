import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SurveysAdmin from '../features/admin/SurveysAdmin';
import * as surveyClient from '../api/survey.client';

vi.mock('../features/admin/SurveyModal', () => ({
  SurveyModal: ({ isOpen }: any) => (isOpen ? React.createElement('div', null, 'Survey Modal Open') : null),
}));

const mockDeleteSurvey = vi.fn();

vi.mock('../api/survey.client', () => ({
  useAdminSurveys: vi.fn(() => ({ data: [], isLoading: false })),
  useDeleteSurvey: vi.fn(() => ({ mutate: mockDeleteSurvey, isPending: false })),
}));

const survey = (overrides: any = {}) => ({
  id: 'SRV-1',
  title: 'Q1 eNPS Pulse',
  description: 'How likely are you to recommend us?',
  type: 'eNPS',
  status: 'active',
  targetAudience: 'all',
  ...overrides,
});

describe('SurveysAdmin', () => {
  beforeEach(() => {
    mockDeleteSurvey.mockClear();
    vi.mocked(surveyClient.useAdminSurveys).mockReturnValue({ data: [], isLoading: false } as any);
    vi.spyOn(window, 'confirm');
  });

  it('shows a loading spinner while surveys load', () => {
    vi.mocked(surveyClient.useAdminSurveys).mockReturnValue({ data: [], isLoading: true } as any);
    render(<SurveysAdmin />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows the empty state when there are no surveys', () => {
    render(<SurveysAdmin />);
    expect(screen.getByText('No surveys created yet.')).toBeInTheDocument();
  });

  it('labels the target audience as "Everyone" for company-wide surveys and "Specific" otherwise', () => {
    vi.mocked(surveyClient.useAdminSurveys).mockReturnValue({
      data: [survey({ id: 'SRV-1', targetAudience: 'all' }), survey({ id: 'SRV-2', targetAudience: 'department', title: 'Eng Pulse' })],
      isLoading: false,
    } as any);

    render(<SurveysAdmin />);

    expect(screen.getByText('Everyone')).toBeInTheDocument();
    expect(screen.getByText('Specific')).toBeInTheDocument();
  });

  it('deletes a survey only once the confirm dialog is accepted', () => {
    vi.mocked(surveyClient.useAdminSurveys).mockReturnValue({ data: [survey()], isLoading: false } as any);
    vi.mocked(window.confirm).mockReturnValue(false);

    render(<SurveysAdmin />);
    const deleteButton = screen.getByText('Q1 eNPS Pulse').closest('div.group')!.querySelector('button')!;
    fireEvent.click(deleteButton);
    expect(mockDeleteSurvey).not.toHaveBeenCalled();

    vi.mocked(window.confirm).mockReturnValue(true);
    fireEvent.click(deleteButton);
    expect(mockDeleteSurvey).toHaveBeenCalledWith('SRV-1');
  });

  it('opens the New Survey modal', () => {
    render(<SurveysAdmin />);
    expect(screen.queryByText('Survey Modal Open')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('New Survey'));
    expect(screen.getByText('Survey Modal Open')).toBeInTheDocument();
  });
});
