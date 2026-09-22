import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CompanyDocuments from '../features/admin/CompanyDocuments';
import * as docClient from '../api/companyDocument.client';

const mockConfirm = vi.fn().mockResolvedValue(true);
const mockAlert = vi.fn();

vi.mock('../components/PopupProvider', () => ({
  usePopup: () => ({ confirm: mockConfirm, alert: mockAlert, prompt: vi.fn() }),
}));

const mockCreate = vi.fn();
const mockDelete = vi.fn();

vi.mock('../api/companyDocument.client', () => ({
  useCompanyDocuments: vi.fn(() => ({ data: [], isLoading: false })),
  useCreateCompanyDocument: vi.fn(() => ({ mutate: mockCreate, isPending: false })),
  useDeleteCompanyDocument: vi.fn(() => ({ mutate: mockDelete, isPending: false })),
}));

const document_ = (overrides: any = {}) => ({
  id: 'DOC-1',
  title: 'Remote Work Policy',
  content: 'Employees may work remotely up to 3 days a week.',
  uploadedByName: 'Sarah Connor',
  createdAt: '2026-01-01T00:00:00Z',
  fileName: null,
  ...overrides,
});

describe('CompanyDocuments (admin knowledge base)', () => {
  beforeEach(() => {
    mockCreate.mockClear();
    mockDelete.mockClear();
    mockConfirm.mockClear().mockResolvedValue(true);
    mockAlert.mockClear();
    vi.mocked(docClient.useCompanyDocuments).mockReturnValue({ data: [], isLoading: false } as any);
  });

  it('shows the empty state when there are no documents yet', () => {
    render(<CompanyDocuments />);
    expect(screen.getByText('No documents uploaded yet.')).toBeInTheDocument();
  });

  it('lists documents with uploader, date, and attached file name', () => {
    vi.mocked(docClient.useCompanyDocuments).mockReturnValue({
      data: [document_({ fileName: 'handbook.pdf' })],
      isLoading: false,
    } as any);

    render(<CompanyDocuments />);

    expect(screen.getByText('Remote Work Policy')).toBeInTheDocument();
    expect(screen.getByText('By Sarah Connor')).toBeInTheDocument();
    expect(screen.getByText('handbook.pdf')).toBeInTheDocument();
  });

  it('blocks submission when title or content is missing', () => {
    render(<CompanyDocuments />);
    fireEvent.click(screen.getByText('New Document'));
    fireEvent.click(screen.getByText('Add Document'));

    expect(screen.getByText('Title and content are required.')).toBeInTheDocument();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('submits the title/content and closes the modal on success', () => {
    mockCreate.mockImplementation((_payload, { onSuccess }) => onSuccess());

    render(<CompanyDocuments />);
    fireEvent.click(screen.getByText('New Document'));
    fireEvent.change(screen.getByPlaceholderText('e.g. Remote Work Policy'), { target: { value: 'Dress Code' } });
    fireEvent.change(screen.getByPlaceholderText('Paste or type the policy text here...'), { target: { value: 'Business casual.' } });
    fireEvent.click(screen.getByText('Add Document'));

    expect(mockCreate).toHaveBeenCalledWith(
      { title: 'Dress Code', content: 'Business casual.', file: null },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
    // "New Document" also names the ever-present trigger button, so check the
    // modal-only field instead to confirm it actually closed.
    expect(screen.queryByPlaceholderText('e.g. Remote Work Policy')).not.toBeInTheDocument();
  });

  it('deletes a document only after the confirm dialog is accepted', async () => {
    vi.mocked(docClient.useCompanyDocuments).mockReturnValue({ data: [document_()], isLoading: false } as any);

    render(<CompanyDocuments />);
    const row = screen.getByText('Remote Work Policy').closest('div.group')!;
    fireEvent.click(row.querySelector('button')!);

    await waitFor(() => expect(mockConfirm).toHaveBeenCalled());
    expect(mockDelete).toHaveBeenCalledWith('DOC-1', expect.anything());
  });

  it('does not delete when the confirmation is declined', async () => {
    mockConfirm.mockResolvedValue(false);
    vi.mocked(docClient.useCompanyDocuments).mockReturnValue({ data: [document_()], isLoading: false } as any);

    render(<CompanyDocuments />);
    const row = screen.getByText('Remote Work Policy').closest('div.group')!;
    fireEvent.click(row.querySelector('button')!);

    await waitFor(() => expect(mockConfirm).toHaveBeenCalled());
    expect(mockDelete).not.toHaveBeenCalled();
  });
});
