import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Employee, JobRequisition, LeaveRequest } from '../types';
import { MOCK_EMPLOYEES, MOCK_REQUISITIONS, MOCK_LEAVE_REQUESTS } from '../data/mocks';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8787';
const MOCK_COMPANY_ID = 'comp-1234'; // Simulated logged-in tenant

const fetchWithTenant = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('zenhr_token');
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
    'x-company-id': MOCK_COMPANY_ID, // Fallback for pure admin mock without auth
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
};

// API Fetchers
export const loginUser = async (credentials: any) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Login failed');
  }
  return res.json();
};

export const registerCompany = async (data: any) => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Registration failed');
  }
  return res.json();
};

export const changeUserPassword = async (data: any) => {
  const res = await fetchWithTenant(`${API_URL}/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Password change failed');
  }
  return res.json();
};

export const fetchEmployees = async (): Promise<Employee[]> => {
  const res = await fetchWithTenant(`${API_URL}/admin/employees`);
  if (!res.ok) throw new Error('Failed to fetch employees');
  const data = await res.json();
  // Fallback to mock data if DB is empty for a seamless transition
  return data.length > 0 ? data : MOCK_EMPLOYEES;
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

// The API doesn't track the candidate pipeline yet, so every requisition it
// returns is padded with a zeroed-out stage breakdown to satisfy the shape
// the UI (kanban/grid/list) already renders against.
const withEmptyPipeline = (req: any): JobRequisition => ({
  ...req,
  applicantsByStage: req.applicantsByStage || {
    applied: 0,
    screening: 0,
    interview: 0,
    offer: 0,
    hired: 0,
  },
});

// All three requisition list views (all/pending/mine) read from the same
// table, so any create/approve/reject/status/delete mutation invalidates all
// of them together to keep every screen in sync.
const invalidateJobRequisitions = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['jobRequisitions'] });
  queryClient.invalidateQueries({ queryKey: ['pendingJobRequisitions'] });
  queryClient.invalidateQueries({ queryKey: ['myJobRequisitions'] });
};

export const fetchJobRequisitions = async (): Promise<JobRequisition[]> => {
  const res = await fetchWithTenant(`${API_URL}/admin/job-requisitions`);
  if (!res.ok) throw new Error('Failed to fetch job requisitions');
  const data = await res.json();
  return data.map(withEmptyPipeline);
};

export const fetchPendingJobRequisitions = async (): Promise<JobRequisition[]> => {
  const res = await fetchWithTenant(`${API_URL}/admin/job-requisitions/pending`);
  if (!res.ok) throw new Error('Failed to fetch pending job requisitions');
  const data = await res.json();
  return data.map(withEmptyPipeline);
};

export const fetchMyJobRequisitions = async (): Promise<JobRequisition[]> => {
  const res = await fetchWithTenant(`${API_URL}/admin/job-requisitions/mine`);
  if (!res.ok) throw new Error('Failed to fetch my job requisitions');
  const data = await res.json();
  return data.map(withEmptyPipeline);
};

export const fetchLeaveRequests = async (): Promise<LeaveRequest[]> => {
  const res = await fetchWithTenant(`${API_URL}/employee/leave-requests`);
  if (!res.ok) throw new Error('Failed to fetch leave requests');
  return res.json();
};

export const previewPayroll = async (month?: number, year?: number) => {
  const query = new URLSearchParams();
  if (month) query.append('month', month.toString());
  if (year) query.append('year', year.toString());

  const res = await fetchWithTenant(`${API_URL}/admin/payroll/preview?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to preview payroll');
  const json = await res.json();
  return json.data;
};

export const lockPayroll = async (payrollData: any) => {
  const res = await fetchWithTenant(`${API_URL}/admin/payroll/lock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payrollData),
  });
  if (!res.ok) throw new Error('Failed to lock payroll');
  const json = await res.json();
  return json.data;
};

// React Query Hooks
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
      const res = await fetchWithTenant(`${API_URL}/admin/employees/${employeeId}/emergency-contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
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
      const res = await fetchWithTenant(`${API_URL}/admin/employees/${employeeId}/emergency-contacts/${contactId}`, {
        method: 'DELETE',
      });
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
    mutationFn: async ({ employeeId, file, name, type }: { employeeId: string; file: File; name: string; type: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
      formData.append('type', type);

      const res = await fetchWithTenant(`${API_URL}/admin/employees/${employeeId}/documents`, {
        method: 'POST',
        body: formData, // fetch automatically sets the correct multipart/form-data boundary
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
      const res = await fetchWithTenant(`${API_URL}/admin/employees/${employeeId}/documents/${documentId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete document');
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employee', variables.employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};


export const useDeleteJobRequisition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetchWithTenant(`${API_URL}/admin/job-requisitions/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete job requisition');
      const json = await response.json();
      return json;
    },
    onSuccess: () => {
      invalidateJobRequisitions(queryClient);
    },
  });
};

export const useCreateJobRequisition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<JobRequisition>) => {
      const res = await fetchWithTenant(`${API_URL}/admin/job-requisitions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to submit job requisition');
      }
      return res.json();
    },
    onSuccess: () => {
      invalidateJobRequisitions(queryClient);
    },
  });
};

export const useApproveJobRequisition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithTenant(`${API_URL}/admin/job-requisitions/${id}/approve`, {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Failed to approve job requisition');
      return res.json();
    },
    onSuccess: () => {
      invalidateJobRequisitions(queryClient);
    },
  });
};

export const useRejectJobRequisition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const res = await fetchWithTenant(`${API_URL}/admin/job-requisitions/${id}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error('Failed to reject job requisition');
      return res.json();
    },
    onSuccess: () => {
      invalidateJobRequisitions(queryClient);
    },
  });
};

export const useUpdateJobRequisitionStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetchWithTenant(`${API_URL}/admin/job-requisitions/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update job requisition status');
      return res.json();
    },
    onSuccess: () => {
      invalidateJobRequisitions(queryClient);
    },
  });
};

// --- Settings & API Keys API ---

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

export const useSettings = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await fetchWithTenant(`${API_URL}/admin/settings`);
      if (!response.ok) throw new Error('Failed to fetch settings');
      const json = await response.json();
      return json;
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
      const json = await response.json();
      return json;
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
      const json = await response.json();
      return json;
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
      const json = await response.json();
      return json;
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
      const json = await response.json();
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });
};

export const useJobRequisitions = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['jobRequisitions'],
    queryFn: fetchJobRequisitions,
    enabled,
  });
};

// The pending-approval queue, for HR Admin / Super Admin reviewing requests.
export const usePendingJobRequisitions = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['pendingJobRequisitions'],
    queryFn: fetchPendingJobRequisitions,
    enabled,
  });
};

// A requester's own submitted requisitions (e.g. a Manager tracking their asks).
export const useMyJobRequisitions = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['myJobRequisitions'],
    queryFn: fetchMyJobRequisitions,
    enabled,
  });
};

export const useLeaveRequests = () => {
  return useQuery({
    queryKey: ['leaveRequests'],
    queryFn: fetchLeaveRequests,
  });
};

export const usePayrollPreview = (month?: number, year?: number) => {
  return useQuery({
    queryKey: ['payrollPreview', month, year],
    queryFn: () => previewPayroll(month, year),
  });
};

export const useLockPayroll = () => {
  return useMutation({
    mutationFn: lockPayroll,
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
      if (!res.ok) throw new Error('Failed to update company profile');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
    },
  });
};

// --- Org (Departments & Locations) ---
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
};

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithTenant(`${API_URL}/admin/departments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete department');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
};

export const useDepartmentMembers = (departmentId?: string) => {
  return useQuery({
    queryKey: ['departments', departmentId, 'members'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/departments/${departmentId}/members`);
      if (!res.ok) throw new Error('Failed to fetch department members');
      return res.json();
    },
    enabled: !!departmentId,
  });
};

export const useAssignDepartmentMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ departmentId, employeeId }: { departmentId: string; employeeId: string }) => {
      const res = await fetchWithTenant(`${API_URL}/admin/departments/${departmentId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId }),
      });
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
    mutationFn: async ({ departmentId, employeeId }: { departmentId: string; employeeId: string }) => {
      const res = await fetchWithTenant(`${API_URL}/admin/departments/${departmentId}/members/${employeeId}`, {
        method: 'DELETE',
      });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
};

export const useDeleteLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithTenant(`${API_URL}/admin/locations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete location');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
};

// --- Employee Self-Service API ---

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
      // NOTE: fetchWithTenant manually merges headers. We must NOT set Content-Type here so the browser sets it to multipart/form-data with boundary
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
      if (!response.ok) {
        throw new Error('Failed to delete document');
      }
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

export const useMyLeave = () => {
  return useQuery({
    queryKey: ['myLeave'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/employee/leave/me`);
      if (!res.ok) throw new Error('Failed to fetch leave data');
      return res.json();
    },
  });
};

