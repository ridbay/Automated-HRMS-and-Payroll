import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import EmployeeDetail from '../features/admin/EmployeeDetail';
import * as client from '../api/client';

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

const mockAlert = vi.fn().mockResolvedValue(undefined);
const mockConfirm = vi.fn().mockResolvedValue(true);
const mockPrompt = vi.fn().mockResolvedValue(null);
vi.mock('../components/PopupProvider', () => ({
  usePopup: () => ({ alert: mockAlert, confirm: mockConfirm, prompt: mockPrompt }),
}));

const {
  mockAddContact, mockDeleteContact, mockUploadDoc, mockDeleteDoc, mockUpdateEmployee,
  mockCreateAssessment, mockUpdateBenefits, mockAddTraining, mockAddAsset, mockDeleteAsset,
  mockResetTempPassword, mockUpdateLeaveBalances, mockDownloadBlob,
} = vi.hoisted(() => ({
  mockAddContact: vi.fn(),
  mockDeleteContact: vi.fn(),
  mockUploadDoc: vi.fn(),
  mockDeleteDoc: vi.fn(),
  mockUpdateEmployee: vi.fn(),
  mockCreateAssessment: vi.fn(),
  mockUpdateBenefits: vi.fn(),
  mockAddTraining: vi.fn(),
  mockAddAsset: vi.fn(),
  mockDeleteAsset: vi.fn(),
  mockResetTempPassword: vi.fn(),
  mockUpdateLeaveBalances: vi.fn(),
  mockDownloadBlob: vi.fn(),
}));

vi.mock('../api/client', () => ({
  getDocumentDownloadUrl: vi.fn(() => 'https://example.com/doc'),
  downloadAuthenticatedBlob: mockDownloadBlob,
  useEmployeeLeaveBalances: vi.fn(() => ({ data: [] })),
  useUpdateLeaveBalances: vi.fn(() => ({ mutate: mockUpdateLeaveBalances })),
  useEmployeeProfile: vi.fn(() => ({ data: undefined, isLoading: false })),
  useEmployeeDirectReports: vi.fn(() => ({ data: [] })),
  useAddAdminEmergencyContact: vi.fn(() => ({ mutate: mockAddContact, isPending: false })),
  useDeleteAdminEmergencyContact: vi.fn(() => ({ mutate: mockDeleteContact })),
  useUploadEmployeeDocument: vi.fn(() => ({ mutate: mockUploadDoc, isPending: false })),
  useDeleteEmployeeDocument: vi.fn(() => ({ mutate: mockDeleteDoc })),
  useUpdateAdminEmployee: vi.fn(() => ({ mutate: mockUpdateEmployee, isPending: false })),
  useEmployeeAssessments: vi.fn(() => ({ data: [] })),
  useCreateAssessment: vi.fn(() => ({ mutate: mockCreateAssessment, isPending: false })),
  useEmployeePayslips: vi.fn(() => ({ data: [] })),
  useEmployeeBenefits: vi.fn(() => ({ data: undefined })),
  useUpdateEmployeeBenefits: vi.fn(() => ({ mutate: mockUpdateBenefits, isPending: false })),
  useEmployeeTrainings: vi.fn(() => ({ data: [] })),
  useAddEmployeeTraining: vi.fn(() => ({ mutate: mockAddTraining, isPending: false })),
  useEmployeeLeaveRequests: vi.fn(() => ({ data: [] })),
  useEmployeeAuditLogs: vi.fn(() => ({ data: [] })),
  useEmployeeAssets: vi.fn(() => ({ data: [] })),
  useAddEmployeeAsset: vi.fn(() => ({ mutate: mockAddAsset })),
  useDeleteEmployeeAsset: vi.fn(() => ({ mutate: mockDeleteAsset })),
  useReviewCycles: vi.fn(() => ({ data: { cycles: [], ratingScale: [] } })),
  useResetTemporaryPassword: vi.fn(() => ({ mutateAsync: mockResetTempPassword, isPending: false })),
}));

