import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL, fetchWithTenant } from './http';

// --- Dashboard ---

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/dashboard/stats`);
      if (!res.ok) throw new Error('Failed to fetch dashboard stats');
      return res.json();
    },
  });
};

// --- Company Settings & API Keys ---

export const useSettings = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await fetchWithTenant(`${API_URL}/admin/settings`);
      if (!response.ok) throw new Error('Failed to fetch settings');
      return response.json();
    },
    enabled,
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetchWithTenant(`${API_URL}/admin/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update settings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
};

export const useApiKeys = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const response = await fetchWithTenant(`${API_URL}/admin/api-keys`);
      if (!response.ok) throw new Error('Failed to fetch API keys');
      return response.json();
    },
    enabled,
  });
};

export const useCreateApiKey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string }) => {
      const response = await fetchWithTenant(`${API_URL}/admin/api-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create API key');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });
};

export const useDeleteApiKey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetchWithTenant(`${API_URL}/admin/api-keys/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete API key');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });
};

// --- Company Profile ---

export const useCompany = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['company'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/company`);
      if (!res.ok) throw new Error('Failed to fetch company profile');
      return res.json();
    },
    enabled,
  });
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetchWithTenant(`${API_URL}/admin/company`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update company profile');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
      queryClient.invalidateQueries({ queryKey: ['company-branding'] });
      window.dispatchEvent(new Event('zenhr:branding_updated'));
    },
  });
};

// Real R2-backed upload (POST /admin/company/logo)
export const useUploadCompanyLogo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      const res = await fetchWithTenant(`${API_URL}/admin/company/logo`, {
        method: 'POST',
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to upload logo');
      }
      const body = await res.json();
      return body.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
      queryClient.invalidateQueries({ queryKey: ['company-branding'] });
      window.dispatchEvent(new Event('zenhr:branding_updated'));
    },
  });
};

// Deletes the company logo (DELETE /admin/company/logo)
export const useDeleteCompanyLogo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/company/logo`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to remove logo');
      }
      const body = await res.json();
      return body.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
      queryClient.invalidateQueries({ queryKey: ['company-branding'] });
      window.dispatchEvent(new Event('zenhr:branding_updated'));
    },
  });
};

// Read company branding (employee or admin)
export const useCompanyBranding = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['company-branding'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/employee/company/branding`);
      if (!res.ok) throw new Error('Failed to fetch branding');
      return res.json();
    },
    enabled,
  });
};

// --- Org: Departments & Locations ---

export const useDepartments = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/departments`);
      if (!res.ok) throw new Error('Failed to fetch departments');
      return res.json();
    },
    enabled,
  });
};

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetchWithTenant(`${API_URL}/admin/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create department');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] }),
  });
};

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithTenant(`${API_URL}/admin/departments/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete department');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] }),
  });
};

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetchWithTenant(`${API_URL}/admin/departments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update department');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] }),
  });
};

export const useDepartmentMembers = (departmentId?: string) => {
  return useQuery({
    queryKey: ['departments', departmentId, 'members'],
    queryFn: async () => {
      const res = await fetchWithTenant(
        `${API_URL}/admin/departments/${departmentId}/members`
      );
      if (!res.ok) throw new Error('Failed to fetch department members');
      return res.json();
    },
    enabled: !!departmentId,
  });
};

export const useAssignDepartmentMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      departmentId,
      employeeId,
    }: {
      departmentId: string;
      employeeId: string;
    }) => {
      const res = await fetchWithTenant(
        `${API_URL}/admin/departments/${departmentId}/members`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeId }),
        }
      );
      if (!res.ok) throw new Error('Failed to add employee to department');
      return res.json();
    },
    onSuccess: (_data, { departmentId }) => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['departments', departmentId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};

export const useRemoveDepartmentMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      departmentId,
      employeeId,
    }: {
      departmentId: string;
      employeeId: string;
    }) => {
      const res = await fetchWithTenant(
        `${API_URL}/admin/departments/${departmentId}/members/${employeeId}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error('Failed to remove employee from department');
      return res.json();
    },
    onSuccess: (_data, { departmentId }) => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['departments', departmentId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};

export const useLocations = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/locations`);
      if (!res.ok) throw new Error('Failed to fetch locations');
      return res.json();
    },
    enabled,
  });
};

export const useCreateLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetchWithTenant(`${API_URL}/admin/locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create location');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['locations'] }),
  });
};

export const useDeleteLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithTenant(`${API_URL}/admin/locations/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete location');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['locations'] }),
  });
};

// --- Roles & Permissions ---

export const useRoles = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/roles`);
      if (!res.ok) throw new Error('Failed to fetch roles');
      return res.json();
    },
    enabled,
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetchWithTenant(`${API_URL}/admin/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create role');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetchWithTenant(`${API_URL}/admin/roles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update role');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithTenant(`${API_URL}/admin/roles/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete role');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  });
};

// --- Public Holidays ---

export const useHolidays = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['holidays'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/holidays`);
      if (!res.ok) throw new Error('Failed to fetch holidays');
      return res.json();
    },
    enabled,
  });
};

export const useCreateHoliday = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; date: string }) => {
      const res = await fetchWithTenant(`${API_URL}/admin/holidays`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to add holiday');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['holidays'] }),
  });
};

export const useDeleteHoliday = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithTenant(`${API_URL}/admin/holidays/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to remove holiday');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['holidays'] }),
  });
};