export const useApplyLeave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetchWithTenant(`${API_URL}/employee/leave/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to apply for leave');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myLeave'] });
    },
  });
};

export const useMyAttendance = () => {
  return useQuery({
    queryKey: ['myAttendance'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/employee/attendance/me`);
      if (!res.ok) throw new Error('Failed to fetch attendance data');
      return res.json();
    },
  });
};

export const useClockIn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetchWithTenant(`${API_URL}/employee/attendance/clock-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to clock in');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAttendance'] });
    },
  });
};

export const useClockOut = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetchWithTenant(`${API_URL}/employee/attendance/clock-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to clock out');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAttendance'] });
    },
  });
};

export const useOvertimeRequests = () => {
  return useQuery({
    queryKey: ['myOvertime'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/employee/attendance/overtime`);
      if (!res.ok) throw new Error('Failed to fetch overtime requests');
      return res.json();
    },
  });
};

export const useSubmitOvertime = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetchWithTenant(`${API_URL}/employee/attendance/overtime`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to submit overtime');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myOvertime'] });
    },
  });
};

export const useTeamLeaves = () => {
  return useQuery({
    queryKey: ['teamLeaves'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/employee/leave/team`);
      if (!res.ok) throw new Error('Failed to fetch team leaves');
      return res.json();
    },
  });
};