const baseEmployee = {
  id: 'EMP-1', name: 'Grace', lastName: 'Hopper', email: 'grace@example.com', role: 'Software Engineer',
  department: 'Engineering', status: 'active', salary: 500000, avatar: null, companyId: 'CO-1',
  emergencyContacts: [], employeeDocuments: [], isPasswordChanged: true,
};

const advance = async () => {
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 650)); });
};

const renderDetail = async (overrides: any = {}) => {
  const onBack = vi.fn();
  const result = render(<EmployeeDetail employee={{ ...baseEmployee, ...overrides }} onBack={onBack} />);
  await advance();
  return { ...result, onBack };
};

describe('EmployeeDetail (admin)', () => {
  beforeEach(() => {
    [mockAddContact, mockDeleteContact, mockUploadDoc, mockDeleteDoc, mockUpdateEmployee, mockCreateAssessment,
      mockUpdateBenefits, mockAddTraining, mockAddAsset, mockDeleteAsset, mockResetTempPassword,
      mockUpdateLeaveBalances, mockDownloadBlob, mockAlert, mockConfirm, mockPrompt]
      .forEach((m) => m.mockClear());
    mockConfirm.mockResolvedValue(true);
    mockPrompt.mockResolvedValue(null);
    vi.mocked(client.useEmployeeProfile).mockReturnValue({ data: undefined, isLoading: false } as any);
    vi.mocked(client.useEmployeeDirectReports).mockReturnValue({ data: [] } as any);
    vi.mocked(client.useEmployeeLeaveBalances).mockReturnValue({ data: [] } as any);
    vi.mocked(client.useEmployeeAssessments).mockReturnValue({ data: [] } as any);
    vi.mocked(client.useReviewCycles).mockReturnValue({ data: { cycles: [], ratingScale: [] } } as any);
    vi.mocked(client.useEmployeePayslips).mockReturnValue({ data: [] } as any);
    vi.mocked(client.useEmployeeBenefits).mockReturnValue({ data: undefined } as any);
    vi.mocked(client.useEmployeeTrainings).mockReturnValue({ data: [] } as any);
    vi.mocked(client.useEmployeeLeaveRequests).mockReturnValue({ data: [] } as any);
    vi.mocked(client.useEmployeeAuditLogs).mockReturnValue({ data: [] } as any);
    vi.mocked(client.useEmployeeAssets).mockReturnValue({ data: [] } as any);
  });

  it('calls onBack when "Back to Directory" is clicked', async () => {
    const { onBack } = await renderDetail();
    fireEvent.click(screen.getByText('Back to Directory'));
    expect(onBack).toHaveBeenCalled();
  });

  it('computes profile completion percentage and shows the next missing item', async () => {
    // phone + emergencyContacts filled = 2/10 = 20%
    await renderDetail({ phone: '555-0100', emergencyContacts: [{ id: 'EC-1', name: 'Bob' }] });
    expect(screen.getByText('20% Complete')).toBeInTheDocument();
    expect(screen.getByText(/Next Step: Add Middle Name/)).toBeInTheDocument();
  });

  describe('Reset temporary password', () => {
    it('warns about invalidating an active password when one is already set', async () => {
      await renderDetail({ isPasswordChanged: true });
      fireEvent.click(screen.getByTitle('Reset Temporary Password'));
      expect(mockConfirm).toHaveBeenCalledWith(expect.stringContaining('already has an active password'));
    });

    it('shows the new temporary password after a successful reset', async () => {
      mockResetTempPassword.mockResolvedValue({ temporaryPassword: 'Xy9!aBcD' });
      await renderDetail();
      fireEvent.click(screen.getByTitle('Reset Temporary Password'));
      await waitFor(() => expect(screen.getByText('Xy9!aBcD')).toBeInTheDocument());

      fireEvent.click(screen.getByText('Done'));
      expect(screen.queryByText('Xy9!aBcD')).not.toBeInTheDocument();
    });

    it('surfaces a reset failure via alert', async () => {
      mockResetTempPassword.mockRejectedValue({ message: 'Network error' });
      await renderDetail();
      fireEvent.click(screen.getByTitle('Reset Temporary Password'));
      await waitFor(() => expect(mockAlert).toHaveBeenCalledWith('Network error'));
    });

    it('does not reset when confirmation is declined', async () => {
      mockConfirm.mockResolvedValueOnce(false);
      await renderDetail();
      fireEvent.click(screen.getByTitle('Reset Temporary Password'));
      await waitFor(() => expect(mockConfirm).toHaveBeenCalled());
      expect(mockResetTempPassword).not.toHaveBeenCalled();
    });
  });

  describe('Personal tab (default)', () => {
    it('shows "No contacts added" for an employee with no emergency contacts', async () => {
      await renderDetail();
      expect(screen.getByText('No contacts added')).toBeInTheDocument();
    });

    it('lists existing emergency contacts and deletes one after confirmation', async () => {
      await renderDetail({ emergencyContacts: [{ id: 'EC-1', name: 'Bob Marley', relationship: 'Spouse', phone: '555-0100' }] });
      expect(screen.getByText('Bob Marley')).toBeInTheDocument();

      fireEvent.click(document.querySelector('.lucide-trash-2')!.closest('button')!);
      await waitFor(() => expect(mockDeleteContact).toHaveBeenCalledWith({ employeeId: 'EMP-1', contactId: 'EC-1' }));
    });

    it('adds a new emergency contact by walking through the name/phone/relationship prompts', async () => {
      mockPrompt.mockResolvedValueOnce('Bob Marley').mockResolvedValueOnce('555-0100').mockResolvedValueOnce('Spouse');
      await renderDetail();

      fireEvent.click(screen.getByText('+ Add New Contact'));
      await waitFor(() => expect(mockAddContact).toHaveBeenCalledWith({
        employeeId: 'EMP-1',
        data: { name: 'Bob Marley', phone: '555-0100', relationship: 'Spouse', isPrimary: true },
      }));
    });

    it('aborts adding a contact if the name prompt is cancelled', async () => {
      mockPrompt.mockResolvedValueOnce(null);
      await renderDetail();
      fireEvent.click(screen.getByText('+ Add New Contact'));
      await waitFor(() => expect(mockPrompt).toHaveBeenCalled());
      expect(mockAddContact).not.toHaveBeenCalled();
    });
  });

  describe('Employment tab', () => {
    it('updates contract status through the edit prompts', async () => {
      mockPrompt.mockResolvedValueOnce('Contract').mockResolvedValueOnce('On Leave').mockResolvedValueOnce('2026-06-01');
      await renderDetail();
      fireEvent.click(screen.getByText('Employment'));
      await advance();

      fireEvent.click(screen.getByText('Edit'));
      await waitFor(() => expect(mockUpdateEmployee).toHaveBeenCalledWith({
        id: 'EMP-1',
        data: { employmentType: 'Contract', status: 'On Leave', probationEnd: '2026-06-01' },
      }));
    });

    it('shows the direct reports count', async () => {
      vi.mocked(client.useEmployeeDirectReports).mockReturnValue({ data: [{ id: 'EMP-2', name: 'Bob' }] } as any);
      await renderDetail();
      fireEvent.click(screen.getByText('Employment'));
      await advance();
      expect(screen.getByText('Direct Reports').closest('section')!.textContent).toContain('1');
    });
  });

  describe('Leave tab', () => {
    it('shows "No leave balances set" when empty', async () => {
      await renderDetail();
      fireEvent.click(screen.getByText('Leave'));
      await advance();
      expect(screen.getByText('No leave balances set')).toBeInTheDocument();
    });

    it('edits balances via the type/total prompts, updating an existing type', async () => {
      vi.mocked(client.useEmployeeLeaveBalances).mockReturnValue({ data: [{ type: 'Annual', total: 20, color: 'indigo' }] } as any);
      mockPrompt.mockResolvedValueOnce('Annual').mockResolvedValueOnce('25');
      await renderDetail();
      fireEvent.click(screen.getByText('Leave'));
      await advance();

      fireEvent.click(screen.getByText('Edit Balances'));
      await waitFor(() => expect(mockUpdateLeaveBalances).toHaveBeenCalledWith({
        employeeId: 'EMP-1',
        balances: [{ type: 'Annual', total: 25, color: 'indigo' }],
      }));
    });
  });

  describe('Performance tab', () => {
    it('disables "Log Review" submission until a cycle and rating are chosen', async () => {
      await renderDetail();
      fireEvent.click(screen.getByText('Performance'));
      await advance();

      fireEvent.click(screen.getByText('+ Log Review'));
      expect(screen.getByText('Log Review', { selector: 'button' })).toBeDisabled();
    });

    it('submits a manager review with cycle, rating, and comment', async () => {
      vi.mocked(client.useReviewCycles).mockReturnValue({
        data: { cycles: [{ id: 'CYC-1', name: 'H1 2026', status: 'active' }], ratingScale: [{ value: 'meets', label: 'Meets Expectations' }] },
      } as any);
      mockCreateAssessment.mockImplementation((_payload, { onSuccess }) => onSuccess());
      await renderDetail();
      fireEvent.click(screen.getByText('Performance'));
      await advance();
      fireEvent.click(screen.getByText('+ Log Review'));

      fireEvent.change(screen.getByDisplayValue('H1 2026'), { target: { value: 'H1 2026' } });
      fireEvent.change(screen.getByDisplayValue('Select rating…'), { target: { value: 'meets' } });
      fireEvent.click(screen.getByText('Log Review', { selector: 'button' }));

      expect(mockCreateAssessment).toHaveBeenCalledWith(
        { employeeId: 'EMP-1', data: { cycleName: 'H1 2026', managerRating: 'meets', managerComment: '' } },
        expect.objectContaining({ onSuccess: expect.any(Function) })
      );
    });

    it('shows logged reviews', async () => {
      vi.mocked(client.useEmployeeAssessments).mockReturnValue({
        data: [{ cycleName: 'H1 2026', managerRating: 'meets', status: 'completed', managerComment: 'Solid work', createdAt: '2026-03-01' }],
      } as any);
      await renderDetail();
      fireEvent.click(screen.getByText('Performance'));
      await advance();
      expect(screen.getByText('Solid work')).toBeInTheDocument();
    });
  });

  describe('Documents tab', () => {
    it('shows "No documents uploaded yet" for an empty vault', async () => {
      await renderDetail();
      fireEvent.click(screen.getByText('Documents'));
      await advance();
      expect(screen.getByText('No documents uploaded yet.')).toBeInTheDocument();
    });

    it('uploads a document after naming it and its type via prompts', async () => {
      mockPrompt.mockResolvedValueOnce('ID Card').mockResolvedValueOnce('Identity');
      await renderDetail();
      fireEvent.click(screen.getByText('Documents'));
      await advance();

      const file = new File(['id'], 'id-card.pdf', { type: 'application/pdf' });
      const input = document.getElementById('document-upload') as HTMLInputElement;
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => expect(mockUploadDoc).toHaveBeenCalledWith({ employeeId: 'EMP-1', file, name: 'ID Card', type: 'Identity' }));
    });

    it('lists uploaded documents and deletes one after confirmation', async () => {
      await renderDetail({
        employeeDocuments: [{ id: 'DOC-1', name: 'ID Card', type: 'Identity', status: 'verified', createdAt: '2026-01-01' }],
      });
      fireEvent.click(screen.getByText('Documents'));
      await advance();
      expect(screen.getByText('ID Card')).toBeInTheDocument();

      fireEvent.click(document.querySelector('.lucide-trash-2')!.closest('button')!);
      await waitFor(() => expect(mockDeleteDoc).toHaveBeenCalledWith({ employeeId: 'EMP-1', documentId: 'DOC-1' }));
    });

    it('downloads a document via the authenticated blob helper', async () => {
      await renderDetail({
        employeeDocuments: [{ id: 'DOC-1', name: 'ID Card', type: 'Identity', status: 'verified', createdAt: '2026-01-01' }],
      });
      fireEvent.click(screen.getByText('Documents'));
      await advance();

      fireEvent.click(document.querySelector('.lucide-download')!.closest('button')!);
      expect(mockDownloadBlob).toHaveBeenCalledWith('https://example.com/doc', 'ID Card');
    });
  });

  describe('Benefits tab', () => {
    it('encodes a benefit via provider/plan prompts', async () => {
      mockPrompt.mockResolvedValueOnce('AXA Mansard').mockResolvedValueOnce('Gold Plan');
      await renderDetail();
      fireEvent.click(screen.getByText('Benefits'));
      await advance();

      fireEvent.click(screen.getByText('Encode Benefit'));
      await waitFor(() => expect(mockUpdateBenefits).toHaveBeenCalledWith({
        employeeId: 'EMP-1', data: { healthProvider: 'AXA Mansard', healthPlan: 'Gold Plan' },
      }));
    });
  });

  describe('Training tab', () => {
    it('assigns a course via the name/provider prompts', async () => {
      mockPrompt.mockResolvedValueOnce('React Advanced').mockResolvedValueOnce('Frontend Masters');
      await renderDetail();
      fireEvent.click(screen.getByText('Training'));
      await advance();

      fireEvent.click(screen.getByText('+ Assign Course'));
      await waitFor(() => expect(mockAddTraining).toHaveBeenCalledWith({
        employeeId: 'EMP-1',
        data: expect.objectContaining({ courseName: 'React Advanced', provider: 'Frontend Masters', status: 'in_progress' }),
      }));
    });
  });

  describe('Disciplinary tab (HR private notes)', () => {
    it('saves the private notes text', async () => {
      mockUpdateEmployee.mockImplementation((_payload) => {});
      await renderDetail();
      fireEvent.click(screen.getByText('Notes'));
      await advance();

      fireEvent.change(screen.getByPlaceholderText('Add private administrative notes here...'), { target: { value: 'Flagged for review' } });
      fireEvent.click(screen.getByText('Save Note'));

      expect(mockUpdateEmployee).toHaveBeenCalledWith({ id: 'EMP-1', data: { privateNotes: 'Flagged for review' } });
    });
  });

  describe('Assets tab', () => {
    it('shows "No assets assigned" for an empty list', async () => {
      await renderDetail();
      fireEvent.click(screen.getByText('Assets'));
      await advance();
      expect(screen.getByText('No assets assigned to this employee.')).toBeInTheDocument();
    });

    it('assigns a new asset via the prompt sequence', async () => {
      mockPrompt.mockResolvedValueOnce('MacBook Pro').mockResolvedValueOnce('Laptop').mockResolvedValueOnce('SN-123').mockResolvedValueOnce('New');
      await renderDetail();
      fireEvent.click(screen.getByText('Assets'));
      await advance();

      fireEvent.click(screen.getByText('Assign Asset'));
      await waitFor(() => expect(mockAddAsset).toHaveBeenCalledWith({
        employeeId: 'EMP-1',
        data: { name: 'MacBook Pro', category: 'Laptop', serialNumber: 'SN-123', condition: 'New' },
      }));
    });

    it('unassigns an asset after confirmation', async () => {
      vi.mocked(client.useEmployeeAssets).mockReturnValue({
        data: [{ id: 'ASSET-1', name: 'MacBook Pro', category: 'Laptop', serialNumber: 'SN-123', condition: 'Good' }],
      } as any);
      await renderDetail();
      fireEvent.click(screen.getByText('Assets'));
      await advance();

      fireEvent.click(document.querySelector('.lucide-trash-2')!.closest('button')!);
      await waitFor(() => expect(mockDeleteAsset).toHaveBeenCalledWith({ employeeId: 'EMP-1', assetId: 'ASSET-1' }));
    });
  });

  describe('Activity (audit) tab', () => {
    it('shows "No audit logs available" when empty', async () => {
      await renderDetail();
      fireEvent.click(screen.getByText('Audit'));
      await advance();
      expect(screen.getByText('No audit logs available.')).toBeInTheDocument();
    });

    it('lists audit log entries', async () => {
      vi.mocked(client.useEmployeeAuditLogs).mockReturnValue({
        data: [{ action: 'Salary Updated', details: '₦500,000 → ₦550,000', actorName: 'HR Admin', createdAt: '2026-03-01T10:00:00Z' }],
      } as any);
      await renderDetail();
      fireEvent.click(screen.getByText('Audit'));
      await advance();
      expect(screen.getByText('Salary Updated')).toBeInTheDocument();
    });
  });
});
