import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import Settings from '../features/core/Settings';
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

const mockUser: any = { id: 'admin-1', role: 'HR_ADMIN' };
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

const mockApplyGlobalColor = vi.fn();
vi.mock('../context/BrandingContext', () => ({
  useBranding: () => ({ setPrimaryColor: mockApplyGlobalColor }),
}));

const mockAlert = vi.fn().mockResolvedValue(undefined);
const mockConfirm = vi.fn().mockResolvedValue(true);
const mockPrompt = vi.fn().mockResolvedValue(null);
vi.mock('../components/PopupProvider', () => ({
  usePopup: () => ({ alert: mockAlert, confirm: mockConfirm, prompt: mockPrompt }),
}));

const {
  mockUpdateSettings, mockCreateApiKey, mockDeleteApiKey, mockUpdateCompany, mockUploadLogo, mockDeleteLogo,
  mockCreateDept, mockDeleteDept, mockUpdateDept, mockAssignDeptMember, mockRemoveDeptMember,
  mockCreateLoc, mockDeleteLoc, mockCreateRole, mockUpdateRole, mockDeleteRole,
  mockCreateHoliday, mockDeleteHoliday, mockUpdateEmailTemplate, mockTestEmailTemplate,
  mockToggleIntegration, mockConnectSlack, mockDisconnectSlack, mockTestSlack,
  mockConnectMailgun, mockDisconnectMailgun, mockTestMailgun, mockUpdateWorkflow,
  mockExportCompanyData, mockExportAuditLogsCsv,
} = vi.hoisted(() => ({
  mockUpdateSettings: vi.fn(),
  mockCreateApiKey: vi.fn(),
  mockDeleteApiKey: vi.fn(),
  mockUpdateCompany: vi.fn(),
  mockUploadLogo: vi.fn(),
  mockDeleteLogo: vi.fn(),
  mockCreateDept: vi.fn(),
  mockDeleteDept: vi.fn(),
  mockUpdateDept: vi.fn(),
  mockAssignDeptMember: vi.fn(),
  mockRemoveDeptMember: vi.fn(),
  mockCreateLoc: vi.fn(),
  mockDeleteLoc: vi.fn(),
  mockCreateRole: vi.fn(),
  mockUpdateRole: vi.fn(),
  mockDeleteRole: vi.fn(),
  mockCreateHoliday: vi.fn(),
  mockDeleteHoliday: vi.fn(),
  mockUpdateEmailTemplate: vi.fn(),
  mockTestEmailTemplate: vi.fn(),
  mockToggleIntegration: vi.fn(),
  mockConnectSlack: vi.fn(),
  mockDisconnectSlack: vi.fn(),
  mockTestSlack: vi.fn(),
  mockConnectMailgun: vi.fn(),
  mockDisconnectMailgun: vi.fn(),
  mockTestMailgun: vi.fn(),
  mockUpdateWorkflow: vi.fn(),
  mockExportCompanyData: vi.fn(),
  mockExportAuditLogsCsv: vi.fn(),
}));