// Manager-scoped pending leave requests for the caller's direct reports.
export const useTeamPendingLeaves = () => {
  return useQuery({
    queryKey: ['teamPendingLeaves'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/employee/leave/team-requests`);
      if (!res.ok) throw new Error('Failed to fetch pending team leave requests');
      return res.json();
    },
  });
};

export const useUpdateTeamLeaveStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, managerComment }: { id: string; status: 'approved' | 'rejected'; managerComment?: string }) => {
      const res = await fetchWithTenant(`${API_URL}/employee/leave/team-requests/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, managerComment }),
      });
      if (!res.ok) throw new Error('Failed to update leave request status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamPendingLeaves'] });
      queryClient.invalidateQueries({ queryKey: ['teamLeaves'] });
    },
  });
};

export const useAdminLeaveRequests = () => {
  return useQuery({
    queryKey: ['adminLeaves'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/leaves`);
      if (!res.ok) throw new Error('Failed to fetch admin leaves');
      return res.json();
    },
  });
};

export const useUpdateLeaveRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, days, managerComment }: any) => {
      const res = await fetchWithTenant(`${API_URL}/admin/leaves/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, days, managerComment }),
      });
      if (!res.ok) throw new Error('Failed to update leave request');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLeaves'] });
    },
  });
};

export const useEmployeeLeaveBalances = (employeeId: string) => {
  return useQuery({
    queryKey: ['adminLeaveBalances', employeeId],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/leaves/employee/${employeeId}/balances`);
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
      const res = await fetchWithTenant(`${API_URL}/admin/employees/${employeeId}/assets/${assetId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete asset');
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employeeAssets', variables.employeeId] });
    },
  });
};
export const useUpdateLeaveBalances = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, balances }: any) => {
      const res = await fetchWithTenant(`${API_URL}/admin/leaves/employee/${employeeId}/balances`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ balances }),
      });
      if (!res.ok) throw new Error('Failed to update leave balances');
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminLeaveBalances', variables.employeeId] });
    },
  });
};

export const useMyCompensation = () => {
  return useQuery({
    queryKey: ['myCompensation'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/employee/me/compensation`);
      if (!res.ok) throw new Error('Failed to fetch compensation data');
      return res.json();
    },
  });
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

export const useMyAssessments = () => {
  return useQuery({
    queryKey: ['myAssessments'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/employee/assessments`);
      if (!res.ok) throw new Error('Failed to fetch assessments');
      return res.json();
    },
  });
};

export const useActiveCycleAssessment = (cycleName: string) => {
  return useQuery({
    queryKey: ['activeCycleAssessment', cycleName],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/employee/assessments/active?cycle=${encodeURIComponent(cycleName)}`);
      if (!res.ok) throw new Error('Failed to fetch active assessment');
      return res.json();
    },
    enabled: !!cycleName,
  });
};

export const createAssessment = async (data: any) => {
  const token = localStorage.getItem('zenhr_token');
  const res = await fetch(`${API_URL}/employee/assessments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create assessment');
  return res.json();
};

export const updateAssessment = async (id: string, data: any) => {
  const token = localStorage.getItem('zenhr_token');
  const res = await fetch(`${API_URL}/employee/assessments/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update assessment');
  return res.json();
};

export const submitAssessment = async (id: string) => {
  const token = localStorage.getItem('zenhr_token');
  const res = await fetch(`${API_URL}/employee/assessments/${id}/submit`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Failed to submit assessment');
  return res.json();
};
export const useEmployeePayslips = (employeeId: string) => {
  return useQuery({
    queryKey: ['employeePayslips', employeeId],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/payroll/employee/${employeeId}/payslips`);
      if (!res.ok) throw new Error('Failed to fetch payslips');
      return res.json();
    },
    enabled: !!employeeId,
  });
};

export const useEmployeeBenefits = (employeeId: string) => {
  return useQuery({
    queryKey: ['employeeBenefits', employeeId],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/benefits/employee/${employeeId}`);
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
      const res = await fetchWithTenant(`${API_URL}/benefits/employee/${employeeId}`, {
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
      const res = await fetchWithTenant(`${API_URL}/performance/employee/${employeeId}`);
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
      const res = await fetchWithTenant(`${API_URL}/performance/employee/${employeeId}`, {
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
