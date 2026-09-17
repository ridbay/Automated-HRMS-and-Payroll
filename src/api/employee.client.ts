import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Employee } from '../types';
import { API_URL, fetchWithTenant } from './http';

export const fetchEmployees = async (): Promise<Employee[]> => {
  const res = await fetchWithTenant(`${API_URL}/admin/employees`);
  if (!res.ok) throw new Error('Failed to fetch employees');
  return res.json();
};

export const createEmployee = async (newEmployee: Partial<Employee>): Promise<Employee> => {
  const res = await fetchWithTenant(`${API_URL}/admin/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newEmployee),
  });
  if (!res.ok) {
    let errorMsg = 'Failed to create employee';
    try {
      const errData = await res.json();
      if (errData.error) errorMsg = errData.error;
    } catch (e) {}
    throw new Error(errorMsg);
  }
  return res.json();
};

export const useEmployees = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['employees'],
    queryFn: fetchEmployees,
    enabled,
  });
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};

export const useUpdateAdminEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetchWithTenant(`${API_URL}/admin/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update employee');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};

export const useDeleteAdminEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetchWithTenant(`${API_URL}/admin/employees/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete employee');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};

// Issues a brand-new temporary password for an employee and invalidates the old one.
export const useResetTemporaryPassword = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (employeeId: string) => {
      const res = await fetchWithTenant(
        `${API_URL}/admin/employees/${employeeId}/reset-temporary-password`,
        { method: 'POST' }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to reset temporary password');
      }
      return res.json();
    },
    onSuccess: (_data, employeeId) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
    },
  });
};

export const useEmployeeProfile = (id: string) => {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/employees/${id}`);
      if (!res.ok) throw new Error('Failed to fetch employee profile');
      return res.json();
    },
    enabled: !!id,
  });
};

export const useEmployeeDirectReports = (id: string) => {
  return useQuery({
    queryKey: ['employee', id, 'direct-reports'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/employees/${id}/direct-reports`);
      if (!res.ok) throw new Error('Failed to fetch direct reports');
      return res.json();
    },
    enabled: !!id,
  });
};

export const useAddAdminEmergencyContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, data }: { employeeId: string; data: any }) => {
      const res = await fetchWithTenant(
        `${API_URL}/admin/employees/${employeeId}/emergency-contacts`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }
      );
      if (!res.ok) throw new Error('Failed to add emergency contact');
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employee', variables.employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};

export const useDeleteAdminEmergencyContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, contactId }: { employeeId: string; contactId: string }) => {
      const res = await fetchWithTenant(
        `${API_URL}/admin/employees/${employeeId}/emergency-contacts/${contactId}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error('Failed to delete emergency contact');
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employee', variables.employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};

export const useUploadEmployeeDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      employeeId,
      file,
      name,
      type,
    }: {
      employeeId: string;
      file: File;
      name: string;
      type: string;
    }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
      formData.append('type', type);
      const res = await fetchWithTenant(`${API_URL}/admin/employees/${employeeId}/documents`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to upload document');
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employee', variables.employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};

export const useDeleteEmployeeDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, documentId }: { employeeId: string; documentId: string }) => {
      const res = await fetchWithTenant(
        `${API_URL}/admin/employees/${employeeId}/documents/${documentId}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error('Failed to delete document');
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employee', variables.employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};

// --- Employee Self-Service ---

export const useMyProfile = () => {
  return useQuery({
    queryKey: ['myProfile'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/employee/me`);
      if (!res.ok) throw new Error('Failed to fetch employee profile');
      return res.json();
    },
  });
};

export const useDirectory = () => {
  return useQuery({
    queryKey: ['directory'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/employee/directory`);
      if (!res.ok) throw new Error('Failed to fetch directory');
      return res.json();
    },
  });
};

export const useUpdateMyProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetchWithTenant(`${API_URL}/employee/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update employee profile');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
    },
  });
};

export const useAddEmergencyContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetchWithTenant(`${API_URL}/employee/me/emergency-contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to add emergency contact');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
    },
  });
};

export const useDeleteEmergencyContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithTenant(`${API_URL}/employee/me/emergency-contacts/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete emergency contact');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
    },
  });
};

export const useUploadDocumentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetchWithTenant(`${API_URL}/employee/me/documents`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload document');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
    },
  });
};

export const useDeleteDocumentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetchWithTenant(`${API_URL}/employee/me/documents/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete document');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
    },
  });
};

export const getDocumentDownloadUrl = (id: string, companyId?: string, employeeId?: string) => {
  const queryParams = [];
  if (companyId) queryParams.push(`companyId=${companyId}`);
  if (employeeId) queryParams.push(`employeeId=${employeeId}`);
  const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
  return `${API_URL}/employee/me/documents/${id}/download${queryString}`;
};

export const useShoutouts = () => {
  return useQuery({
    queryKey: ['shoutouts'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/employee/feedback`);
      if (!res.ok) throw new Error('Failed to fetch shoutouts');
      return res.json();
    },
  });
};