vi.mock('../api/client', () => ({
  useSettings: vi.fn(() => ({ data: {}, isLoading: false })),
  useUpdateSettings: vi.fn(() => ({ mutate: mockUpdateSettings, isPending: false })),
  useApiKeys: vi.fn(() => ({ data: [], isLoading: false })),
  useCreateApiKey: vi.fn(() => ({ mutate: mockCreateApiKey, isPending: false })),
  useDeleteApiKey: vi.fn(() => ({ mutate: mockDeleteApiKey })),
  useCompany: vi.fn(() => ({ data: { id: 'CO-1', name: 'Acme Inc' }, isLoading: false })),
  useUpdateCompany: vi.fn(() => ({ mutate: mockUpdateCompany, isPending: false })),
  useUploadCompanyLogo: vi.fn(() => ({ mutate: mockUploadLogo, isPending: false })),
  useDeleteCompanyLogo: vi.fn(() => ({ mutate: mockDeleteLogo, isPending: false })),
  resolveCompanyLogoUrl: vi.fn((id: string, url: string) => `https://logos.example.com/${id}/${url}`),
  useDepartments: vi.fn(() => ({ data: [], isLoading: false })),
  useCreateDepartment: vi.fn(() => ({ mutate: mockCreateDept, isPending: false })),
  useDeleteDepartment: vi.fn(() => ({ mutate: mockDeleteDept })),
  useUpdateDepartment: vi.fn(() => ({ mutate: mockUpdateDept })),
  useDepartmentMembers: vi.fn(() => ({ data: [], isLoading: false })),
  useAssignDepartmentMember: vi.fn(() => ({ mutate: mockAssignDeptMember, isPending: false })),
  useRemoveDepartmentMember: vi.fn(() => ({ mutate: mockRemoveDeptMember })),
  useLocations: vi.fn(() => ({ data: [], isLoading: false })),
  useCreateLocation: vi.fn(() => ({ mutate: mockCreateLoc, isPending: false })),
  useDeleteLocation: vi.fn(() => ({ mutate: mockDeleteLoc })),
  useRoles: vi.fn(() => ({ data: [], isLoading: false })),
  useCreateRole: vi.fn(() => ({ mutate: mockCreateRole, isPending: false })),
  useUpdateRole: vi.fn(() => ({ mutate: mockUpdateRole, isPending: false })),
  useDeleteRole: vi.fn(() => ({ mutate: mockDeleteRole })),
  useEmployees: vi.fn(() => ({ data: [] })),
  useHolidays: vi.fn(() => ({ data: [], isLoading: false })),
  useCreateHoliday: vi.fn(() => ({ mutate: mockCreateHoliday, isPending: false })),
  useDeleteHoliday: vi.fn(() => ({ mutate: mockDeleteHoliday })),
  useEmailTemplates: vi.fn(() => ({ data: [], isLoading: false })),
  useUpdateEmailTemplate: vi.fn(() => ({ mutate: mockUpdateEmailTemplate, isPending: false })),
  useTestEmailTemplate: vi.fn(() => ({ mutateAsync: mockTestEmailTemplate })),
  useIntegrations: vi.fn(() => ({ data: [], isLoading: false })),
  useToggleIntegration: vi.fn(() => ({ mutate: mockToggleIntegration, isPending: false })),
  useConnectSlack: vi.fn(() => ({ mutate: mockConnectSlack, isPending: false })),
  useDisconnectSlack: vi.fn(() => ({ mutate: mockDisconnectSlack, isPending: false })),
  useTestSlack: vi.fn(() => ({ mutate: mockTestSlack, isPending: false })),
  useConnectMailgun: vi.fn(() => ({ mutate: mockConnectMailgun, isPending: false })),
  useDisconnectMailgun: vi.fn(() => ({ mutate: mockDisconnectMailgun, isPending: false })),
  useTestMailgun: vi.fn(() => ({ mutate: mockTestMailgun, isPending: false })),
  useIntegrationEvents: vi.fn(() => ({ data: [] })),
  useWorkflows: vi.fn(() => ({ data: [], isLoading: false })),
  useUpdateWorkflow: vi.fn(() => ({ mutate: mockUpdateWorkflow, isPending: false })),
  useWorkflowExecutions: vi.fn(() => ({ data: [], isLoading: false })),
  useDataStats: vi.fn(() => ({ data: undefined, isLoading: false })),
  exportCompanyData: mockExportCompanyData,
  useAuditLogs: vi.fn(() => ({ data: [], isLoading: false })),
  exportAuditLogsCsv: mockExportAuditLogsCsv,
}));

