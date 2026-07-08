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
