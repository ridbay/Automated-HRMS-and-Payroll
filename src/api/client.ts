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
