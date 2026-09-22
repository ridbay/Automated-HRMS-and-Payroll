import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import JobApplicationForm from '../features/public/JobApplicationForm';
import * as client from '../api/client';

const mockMutate = vi.fn();

vi.mock('../api/client', () => ({
  useSubmitPublicApplication: vi.fn(() => ({ mutate: mockMutate, isPending: false, isSuccess: false })),
}));

const position = { id: 'REQ-1', title: 'Senior Engineer', department: 'Engineering', location: 'Lagos' };

describe('JobApplicationForm (public, unauthenticated)', () => {
  beforeEach(() => {
    mockMutate.mockClear();
    vi.mocked(client.useSubmitPublicApplication).mockReturnValue({ mutate: mockMutate, isPending: false, isSuccess: false } as any);
  });

  it('blocks submission when name/email are missing (the component\'s own .trim() guard)', () => {
    // The <input required>/type="email" attributes make jsdom's native form
    // validation intercept a plain button click before React's onSubmit ever
    // runs — dispatching the submit event directly exercises the component's
    // own validation logic instead of the browser's.
    const onClose = vi.fn();
    const { container } = render(<JobApplicationForm companyIdentifier="zenhr" position={position} onClose={onClose} />);

    fireEvent.submit(container.querySelector('form')!);

    expect(screen.getByText('Name and email are required.')).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('submits only the fields that were actually filled in, plus the resume file when attached', () => {
    render(<JobApplicationForm companyIdentifier="zenhr" position={position} onClose={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Full name *'), { target: { value: 'Ada Lovelace' } });
    fireEvent.change(screen.getByPlaceholderText('Email *'), { target: { value: 'ada@example.com' } });
    const resumeFile = new File(['resume content'], 'resume.pdf', { type: 'application/pdf' });
    fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [resumeFile] } });
    fireEvent.click(screen.getByText('Submit Application'));

    expect(mockMutate).toHaveBeenCalledTimes(1);
    const [args] = mockMutate.mock.calls[0];
    expect(args.companyIdentifier).toBe('zenhr');
    expect(args.requisitionId).toBe('REQ-1');
    const fd: FormData = args.formData;
    expect(fd.get('name')).toBe('Ada Lovelace');
    expect(fd.get('email')).toBe('ada@example.com');
    expect(fd.get('phone')).toBeNull(); // never filled in, so never appended
    expect((fd.get('resume') as File).name).toBe('resume.pdf');
  });

  it('shows the uploaded resume\'s filename in the attach control', () => {
    render(<JobApplicationForm companyIdentifier="zenhr" position={position} onClose={vi.fn()} />);
    expect(screen.getByText('Attach resume (PDF, optional)')).toBeInTheDocument();

    const resumeFile = new File(['x'], 'my-resume.pdf', { type: 'application/pdf' });
    fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [resumeFile] } });

    expect(screen.getByText('my-resume.pdf')).toBeInTheDocument();
  });

  it('surfaces a server-side error instead of silently failing', () => {
    mockMutate.mockImplementation((_payload, { onError }) => onError({ message: 'Email already applied to this role.' }));
    render(<JobApplicationForm companyIdentifier="zenhr" position={position} onClose={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Full name *'), { target: { value: 'Ada Lovelace' } });
    fireEvent.change(screen.getByPlaceholderText('Email *'), { target: { value: 'ada@example.com' } });
    fireEvent.click(screen.getByText('Submit Application'));

    expect(screen.getByText('Email already applied to this role.')).toBeInTheDocument();
  });

  it('shows a success confirmation once submitted, instead of the form', () => {
    vi.mocked(client.useSubmitPublicApplication).mockReturnValue({ mutate: mockMutate, isPending: false, isSuccess: true } as any);
    render(<JobApplicationForm companyIdentifier="zenhr" position={position} onClose={vi.fn()} />);

    expect(screen.getByText('Application Received')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Full name *')).not.toBeInTheDocument();
  });
});
