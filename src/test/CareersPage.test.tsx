import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CareersPage from '../features/public/CareersPage';
import * as client from '../api/client';

vi.mock('../api/client', () => ({
  usePublicCareers: vi.fn(() => ({ data: undefined, isLoading: false, error: null })),
  usePublicPosition: vi.fn(() => ({ data: undefined, isLoading: false })),
  useSubmitPublicApplication: vi.fn(() => ({ mutate: vi.fn(), isPending: false, isSuccess: false })),
  resolveCompanyLogoUrl: vi.fn(() => null),
}));

const company = { id: 'comp-1', name: 'ZenHR Inc', logoUrl: null, primaryColor: '#4F46E5' };

describe('CareersPage (public, unauthenticated)', () => {
  beforeEach(() => {
    vi.mocked(client.usePublicCareers).mockReturnValue({ data: undefined, isLoading: false, error: null } as any);
    vi.mocked(client.usePublicPosition).mockReturnValue({ data: undefined, isLoading: false } as any);
  });

  it('shows a loading state while the position list is loading', () => {
    vi.mocked(client.usePublicCareers).mockReturnValue({ data: undefined, isLoading: true, error: null } as any);
    const { container } = render(<CareersPage companyIdentifier="zenhr" />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows a not-found message when the company has no careers page or the identifier is wrong', () => {
    vi.mocked(client.usePublicCareers).mockReturnValue({ data: undefined, isLoading: false, error: new Error('404') } as any);
    render(<CareersPage companyIdentifier="nonexistent" />);
    expect(screen.getByText('Careers page not found')).toBeInTheDocument();
  });

  it('pluralizes the open-position count correctly for zero, one, and many', () => {
    vi.mocked(client.usePublicCareers).mockReturnValue({ data: { company, positions: [] }, isLoading: false, error: null } as any);
    const { rerender } = render(<CareersPage companyIdentifier="zenhr" />);
    expect(screen.getByText('0 Open Positions')).toBeInTheDocument();
    expect(screen.getByText('No open positions right now — check back soon.')).toBeInTheDocument();

    vi.mocked(client.usePublicCareers).mockReturnValue({
      data: { company, positions: [{ id: 'REQ-1', title: 'Engineer', department: 'Eng', location: 'Lagos' }] },
      isLoading: false, error: null,
    } as any);
    rerender(<CareersPage companyIdentifier="zenhr" />);
    expect(screen.getByText('1 Open Position')).toBeInTheDocument();
  });

  it('opens a position\'s detail view when clicked, and returns to the list on "Back"', () => {
    vi.mocked(client.usePublicCareers).mockReturnValue({
      data: { company, positions: [{ id: 'REQ-1', title: 'Senior Engineer', department: 'Eng', location: 'Lagos' }] },
      isLoading: false, error: null,
    } as any);
    vi.mocked(client.usePublicPosition).mockReturnValue({
      data: { position: { id: 'REQ-1', title: 'Senior Engineer', department: 'Eng', location: 'Lagos', description: 'Build things.', requirements: '5+ years.' } },
      isLoading: false,
    } as any);

    render(<CareersPage companyIdentifier="zenhr" />);
    fireEvent.click(screen.getByText('Senior Engineer'));

    expect(screen.getByText('Build things.')).toBeInTheDocument();
    expect(screen.getByText('5+ years.')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Back to all roles'));
    expect(screen.queryByText('Build things.')).not.toBeInTheDocument();
  });

  it('shows a fallback message when a position has no description yet', () => {
    vi.mocked(client.usePublicCareers).mockReturnValue({
      data: { company, positions: [{ id: 'REQ-1', title: 'Engineer', department: 'Eng', location: 'Lagos' }] },
      isLoading: false, error: null,
    } as any);
    vi.mocked(client.usePublicPosition).mockReturnValue({
      data: { position: { id: 'REQ-1', title: 'Engineer', department: 'Eng', location: 'Lagos', description: null, requirements: null } },
      isLoading: false,
    } as any);

    render(<CareersPage companyIdentifier="zenhr" />);
    fireEvent.click(screen.getByText('Engineer'));

    expect(screen.getByText('No description provided for this role yet.')).toBeInTheDocument();
    expect(screen.queryByText('Requirements')).not.toBeInTheDocument();
  });

  it('opens the application form when "Apply for this role" is clicked', () => {
    vi.mocked(client.usePublicCareers).mockReturnValue({
      data: { company, positions: [{ id: 'REQ-1', title: 'Engineer', department: 'Eng', location: 'Lagos' }] },
      isLoading: false, error: null,
    } as any);
    vi.mocked(client.usePublicPosition).mockReturnValue({
      data: { position: { id: 'REQ-1', title: 'Engineer', department: 'Eng', location: 'Lagos' } },
      isLoading: false,
    } as any);

    render(<CareersPage companyIdentifier="zenhr" />);
    fireEvent.click(screen.getByText('Engineer'));
    fireEvent.click(screen.getByText('Apply for this role'));

    expect(screen.getByText('Apply for Engineer')).toBeInTheDocument();
  });
});
