import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Employee, JobRequisition, LeaveRequest } from '../types';
import { MOCK_EMPLOYEES, MOCK_REQUISITIONS, MOCK_LEAVE_REQUESTS } from '../data/mocks';

const API_URL = 'http://127.0.0.1:8787';
const MOCK_COMPANY_ID = 'comp-1234'; // Simulated logged-in tenant

const fetchWithTenant = async (url: string, options: RequestInit = {}) => {
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'x-company-id': MOCK_COMPANY_ID,
    },
  });
};

// API Fetchers
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
  if (!res.ok) throw new Error('Failed to create employee');
  return res.json();
};

export const fetchJobRequisitions = async (): Promise<JobRequisition[]> => {
  const res = await fetchWithTenant(`${API_URL}/admin/job-requisitions`);
  if (!res.ok) throw new Error('Failed to fetch job requisitions');
  return res.json();
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
export const useEmployees = () => {
  return useQuery({
    queryKey: ['employees'],
    queryFn: fetchEmployees,
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

export const useDeleteJobRequisition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetchWithTenant(`${API_URL}/admin/jobs/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete job requisition');
      const json = await response.json();
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};

// --- Settings & API Keys API ---

export const useSettings = () => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await fetchWithTenant(`${API_URL}/admin/settings`);
      if (!response.ok) throw new Error('Failed to fetch settings');
      const json = await response.json();
      return json;
    },
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

export const useApiKeys = () => {
  return useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const response = await fetchWithTenant(`${API_URL}/admin/api-keys`);
      if (!response.ok) throw new Error('Failed to fetch API keys');
      const json = await response.json();
      return json;
    },
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

export const useJobRequisitions = () => {
  return useQuery({
    queryKey: ['jobRequisitions'],
    queryFn: fetchJobRequisitions,
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
export const useCompany = () => {
  return useQuery({
    queryKey: ['company'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/company`);
      if (!res.ok) throw new Error('Failed to fetch company profile');
      return res.json();
    },
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
export const useDepartments = () => {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/departments`);
      if (!res.ok) throw new Error('Failed to fetch departments');
      return res.json();
    },
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

export const useLocations = () => {
  return useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/locations`);
      if (!res.ok) throw new Error('Failed to fetch locations');
      return res.json();
    },
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
export const useRoles = () => {
  return useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/roles`);
      if (!res.ok) throw new Error('Failed to fetch roles');
      return res.json();
    },
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