// --- Email Templates ---

export const useEmailTemplates = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['emailTemplates'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/email-templates`);
      if (!res.ok) throw new Error('Failed to fetch email templates');
      return res.json();
    },
    enabled,
  });
};

export const useUpdateEmailTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, data }: { key: string; data: { subject: string; body: string } }) => {
      const res = await fetchWithTenant(`${API_URL}/admin/email-templates/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update email template');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['email-templates'] }),
  });
};

export const useTestEmailTemplate = () => {
  return useMutation({
    mutationFn: async ({ key, to }: { key: string; to?: string }) => {
      const res = await fetchWithTenant(`${API_URL}/admin/email-templates/${key}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(to ? { to } : {}),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to send test email');
      }
      return res.json();
    },
  });
};

// --- Integrations ---

export const useIntegrations = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/integrations`);
      if (!res.ok) throw new Error('Failed to fetch integrations');
      return res.json();
    },
    enabled,
  });
};

export const useToggleIntegration = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (key: string) => {
      const res = await fetchWithTenant(`${API_URL}/admin/integrations/${key}/toggle`, {
        method: 'PUT',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update integration');
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['integrations'] }),
  });
};

export const useConnectSlack = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (webhookUrl: string) => {
      const res = await fetchWithTenant(`${API_URL}/admin/integrations/slack/connect`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to connect Slack');
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['integrations'] }),
  });
};

export const useDisconnectSlack = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetchWithTenant(
        `${API_URL}/admin/integrations/slack/disconnect`,
        { method: 'POST' }
      );
      if (!res.ok) throw new Error('Failed to disconnect Slack');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['integrations'] }),
  });
};

export const useTestSlack = () => {
  return useMutation({
    mutationFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/integrations/slack/test`, {
        method: 'POST',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to send test message');
      }
      return res.json();
    },
  });
};

export const useIntegrationEvents = (key: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['integrationEvents', key],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/integrations/${key}/events`);
      if (!res.ok) throw new Error('Failed to fetch integration activity');
      return res.json();
    },
    enabled,
  });
};

export interface MailgunConfig {
  apiKey: string;
  domain: string;
  from?: string;
  baseUrl?: string;
}

export const useConnectMailgun = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (config: MailgunConfig) => {
      const res = await fetchWithTenant(`${API_URL}/admin/integrations/mailgun/connect`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to connect Mailgun');
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['integrations'] }),
  });
};

export const useDisconnectMailgun = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetchWithTenant(
        `${API_URL}/admin/integrations/mailgun/disconnect`,
        { method: 'POST' }
      );
      if (!res.ok) throw new Error('Failed to disconnect Mailgun');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['integrations'] }),
  });
};

export const useTestMailgun = () => {
  return useMutation({
    mutationFn: async (to?: string) => {
      const res = await fetchWithTenant(`${API_URL}/admin/integrations/mailgun/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(to ? { to } : {}),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to send test email');
      }
      return res.json();
    },
  });
};

// --- Workflows ---

export const useWorkflows = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/workflows`);
      if (!res.ok) throw new Error('Failed to fetch workflows');
      return res.json();
    },
    enabled,
  });
};

export const useUpdateWorkflow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      key,
      data,
    }: {
      key: string;
      data: { steps?: any[]; enabled?: boolean; description?: string };
    }) => {
      const res = await fetchWithTenant(`${API_URL}/admin/workflows/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update workflow');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflows'] }),
  });
};

export const useWorkflowExecutions = (workflowKey?: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['workflow-executions', workflowKey],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (workflowKey) query.set('key', workflowKey);
      query.set('limit', '20');
      const qs = query.toString();
      const res = await fetchWithTenant(`${API_URL}/admin/workflows/executions?${qs}`);
      if (!res.ok) throw new Error('Failed to fetch workflow executions');
      return res.json();
    },
    enabled,
  });
};

// --- Data & Backup ---

export const useDataStats = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['dataStats'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/data/stats`);
      if (!res.ok) throw new Error('Failed to fetch data stats');
      return res.json();
    },
    enabled,
  });
};

export const exportCompanyData = async () => {
  const res = await fetchWithTenant(`${API_URL}/admin/data/export`);
  if (!res.ok) throw new Error('Failed to export company data');
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : `zenhr-export-${new Date().toISOString().slice(0, 10)}.json`;
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

// --- Audit Logs ---

export const useAuditLogs = (
  filters: { module?: string; search?: string } = {},
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['auditLogs', filters],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (filters.module) query.set('module', filters.module);
      if (filters.search) query.set('search', filters.search);
      const qs = query.toString();
      const res = await fetchWithTenant(
        `${API_URL}/admin/audit-logs${qs ? `?${qs}` : ''}`
      );
      if (!res.ok) throw new Error('Failed to fetch audit logs');
      return res.json();
    },
    enabled,
  });
};

export const exportAuditLogsCsv = async () => {
  const res = await fetchWithTenant(`${API_URL}/admin/audit-logs/export`);
  if (!res.ok) throw new Error('Failed to export audit log');
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};
