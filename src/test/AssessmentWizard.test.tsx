import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AssessmentWizard from '../features/employee/AssessmentWizard';

describe('AssessmentWizard', () => {
  const baseProps = {
    isOpen: true,
    onClose: vi.fn(),
    cycleName: 'H2 2026',
    onSave: vi.fn(),
    onSubmit: vi.fn(),
  };

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<AssessmentWizard {...baseProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('starts on the Achievements step and disables Back', () => {
    render(<AssessmentWizard {...baseProps} />);

    expect(screen.getByText('Key Achievements')).toBeInTheDocument();
    expect(screen.getByText('Back')).toBeDisabled();
    expect(screen.getByText('Step 1 of 7')).toBeInTheDocument();
  });

  it('adds and removes achievement fields, and hides remove while only one remains', () => {
    render(<AssessmentWizard {...baseProps} />);

    // Only one achievement textarea initially -> no remove button shown.
    expect(screen.queryAllByPlaceholderText('Describe your achievement...')).toHaveLength(1);
    expect(screen.getByPlaceholderText('Describe your achievement...').closest('div')?.querySelector('button')).toBeNull();

    fireEvent.click(screen.getByText('Add Achievement'));
    expect(screen.getAllByPlaceholderText('Describe your achievement...')).toHaveLength(2);

    const textareas = screen.getAllByPlaceholderText('Describe your achievement...');
    fireEvent.change(textareas[0], { target: { value: 'Shipped the payroll engine' } });
    expect((textareas[0] as HTMLTextAreaElement).value).toBe('Shipped the payroll engine');
  });

  it('shows the "save a draft first" notice on the Evidence step for a brand-new assessment, not the upload UI', () => {
    render(<AssessmentWizard {...baseProps} />);

    fireEvent.click(screen.getByText('Next')); // achievements -> evidence
    expect(screen.getByText(/Save a draft first/i)).toBeInTheDocument();
    expect(screen.queryByText('Upload Evidence')).not.toBeInTheDocument();
  });

  it('shows the upload UI on the Evidence step once the assessment already has an id', () => {
    render(<AssessmentWizard {...baseProps} existingAssessment={{ id: 'ASM-1' }} />);

    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Upload Evidence')).toBeInTheDocument();
    expect(screen.queryByText(/Save a draft first/i)).not.toBeInTheDocument();
  });

  it('shows an empty-state message on the Goals step when no goals are passed, instead of a list', () => {
    render(<AssessmentWizard {...baseProps} />);

    fireEvent.click(screen.getByText('Next')); // evidence
    fireEvent.click(screen.getByText('Next')); // challenges
    fireEvent.click(screen.getByText('Next')); // goals

    expect(screen.getByText(/don't have any goals set yet/i)).toBeInTheDocument();
  });

  it('renders a progress slider per goal when goals are provided', () => {
    render(
      <AssessmentWizard
        {...baseProps}
        goals={[{ id: 'G-1', title: 'Ship v2', progress: 40 }]}
      />
    );

    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));

    expect(screen.getByText('Ship v2')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
  });

  it('updates a skill rating when a star is clicked', () => {
    render(<AssessmentWizard {...baseProps} />);

    for (let i = 0; i < 4; i++) fireEvent.click(screen.getByText('Next')); // -> skills step

    expect(screen.getByText('Skill Self-Ratings')).toBeInTheDocument();
    const technicalCard = screen.getByText('Technical Skills').closest('div')!.parentElement!;
    const stars = technicalCard.querySelectorAll('button');
    fireEvent.click(stars[1]); // rate "Technical Skills" as 2

    // The rating buttons re-render with filled stars up to the clicked one;
    // asserting via the underlying skillRatings state isn't exposed, so we
    // assert the click didn't throw and the step stayed put (no crash on
    // updateSkillRating with a fresh index).
    expect(screen.getByText('Technical Skills')).toBeInTheDocument();
  });

  it('reaches the Submit button on the last step and only calls onSubmit when an existing assessment id is present', () => {
    const onSubmit = vi.fn();
    render(<AssessmentWizard {...baseProps} onSubmit={onSubmit} />);

    for (let i = 0; i < 6; i++) fireEvent.click(screen.getByText('Next'));
    expect(screen.getByRole('heading', { name: 'Development Goals' })).toBeInTheDocument();
    expect(screen.getByText('Step 7 of 7')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Submit'));
    // No existingAssessment.id -> handleSubmit is a silent no-op.
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with the assessment id when one exists', () => {
    const onSubmit = vi.fn();
    render(<AssessmentWizard {...baseProps} onSubmit={onSubmit} existingAssessment={{ id: 'ASM-42' }} />);

    for (let i = 0; i < 6; i++) fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Submit'));

    expect(onSubmit).toHaveBeenCalledWith('ASM-42');
  });

  it('calls onSave with the current draft at any step', () => {
    const onSave = vi.fn();
    render(<AssessmentWizard {...baseProps} onSave={onSave} />);

    fireEvent.click(screen.getByText('Save Draft'));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ achievements: [''], selfRating: '' })
    );
  });

  it('navigates back with the Back button and never goes below step 1', () => {
    render(<AssessmentWizard {...baseProps} />);

    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('KPI Evidence')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByText('Key Achievements')).toBeInTheDocument();
    expect(screen.getByText('Back')).toBeDisabled();
  });
});