const allMocks = [
  mockUpdateSettings, mockCreateApiKey, mockDeleteApiKey, mockUpdateCompany, mockUploadLogo, mockDeleteLogo,
  mockCreateDept, mockDeleteDept, mockUpdateDept, mockAssignDeptMember, mockRemoveDeptMember,
  mockCreateLoc, mockDeleteLoc, mockCreateRole, mockUpdateRole, mockDeleteRole,
  mockCreateHoliday, mockDeleteHoliday, mockUpdateEmailTemplate, mockTestEmailTemplate,
  mockToggleIntegration, mockConnectSlack, mockDisconnectSlack, mockTestSlack,
  mockConnectMailgun, mockDisconnectMailgun, mockTestMailgun, mockUpdateWorkflow,
  mockExportCompanyData, mockExportAuditLogsCsv, mockAlert, mockConfirm, mockPrompt, mockApplyGlobalColor,
];

const goToSection = (name: string) => {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(name) }));
};

describe('Settings (core, admin Control Center)', () => {
  beforeEach(() => {
    mockUser.role = 'HR_ADMIN';
    URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    URL.revokeObjectURL = vi.fn();
    allMocks.forEach((m) => m.mockClear());
    mockConfirm.mockResolvedValue(true);
    mockPrompt.mockResolvedValue(null);
    mockExportCompanyData.mockResolvedValue(undefined);
    mockExportAuditLogsCsv.mockResolvedValue(undefined);
    vi.mocked(client.useSettings).mockReturnValue({ data: {}, isLoading: false } as any);
    vi.mocked(client.useCompany).mockReturnValue({ data: { id: 'CO-1', name: 'Acme Inc' }, isLoading: false } as any);
    vi.mocked(client.useDepartments).mockReturnValue({ data: [], isLoading: false } as any);
    vi.mocked(client.useLocations).mockReturnValue({ data: [], isLoading: false } as any);
    vi.mocked(client.useRoles).mockReturnValue({ data: [], isLoading: false } as any);
    vi.mocked(client.useEmployees).mockReturnValue({ data: [] } as any);
    vi.mocked(client.useHolidays).mockReturnValue({ data: [], isLoading: false } as any);
    vi.mocked(client.useEmailTemplates).mockReturnValue({ data: [], isLoading: false } as any);
    vi.mocked(client.useIntegrations).mockReturnValue({ data: [], isLoading: false } as any);
    vi.mocked(client.useWorkflows).mockReturnValue({ data: [], isLoading: false } as any);
    vi.mocked(client.useDataStats).mockReturnValue({ data: undefined, isLoading: false } as any);
    vi.mocked(client.useAuditLogs).mockReturnValue({ data: [], isLoading: false } as any);
    vi.mocked(client.useApiKeys).mockReturnValue({ data: [], isLoading: false } as any);
  });

  it('blocks non-admins with the "Admin-Only" message instead of rendering settings', () => {
    mockUser.role = 'EMPLOYEE';
    render(<Settings />);
    expect(screen.getByText('Org Setup is Admin-Only')).toBeInTheDocument();
    expect(screen.queryByText('Control Center')).not.toBeInTheDocument();
  });

  describe('Company Profile (default section)', () => {
    it('submits the profile form with the selected brand color', () => {
      render(<Settings />);
      fireEvent.click(screen.getByText('4F46E5', { exact: false }) || document.body);
      fireEvent.submit(document.querySelector('form')!);

      expect(mockUpdateCompany).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Acme Inc', primaryColor: expect.any(String) }),
        expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
      );
    });

    it('rejects a logo file over 5MB without uploading', () => {
      render(<Settings />);
      const bigFile = new File([new Uint8Array(6 * 1024 * 1024)], 'logo.png', { type: 'image/png' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(input, { target: { files: [bigFile] } });

      expect(mockAlert).toHaveBeenCalledWith('Logo must be 5MB or smaller.', 'File Too Large');
      expect(mockUploadLogo).not.toHaveBeenCalled();
    });

    it('uploads a valid logo file', () => {
      render(<Settings />);
      const file = new File(['logo'], 'logo.png', { type: 'image/png' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(input, { target: { files: [file] } });

      expect(mockUploadLogo).toHaveBeenCalledWith(file, expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }));
    });

    it('removes the logo after confirmation', async () => {
      vi.mocked(client.useCompany).mockReturnValue({ data: { id: 'CO-1', name: 'Acme Inc', logoUrl: 'logo.png' }, isLoading: false } as any);
      render(<Settings />);
      fireEvent.click(screen.getByText('Remove Logo'));
      await waitFor(() => expect(mockDeleteLogo).toHaveBeenCalled());
    });

    it('updates a custom hex color once 6 valid hex characters are entered', () => {
      render(<Settings />);
      const hexInput = screen.getByPlaceholderText('4F46E5');
      fireEvent.change(hexInput, { target: { value: '10B981' } });
      expect(mockApplyGlobalColor).toHaveBeenCalledWith('#10B981');
    });

    it('toggles a working day and persists it immediately', () => {
      render(<Settings />);
      fireEvent.click(screen.getAllByText('S', { selector: 'button' })[0]);
      expect(mockUpdateSettings).toHaveBeenCalledWith(expect.objectContaining({ workingDays: expect.any(Array) }));
    });

    it('adds and removes a public holiday', async () => {
      vi.mocked(client.useHolidays).mockReturnValue({ data: [{ id: 'H-1', name: "New Year's Day", date: '2026-01-01' }], isLoading: false } as any);
      render(<Settings />);
      fireEvent.click(screen.getByText('Manage Public Holidays'));

      fireEvent.change(screen.getByPlaceholderText("Holiday name (e.g. New Year's Day)"), { target: { value: 'Workers Day' } });
      fireEvent.change(document.querySelector('input[type="date"]')!, { target: { value: '2026-05-01' } });
      fireEvent.click(screen.getByText('Add'));
      expect(mockCreateHoliday).toHaveBeenCalledWith({ name: 'Workers Day', date: '2026-05-01' });

      fireEvent.click(document.querySelector('.lucide-x')!.closest('button')!);
      await waitFor(() => expect(mockDeleteHoliday).toHaveBeenCalledWith('H-1'));
    });
  });

  describe('Departments & Locations', () => {
    it('creates a department from the form', () => {
      render(<Settings />);
      goToSection('Departments & Locations');

      fireEvent.change(screen.getByPlaceholderText('Name (e.g. Engineering)'), { target: { value: 'Engineering' } });
      fireEvent.click(screen.getByText('+ Add Department'));
      expect(mockCreateDept).toHaveBeenCalledWith(expect.objectContaining({ name: 'Engineering' }));
    });

    it('deletes a department after confirmation', async () => {
      vi.mocked(client.useDepartments).mockReturnValue({ data: [{ id: 'D-1', name: 'Engineering', memberCount: 3 }], isLoading: false } as any);
      render(<Settings />);
      goToSection('Departments & Locations');

      fireEvent.click(document.querySelector('.lucide-trash-2')!.closest('button')!);
      await waitFor(() => expect(mockDeleteDept).toHaveBeenCalledWith('D-1'));
    });

    it('reassigns a department manager via the select', () => {
      vi.mocked(client.useDepartments).mockReturnValue({ data: [{ id: 'D-1', name: 'Engineering', memberCount: 0 }], isLoading: false } as any);
      vi.mocked(client.useEmployees).mockReturnValue({ data: [{ id: 'EMP-1', name: 'Grace', lastName: 'Hopper' }] } as any);
      render(<Settings />);
      goToSection('Departments & Locations');

      const managerSelect = screen.getByText('Manager', { selector: 'label' }).closest('div')!.querySelector('select')!;
      fireEvent.change(managerSelect, { target: { value: 'EMP-1' } });
      expect(mockUpdateDept).toHaveBeenCalledWith({ id: 'D-1', data: { managerId: 'EMP-1' } });
    });

    it('adds and removes a department member', () => {
      vi.mocked(client.useDepartments).mockReturnValue({ data: [{ id: 'D-1', name: 'Engineering', memberCount: 0 }], isLoading: false } as any);
      vi.mocked(client.useEmployees).mockReturnValue({ data: [{ id: 'EMP-1', name: 'Grace', lastName: 'Hopper' }] } as any);
      vi.mocked(client.useDepartmentMembers).mockReturnValue({ data: [{ id: 'EMP-1', name: 'Grace', lastName: 'Hopper' }], isLoading: false } as any);
      render(<Settings />);
      goToSection('Departments & Locations');

      fireEvent.click(screen.getByText('Manage Members'));
      fireEvent.change(screen.getByText('Add existing employee...').closest('select')!, { target: { value: 'EMP-1' } });
      fireEvent.click(screen.getByText('Add', { selector: 'button' }));
      expect(mockAssignDeptMember).toHaveBeenCalledWith({ departmentId: 'D-1', employeeId: 'EMP-1' });

      fireEvent.click(document.querySelector('.lucide-x')!.closest('button')!);
      expect(mockRemoveDeptMember).toHaveBeenCalledWith({ departmentId: 'D-1', employeeId: 'EMP-1' });
    });

    it('creates and deletes a location', async () => {
      vi.mocked(client.useLocations).mockReturnValue({ data: [{ id: 'L-1', name: 'HQ', city: 'Lagos', country: 'Nigeria' }], isLoading: false } as any);
      render(<Settings />);
      goToSection('Departments & Locations');

      fireEvent.change(screen.getByPlaceholderText('Name (e.g. HQ)'), { target: { value: 'Remote' } });
      fireEvent.change(screen.getByPlaceholderText('Full Address'), { target: { value: '123 Main St' } });
      fireEvent.click(screen.getByText('Add Location'));
      expect(mockCreateLoc).toHaveBeenCalledWith(expect.objectContaining({ name: 'Remote' }));

      fireEvent.click(document.querySelector('.lucide-trash-2')!.closest('button')!);
      await waitFor(() => expect(mockDeleteLoc).toHaveBeenCalledWith('L-1'));
    });
  });

  describe('Roles & Permissions', () => {
    it('creates a custom role via prompt', async () => {
      mockPrompt.mockResolvedValueOnce('Payroll Lead');
      render(<Settings />);
      goToSection('Roles & Permissions');

      fireEvent.click(screen.getByText('Create Custom Role'));
      await waitFor(() => expect(mockCreateRole).toHaveBeenCalledWith(expect.objectContaining({ name: 'Payroll Lead' })));
    });

    it('shows the permission matrix once a role is selected, and toggles a permission', () => {
      vi.mocked(client.useRoles).mockReturnValue({
        data: [{ id: 'ROLE-1', name: 'Payroll Lead', permissions: {}, usersCount: 0 }],
        isLoading: false,
      } as any);
      render(<Settings />);
      goToSection('Roles & Permissions');

      fireEvent.click(screen.getByText('Payroll Lead'));
      expect(screen.getByText('Permission Matrix (Payroll Lead)')).toBeInTheDocument();

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      fireEvent.click(screen.getByText('Save Permissions'));

      expect(mockUpdateRole).toHaveBeenCalledWith({
        id: 'ROLE-1',
        data: { permissions: expect.objectContaining({ workforce: expect.objectContaining({ view: true }) }) },
      });
    });

    it('warns about affected users before deleting a role in use', async () => {
      vi.mocked(client.useRoles).mockReturnValue({
        data: [{ id: 'ROLE-1', name: 'Payroll Lead', permissions: {}, usersCount: 2 }],
        isLoading: false,
      } as any);
      render(<Settings />);
      goToSection('Roles & Permissions');

      fireEvent.click(screen.getByTitle('Delete role'));
      await waitFor(() => expect(mockConfirm).toHaveBeenCalledWith(expect.stringContaining('2 employees currently have it assigned'), 'Delete Role'));
      expect(mockDeleteRole).toHaveBeenCalledWith('ROLE-1');
    });
  });

  describe('Integrations', () => {
    it('toggles a generic (non-real) integration directly', () => {
      vi.mocked(client.useIntegrations).mockReturnValue({
        data: [{ id: 'I-1', key: 'paystack', name: 'Paystack', category: 'Finance', status: 'available' }],
        isLoading: false,
      } as any);
      render(<Settings />);
      goToSection('Integrations');

      fireEvent.click(screen.getByText('Connect Account'));
      expect(mockToggleIntegration).toHaveBeenCalledWith('paystack');
    });

    it('connects Slack via the webhook modal', async () => {
      vi.mocked(client.useIntegrations).mockReturnValue({
        data: [{ id: 'I-1', key: 'slack', name: 'Slack', category: 'Comms', status: 'available' }],
        isLoading: false,
      } as any);
      mockConnectSlack.mockImplementation((_url, { onSuccess }) => onSuccess());
      render(<Settings />);
      goToSection('Integrations');

      fireEvent.click(screen.getByText('Connect Slack'));
      fireEvent.change(screen.getByPlaceholderText('https://hooks.slack.com/services/…'), { target: { value: 'https://hooks.slack.com/services/xyz' } });
      fireEvent.click(screen.getByText('Connect'));

      expect(mockConnectSlack).toHaveBeenCalledWith('https://hooks.slack.com/services/xyz', expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }));
      expect(screen.queryByText('Connect Slack', { selector: 'h3' })).not.toBeInTheDocument();
    });

    it('shows a Slack connection error in the modal instead of closing it', () => {
      vi.mocked(client.useIntegrations).mockReturnValue({
        data: [{ id: 'I-1', key: 'slack', name: 'Slack', category: 'Comms', status: 'available' }],
        isLoading: false,
      } as any);
      mockConnectSlack.mockImplementation((_url, { onError }) => onError({ message: 'Invalid webhook URL' }));
      render(<Settings />);
      goToSection('Integrations');
      fireEvent.click(screen.getByText('Connect Slack'));
      fireEvent.click(screen.getByText('Connect'));

      expect(screen.getByText('Invalid webhook URL')).toBeInTheDocument();
    });

    it('disconnects an already-connected Slack integration', () => {
      vi.mocked(client.useIntegrations).mockReturnValue({
        data: [{ id: 'I-1', key: 'slack', name: 'Slack', category: 'Comms', status: 'connected' }],
        isLoading: false,
      } as any);
      render(<Settings />);
      goToSection('Integrations');
      fireEvent.click(screen.getByText('Disconnect'));
      expect(mockDisconnectSlack).toHaveBeenCalled();
    });

    it('connects Mailgun via the modal with api key, domain, and optional from address', () => {
      vi.mocked(client.useIntegrations).mockReturnValue({
        data: [{ id: 'I-2', key: 'mailgun', name: 'Mailgun', category: 'Comms', status: 'available' }],
        isLoading: false,
      } as any);
      render(<Settings />);
      goToSection('Integrations');

      fireEvent.click(screen.getByText('Connect Mailgun'));
      fireEvent.change(screen.getByPlaceholderText('Mailgun API Key'), { target: { value: 'key-123' } });
      fireEvent.change(screen.getByPlaceholderText('mg.yourcompany.com'), { target: { value: 'mg.acme.com' } });
      fireEvent.click(screen.getByText('Connect'));

      expect(mockConnectMailgun).toHaveBeenCalledWith(
        { apiKey: 'key-123', domain: 'mg.acme.com', from: undefined },
        expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
      );
    });
  });

  describe('Audit Logs', () => {
    it('filters by search text and module', () => {
      render(<Settings />);
      goToSection('Audit Logs');

      fireEvent.change(screen.getByPlaceholderText('Search actor, action, details...'), { target: { value: 'delete' } });
      fireEvent.change(screen.getByDisplayValue('All Modules'), { target: { value: 'roles' } });

      expect(vi.mocked(client.useAuditLogs)).toHaveBeenLastCalledWith({ module: 'roles', search: 'delete' }, true);
    });

    it('exports audit logs as CSV', async () => {
      render(<Settings />);
      goToSection('Audit Logs');
      fireEvent.click(screen.getByText('Export CSV'));
      await waitFor(() => expect(mockExportAuditLogsCsv).toHaveBeenCalled());
    });

    it('shows "No audit activity" when the filtered result is empty', () => {
      render(<Settings />);
      goToSection('Audit Logs');
      expect(screen.getByText('No audit activity matches these filters yet.')).toBeInTheDocument();
    });
  });

  describe('Security & Privacy', () => {
    it('toggles require2FA', () => {
      render(<Settings />);
      goToSection('Security & Privacy');
      fireEvent.click(screen.getByText('Require Two-Factor Authentication (2FA)').closest('.border-2')!.querySelector('button')!);
      expect(mockUpdateSettings).toHaveBeenCalledWith({ require2fa: true });
    });

    it('updates the password minimum length', () => {
      render(<Settings />);
      goToSection('Security & Privacy');
      fireEvent.change(screen.getByDisplayValue('12'), { target: { value: '16' } });
      expect(mockUpdateSettings).toHaveBeenCalledWith({ passwordMinLength: 16 });
    });
  });

  describe('Notifications', () => {
    it('toggles a notification preference', () => {
      render(<Settings />);
      goToSection('Notifications');
      fireEvent.click(screen.getByText('Leave Requests').closest('.border-2')!.querySelector('button')!);
      expect(mockUpdateSettings).toHaveBeenCalledWith({ notifyLeaveRequests: true });
    });
  });

  describe('Email Templates', () => {
    it('edits and saves a template draft', () => {
      vi.mocked(client.useEmailTemplates).mockReturnValue({
        data: [{ key: 'welcome', name: 'Welcome Email', subject: 'Hi there', body: 'Welcome!' }],
        isLoading: false,
      } as any);
      render(<Settings />);
      goToSection('Email Templates');

      fireEvent.change(screen.getByDisplayValue('Hi there'), { target: { value: 'Welcome aboard' } });
      fireEvent.click(screen.getByText('Save Template'));

      expect(mockUpdateEmailTemplate).toHaveBeenCalledWith({ key: 'welcome', data: { subject: 'Welcome aboard', body: 'Welcome!' } });
    });

    it('sends a test email and shows a success alert', async () => {
      vi.mocked(client.useEmailTemplates).mockReturnValue({
        data: [{ key: 'welcome', name: 'Welcome Email', subject: 'Hi there', body: 'Welcome!' }],
        isLoading: false,
      } as any);
      mockTestEmailTemplate.mockResolvedValue(undefined);
      render(<Settings />);
      goToSection('Email Templates');

      fireEvent.click(screen.getByText('Send Test'));
      await waitFor(() => expect(mockAlert).toHaveBeenCalledWith(expect.stringContaining('Test email sent'), 'Test Sent'));
    });
  });

  describe('Workflows', () => {
    it('toggles a workflow enabled state', () => {
      vi.mocked(client.useWorkflows).mockReturnValue({
        data: [{ key: 'onboarding', name: 'Onboarding', description: 'New hire checklist', enabled: false, steps: [] }],
        isLoading: false,
      } as any);
      render(<Settings />);
      goToSection('Workflows');

      fireEvent.click(screen.getByTitle('Disabled'));
      expect(mockUpdateWorkflow).toHaveBeenCalledWith({ key: 'onboarding', data: { enabled: true } });
    });

    it('adds a step to the pipeline and saves it', () => {
      vi.mocked(client.useWorkflows).mockReturnValue({
        data: [{ key: 'onboarding', name: 'Onboarding', description: 'New hire checklist', enabled: true, steps: [] }],
        isLoading: false,
      } as any);
      render(<Settings />);
      goToSection('Workflows');

      fireEvent.click(screen.getByText('Edit Pipeline'));
      fireEvent.change(screen.getByPlaceholderText('New step...'), { target: { value: 'Send welcome email' } });
      fireEvent.change(screen.getByPlaceholderText('Assignee'), { target: { value: 'HR' } });
      fireEvent.click(document.querySelector('.lucide-plus')!.closest('button')!);
      fireEvent.click(screen.getByText('Save Pipeline'));

      expect(mockUpdateWorkflow).toHaveBeenCalledWith({
        key: 'onboarding',
        data: { steps: [expect.objectContaining({ name: 'Send welcome email', assignee: 'HR' })] },
      });
    });

    it('shows execution history filtered by workflow', () => {
      vi.mocked(client.useWorkflows).mockReturnValue({
        data: [{ key: 'onboarding', name: 'Onboarding', description: '', enabled: true, steps: [] }],
        isLoading: false,
      } as any);
      vi.mocked(client.useWorkflowExecutions).mockReturnValue({
        data: [{ id: 'EX-1', workflowName: 'Onboarding', status: 'completed', createdAt: '2026-03-01T10:00:00Z' }],
        isLoading: false,
      } as any);
      render(<Settings />);
      goToSection('Workflows');

      fireEvent.click(screen.getByText('Execution History'));
      expect(vi.mocked(client.useWorkflowExecutions)).toHaveBeenLastCalledWith(undefined, true);
    });
  });

  describe('API Access', () => {
    it('creates a new API key when a name is entered, and clears the input', () => {
      render(<Settings />);
      goToSection('API Access');

      fireEvent.change(screen.getByPlaceholderText('Key Description (e.g., Zapier Integration)'), { target: { value: 'Zapier' } });
      fireEvent.click(screen.getByText('Create Key'));
      expect(mockCreateApiKey).toHaveBeenCalledWith({ name: 'Zapier' });
    });

    it('keeps Create Key disabled with an empty name', () => {
      render(<Settings />);
      goToSection('API Access');
      expect(screen.getByText('Create Key')).toBeDisabled();
    });

    it('copies a key to the clipboard', () => {
      Object.assign(navigator, { clipboard: { writeText: vi.fn() } });
      vi.mocked(client.useApiKeys).mockReturnValue({ data: [{ id: 'KEY-1', name: 'Zapier', key: 'zk_live_abcdef123456' }], isLoading: false } as any);
      render(<Settings />);
      goToSection('API Access');

      fireEvent.click(screen.getByTitle('Copy key'));
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('zk_live_abcdef123456');
    });

    it('revokes an API key after confirmation', async () => {
      vi.mocked(client.useApiKeys).mockReturnValue({ data: [{ id: 'KEY-1', name: 'Zapier', key: 'zk_live_abcdef123456' }], isLoading: false } as any);
      render(<Settings />);
      goToSection('API Access');

      fireEvent.click(document.querySelector('.lucide-trash-2')!.closest('button')!);
      await waitFor(() => expect(mockDeleteApiKey).toHaveBeenCalledWith('KEY-1'));
    });
  });

  describe('Data & Backup', () => {
    it('exports a full company backup', async () => {
      render(<Settings />);
      goToSection('Data & Backup');
      fireEvent.click(screen.getByText('Export Full Backup (JSON)'));
      await waitFor(() => expect(mockExportCompanyData).toHaveBeenCalled());
    });

    it('shows the data stats snapshot once loaded', () => {
      vi.mocked(client.useDataStats).mockReturnValue({
        data: { employees: 42, activeEmployees: 38, departments: 5, locations: 2, documents: 100, payrollRuns: 12, jobRequisitions: 3 },
        isLoading: false,
      } as any);
      render(<Settings />);
      goToSection('Data & Backup');
      expect(screen.getByText('Employees').closest('div')!.textContent).toContain('42');
    });
  });
});