export const useSendShoutout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      toEmployeeName: string;
      toEmployeeId?: string;
      type: string;
      message: string;
    }) => {
      const res = await fetchWithTenant(`${API_URL}/employee/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to send shoutout');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shoutouts'] });
      queryClient.invalidateQueries({ queryKey: ['myPerformanceSummary'] });
    },
  });
};

// Admin-view employee-level resources (payslips, benefits, trainings, assessments, assets, audit logs)

export const useEmployeePayslips = (employeeId: string) => {
  return useQuery({
    queryKey: ['employeePayslips', employeeId],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/payroll/employee/${employeeId}/payslips`);
      if (!res.ok) throw new Error('Failed to fetch payslips');
      const json = await res.json();
      return json.data;
    },
    enabled: !!employeeId,
  });
};

export const useEmployeeBenefits = (employeeId: string) => {
  return useQuery({
    queryKey: ['employeeBenefits', employeeId],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/benefits/employee/${employeeId}`);
      if (!res.ok) throw new Error('Failed to fetch benefits');
      return res.json();
    },
    enabled: !!employeeId,
  });
};

export const useUpdateEmployeeBenefits = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, data }: { employeeId: string; data: any }) => {
      const res = await fetchWithTenant(`${API_URL}/admin/benefits/employee/${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update benefits');
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employeeBenefits', variables.employeeId] });
    },
  });
};

export const useEmployeeTrainings = (employeeId: string) => {
  return useQuery({
    queryKey: ['employeeTrainings', employeeId],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/training/employee/${employeeId}`);
      if (!res.ok) throw new Error('Failed to fetch trainings');
      return res.json();
    },
    enabled: !!employeeId,
  });
};

export const useAddEmployeeTraining = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, data }: { employeeId: string; data: any }) => {
      const res = await fetchWithTenant(`${API_URL}/training/employee/${employeeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to add training');
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employeeTrainings', variables.employeeId] });
    },
  });
};

export const useEmployeeAssessments = (employeeId: string) => {
  return useQuery({
    queryKey: ['employeeAssessments', employeeId],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/performance/employee/${employeeId}`);
      if (!res.ok) throw new Error('Failed to fetch assessments');
      return res.json();
    },
    enabled: !!employeeId,
  });
};

export const useCreateAssessment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, data }: { employeeId: string; data: any }) => {
      const res = await fetchWithTenant(`${API_URL}/admin/performance/employee/${employeeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create assessment');
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employeeAssessments', variables.employeeId] });
    },
  });
};

export const useEmployeeLeaveBalances = (employeeId: string) => {
  return useQuery({
    queryKey: ['adminLeaveBalances', employeeId],
    queryFn: async () => {
      const res = await fetchWithTenant(
        `${API_URL}/admin/leaves/employee/${employeeId}/balances`
      );
      if (!res.ok) throw new Error('Failed to fetch leave balances');
      return res.json();
    },
    enabled: !!employeeId,
  });
};

export const useEmployeeLeaveRequests = (employeeId: string) => {
  return useQuery({
    queryKey: ['employeeLeaveRequests', employeeId],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/leaves/employee/${employeeId}/requests`);
      if (!res.ok) throw new Error('Failed to fetch leave requests');
      return res.json();
    },
    enabled: !!employeeId,
  });
};

export const useEmployeeAuditLogs = (employeeId: string) => {
  return useQuery({
    queryKey: ['employeeAuditLogs', employeeId],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/employees/${employeeId}/audit-logs`);
      if (!res.ok) throw new Error('Failed to fetch audit logs');
      return res.json();
    },
    enabled: !!employeeId,
  });
};

export const useEmployeeAssets = (employeeId: string) => {
  return useQuery({
    queryKey: ['employeeAssets', employeeId],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/employees/${employeeId}/assets`);
      if (!res.ok) throw new Error('Failed to fetch assets');
      return res.json();
    },
    enabled: !!employeeId,
  });
};

export const useAddEmployeeAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, data }: { employeeId: string; data: any }) => {
      const res = await fetchWithTenant(`${API_URL}/admin/employees/${employeeId}/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to add asset');
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employeeAssets', variables.employeeId] });
    },
  });
};

export const useDeleteEmployeeAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, assetId }: { employeeId: string; assetId: string }) => {
      const res = await fetchWithTenant(
        `${API_URL}/admin/employees/${employeeId}/assets/${assetId}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error('Failed to delete asset');
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employeeAssets', variables.employeeId] });
    },
  });
};
