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

export const useSupportTickets = () => {
  return useQuery({
    queryKey: ['supportTickets'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/support/tickets`);
      if (!res.ok) throw new Error('Failed to fetch support tickets');
      return res.json();
    },
  });
};

export const useCreateSupportTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetchWithTenant(`${API_URL}/support/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create ticket');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['supportTickets'] }),
  });
};

export const useUpdateSupportTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetchWithTenant(`${API_URL}/support/tickets/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update ticket status');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['supportTickets'] }),
  });
};

export const useTicketMessages = (ticketId: string) => {
  return useQuery({
    queryKey: ['ticketMessages', ticketId],
    queryFn: async () => {
      if (!ticketId) return [];
      const res = await fetchWithTenant(`${API_URL}/support/tickets/${ticketId}/messages`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
    enabled: !!ticketId,
  });
};

export const useAddTicketMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: string; message: string }) => {
      const res = await fetchWithTenant(`${API_URL}/support/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) throw new Error('Failed to add message');
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ticketMessages', variables.ticketId] });
    },
  });
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

// Recomputes a preview with per-employee overrides (bonuses / ad-hoc
// deductions) entered in the wizard, without persisting anything.
export const useRecomputePayrollPreview = () => {
  return useMutation({
    mutationFn: async (payload: { periodMonth: number; periodYear: number; overrides?: Record<string, any> }) => {
      const res = await fetchWithTenant(`${API_URL}/admin/payroll/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to recompute payroll preview');
      const json = await res.json();
      return json.data;
    },
  });
};

export const usePayrollDashboard = (month?: number, year?: number) => {
  return useQuery({
    queryKey: ['payrollDashboard', month, year],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (month) query.append('month', month.toString());
      if (year) query.append('year', year.toString());
      const res = await fetchWithTenant(`${API_URL}/admin/payroll/dashboard?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch payroll dashboard');
      const json = await res.json();
      return json.data;
    },
  });
};

// --- Payroll Settings ---
export const usePayrollSettings = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['payrollSettings'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/payroll/settings`);
      if (!res.ok) throw new Error('Failed to fetch payroll settings');
      const json = await res.json();
      return json.data;
    },
    enabled,
  });
};

export const useUpdatePayrollSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetchWithTenant(`${API_URL}/admin/payroll/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update payroll settings');
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payrollSettings'] }),
  });
};

// --- Tax Brackets ---
export const useTaxBrackets = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['taxBrackets'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/payroll/tax-brackets`);
      if (!res.ok) throw new Error('Failed to fetch tax brackets');
      const json = await res.json();
      return json.data;
    },
    enabled,
  });
};

export const useUpdateTaxBrackets = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (brackets: any[]) => {
      const res = await fetchWithTenant(`${API_URL}/admin/payroll/tax-brackets`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brackets }),
      });
      if (!res.ok) throw new Error('Failed to update tax brackets');
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxBrackets'] });
      queryClient.invalidateQueries({ queryKey: ['payrollPreview'] });
    },
  });
};

// --- Salary Components ---
export const useSalaryComponents = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['salaryComponents'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/payroll/salary-components`);
      if (!res.ok) throw new Error('Failed to fetch salary components');
      const json = await res.json();
      return json.data;
    },
    enabled,
  });
};

export const useCreateSalaryComponent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetchWithTenant(`${API_URL}/admin/payroll/salary-components`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create salary component');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['salaryComponents'] }),
  });
};

export const useUpdateSalaryComponent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetchWithTenant(`${API_URL}/admin/payroll/salary-components/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update salary component');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['salaryComponents'] }),
  });
};

export const useDeleteSalaryComponent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithTenant(`${API_URL}/admin/payroll/salary-components/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete salary component');
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['salaryComponents'] }),
  });
};

// --- Pay Grades ---
export const usePayGrades = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['payGrades'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/payroll/pay-grades`);
      if (!res.ok) throw new Error('Failed to fetch pay grades');
      const json = await res.json();
      return json.data;
    },
    enabled,
  });
};

export const useCreatePayGrade = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetchWithTenant(`${API_URL}/admin/payroll/pay-grades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create pay grade');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payGrades'] }),
  });
};

export const useUpdatePayGrade = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetchWithTenant(`${API_URL}/admin/payroll/pay-grades/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update pay grade');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payGrades'] }),
  });
};

export const useDeletePayGrade = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithTenant(`${API_URL}/admin/payroll/pay-grades/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete pay grade');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payGrades'] }),
  });
};

// --- Loans ---
export const useLoans = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['loans'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/payroll/loans`);
      if (!res.ok) throw new Error('Failed to fetch loans');
      const json = await res.json();
      return json.data;
    },
    enabled,
  });
};

export const useCreateLoan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetchWithTenant(`${API_URL}/admin/payroll/loans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create loan');
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['loans'] }),
  });
};

export const useUpdateLoan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetchWithTenant(`${API_URL}/admin/payroll/loans/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update loan');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['loans'] }),
  });
};

export const useDeleteLoan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithTenant(`${API_URL}/admin/payroll/loans/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete loan');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['loans'] }),
  });
};

export const useLoanRepayments = (loanId?: string) => {
  return useQuery({
    queryKey: ['loanRepayments', loanId],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/payroll/loans/${loanId}/repayments`);
      if (!res.ok) throw new Error('Failed to fetch loan repayments');
      const json = await res.json();
      return json.data;
    },
    enabled: !!loanId,
  });
};

// --- Payroll Runs (submit → approve/reject → mark paid) ---
export const usePayrollRuns = (status?: string) => {
  return useQuery({
    queryKey: ['payrollRuns', status],
    queryFn: async () => {
      const query = status ? `?status=${status}` : '';
      const res = await fetchWithTenant(`${API_URL}/admin/payroll/runs${query}`);
      if (!res.ok) throw new Error('Failed to fetch payroll runs');
      const json = await res.json();
      return json.data;
    },
  });
};

export const usePayrollRun = (runId?: string) => {
  return useQuery({
    queryKey: ['payrollRun', runId],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/payroll/runs/${runId}`);
      if (!res.ok) throw new Error('Failed to fetch payroll run');
      const json = await res.json();
      return json.data;
    },
    enabled: !!runId,
  });
};

const invalidatePayrollRuns = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
  queryClient.invalidateQueries({ queryKey: ['payrollRun'] });
  queryClient.invalidateQueries({ queryKey: ['payrollDashboard'] });
  queryClient.invalidateQueries({ queryKey: ['complianceTasks'] });
  queryClient.invalidateQueries({ queryKey: ['loans'] });
};

export const useSubmitPayrollRun = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { periodMonth: number; periodYear: number; overrides?: Record<string, any>; notes?: string }) => {
      const res = await fetchWithTenant(`${API_URL}/admin/payroll/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to submit payroll run');
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => invalidatePayrollRuns(queryClient),
  });
};

export const useApprovePayrollRun = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (runId: string) => {
      const res = await fetchWithTenant(`${API_URL}/admin/payroll/runs/${runId}/approve`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to approve payroll run');
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => invalidatePayrollRuns(queryClient),
  });
};

export const useRejectPayrollRun = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ runId, reason }: { runId: string; reason?: string }) => {
      const res = await fetchWithTenant(`${API_URL}/admin/payroll/runs/${runId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to reject payroll run');
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => invalidatePayrollRuns(queryClient),
  });
};

export const useMarkPayrollRunPaid = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (runId: string) => {
      const res = await fetchWithTenant(`${API_URL}/admin/payroll/runs/${runId}/mark-paid`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to mark payroll run as paid');
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => invalidatePayrollRuns(queryClient),
  });
};

// Triggers a browser download of the bank disbursement file for a run.
export const downloadPayrollBankFile = async (runId: string) => {
  const res = await fetchWithTenant(`${API_URL}/admin/payroll/runs/${runId}/bank-file`);
  if (!res.ok) throw new Error('Failed to generate bank file');
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : `bank-file-${runId}.csv`;

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

// --- Compliance / Remittances ---
export const useComplianceTasks = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['complianceTasks'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/payroll/compliance`);
      if (!res.ok) throw new Error('Failed to fetch compliance tasks');
      const json = await res.json();
      return json.data;
    },
    enabled,
  });
};

export const useCompleteComplianceTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reference }: { id: string; reference?: string }) => {
      const res = await fetchWithTenant(`${API_URL}/admin/payroll/compliance/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference }),
      });
      if (!res.ok) throw new Error('Failed to update compliance task');
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['complianceTasks'] }),
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
      const res = await fetchWithTenant(`${API_URL}/admin/holidays/${id}`, { method: 'DELETE' });
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
    mutationFn: async ({ key, data }: { key: string; data: { subject?: string; body?: string } }) => {
      const res = await fetchWithTenant(`${API_URL}/admin/email-templates/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update email template');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['emailTemplates'] }),
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
      const res = await fetchWithTenant(`${API_URL}/admin/integrations/${key}/toggle`, { method: 'PUT' });
      if (!res.ok) throw new Error('Failed to update integration');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['integrations'] }),
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
    mutationFn: async ({ key, data }: { key: string; data: { steps?: any[]; enabled?: boolean; description?: string } }) => {
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

// Triggers a browser download of a full sanitized JSON backup of the company's data.
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
export const useAuditLogs = (filters: { module?: string; search?: string } = {}, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['auditLogs', filters],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (filters.module) query.set('module', filters.module);
      if (filters.search) query.set('search', filters.search);
      const qs = query.toString();
      const res = await fetchWithTenant(`${API_URL}/admin/audit-logs${qs ? `?${qs}` : ''}`);
      if (!res.ok) throw new Error('Failed to fetch audit logs');
      return res.json();
    },
    enabled,
  });
};

// Triggers a browser download of the audit log as CSV.
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

export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetchWithTenant(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Password change failed');
      }
      return res.json();
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

// Manager-scoped: today's presence for the caller's direct reports.
export const useMyTeamAttendanceToday = () => {
  return useQuery({
    queryKey: ['teamAttendanceToday'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/employee/attendance/team`);
      if (!res.ok) throw new Error('Failed to fetch team attendance');
      return res.json();
    },
  });
};

// Manager-scoped: pending overtime requests for the caller's direct reports.
export const useTeamPendingOvertime = () => {
  return useQuery({
    queryKey: ['teamPendingOvertime'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/employee/attendance/team-requests`);
      if (!res.ok) throw new Error('Failed to fetch pending team overtime requests');
      return res.json();
    },
  });
};

export const useUpdateTeamOvertimeStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, managerComment, hours }: { id: string; status: 'approved' | 'rejected'; managerComment?: string; hours?: number }) => {
      const res = await fetchWithTenant(`${API_URL}/employee/attendance/team-requests/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, managerComment, hours }),
      });
      if (!res.ok) throw new Error('Failed to update overtime request status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamPendingOvertime'] });
      queryClient.invalidateQueries({ queryKey: ['teamAttendanceToday'] });
    },
  });
};

// Admin/HR: company-wide attendance oversight.
export const useAdminAttendance = (filters: { date?: string; from?: string; to?: string; employeeId?: string } = {}) => {
  const params = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => !!v) as [string, string][]
  ).toString();
  return useQuery({
    queryKey: ['adminAttendance', filters],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/attendance${params ? `?${params}` : ''}`);
      if (!res.ok) throw new Error('Failed to fetch attendance records');
      return res.json();
    },
  });
};

export const useAdminAttendanceSummary = (date: string) => {
  return useQuery({
    queryKey: ['adminAttendanceSummary', date],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/attendance/summary?date=${date}`);
      if (!res.ok) throw new Error('Failed to fetch attendance summary');
      return res.json();
    },
    enabled: !!date,
  });
};

const invalidateAdminAttendance = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['adminAttendance'] });
  queryClient.invalidateQueries({ queryKey: ['adminAttendanceSummary'] });
};

export const useCreateAttendanceRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetchWithTenant(`${API_URL}/admin/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create attendance record');
      return res.json();
    },
    onSuccess: () => invalidateAdminAttendance(queryClient),
  });
};

export const useUpdateAttendanceRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetchWithTenant(`${API_URL}/admin/attendance/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update attendance record');
      return res.json();
    },
    onSuccess: () => invalidateAdminAttendance(queryClient),
  });
};

export const useDeleteAttendanceRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithTenant(`${API_URL}/admin/attendance/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete attendance record');
      return res.json();
    },
    onSuccess: () => invalidateAdminAttendance(queryClient),
  });
};

export const useAdminOvertimeRequests = (status?: string) => {
  return useQuery({
    queryKey: ['adminOvertime', status],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/attendance/overtime${status ? `?status=${status}` : ''}`);
      if (!res.ok) throw new Error('Failed to fetch overtime requests');
      return res.json();
    },
  });
};

export const useUpdateAdminOvertimeStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, managerComment, hours }: { id: string; status: 'approved' | 'rejected'; managerComment?: string; hours?: number }) => {
      const res = await fetchWithTenant(`${API_URL}/admin/attendance/overtime/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, managerComment, hours }),
      });
      if (!res.ok) throw new Error('Failed to update overtime request');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOvertime'] });
    },
  });
};

export const useAttendancePolicy = () => {
  return useQuery({
    queryKey: ['attendancePolicy'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/attendance/policy`);
      if (!res.ok) throw new Error('Failed to fetch attendance policy');
      return res.json();
    },
  });
};

export const useUpdateAttendancePolicy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetchWithTenant(`${API_URL}/admin/attendance/policy`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update attendance policy');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendancePolicy'] });
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

// Self-service payslip history for the logged-in employee.
export const useMyPayslips = () => {
  return useQuery({
    queryKey: ['myPayslips'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/employee/me/payslips`);
      if (!res.ok) throw new Error('Failed to fetch payslips');
      const json = await res.json();
      return json.data;
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

export const useSendShoutout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { toEmployeeName: string; toEmployeeId?: string; type: string; message: string }) => {
      const res = await fetchWithTenant(`${API_URL}/employee/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to send shoutout'); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shoutouts'] });
      queryClient.invalidateQueries({ queryKey: ['myPerformanceSummary'] });
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

// Resolves the company's active review cycle server-side and returns both
// it and (if one exists) the caller's own assessment against it — no cycle
// name is ever chosen client-side.
export const useActiveCycleAssessment = () => {
  return useQuery({
    queryKey: ['activeCycleAssessment'],
    queryFn: async (): Promise<{ assessment: any | null; activeCycle: any | null }> => {
      const res = await fetchWithTenant(`${API_URL}/employee/assessments/active`);
      if (!res.ok) throw new Error('Failed to fetch active assessment');
      return res.json();
    },
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
      // NOTE: this was pointing at `/performance/employee/:id` (missing the
      // `/admin` prefix the route is actually mounted under) and 404ing.
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

// --- Transitions (Onboarding / Offboarding journeys) ---

export const useTransitions = (type?: "Onboarding" | "Offboarding") => {
  return useQuery({
    queryKey: ['transitions', type || 'all'],
    queryFn: async () => {
      const query = type ? `?type=${type}` : '';
      const res = await fetchWithTenant(`${API_URL}/admin/transitions${query}`);
      if (!res.ok) throw new Error('Failed to fetch transitions');
      return res.json();
    },
  });
};

const invalidateTransitions = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['transitions'] });
  queryClient.invalidateQueries({ queryKey: ['employees'] });
};

export const useCreateTransition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetchWithTenant(`${API_URL}/admin/transitions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to start transition');
      }
      return res.json();
    },
    onSuccess: () => invalidateTransitions(queryClient),
  });
};

export const useUpdateTransitionTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ transitionId, taskId, status }: { transitionId: string; taskId: string; status: 'pending' | 'completed' }) => {
      const res = await fetchWithTenant(`${API_URL}/admin/transitions/${transitionId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update task');
      return res.json();
    },
    onSuccess: () => invalidateTransitions(queryClient),
  });
};

export const useAddTransitionTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ transitionId, data }: { transitionId: string; data: any }) => {
      const res = await fetchWithTenant(`${API_URL}/admin/transitions/${transitionId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to add task');
      return res.json();
    },
    onSuccess: () => invalidateTransitions(queryClient),
  });
};

export const useCancelTransition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithTenant(`${API_URL}/admin/transitions/${id}/cancel`, {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Failed to cancel transition');
      return res.json();
    },
    onSuccess: () => invalidateTransitions(queryClient),
  });
};

// --- Reports & Analytics ---

// Full company-wide report (SUPER_ADMIN / HR_ADMIN / PAYROLL_OFFICER).
export const useReportsOverview = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['reportsOverview'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/reports/overview`);
      if (!res.ok) throw new Error('Failed to fetch reports overview');
      const json = await res.json();
      return json.data;
    },
    enabled,
  });
};

// Recruitment-focused slice, also reachable by RECRUITER.
export const useRecruitmentReport = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['recruitmentReport'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/reports/recruitment`);
      if (!res.ok) throw new Error('Failed to fetch recruitment report');
      const json = await res.json();
      return json.data;
    },
    enabled,
  });
};

// Payroll-focused slice, also reachable by PAYROLL_OFFICER.
export const usePayrollReport = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['payrollReport'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/reports/payroll`);
      if (!res.ok) throw new Error('Failed to fetch payroll report');
      const json = await res.json();
      return json.data;
    },
    enabled,
  });
};

// Manager-scoped: Reports & Analytics for the caller's own direct reports.
export const useTeamReport = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['teamReport'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/employee/reports/team`);
      if (!res.ok) throw new Error('Failed to fetch team report');
      const json = await res.json();
      return json.data;
    },
    enabled,
  });
};

// Triggers a browser download of a CSV export for the given report type
// ('employees' | 'requisitions' | 'leave' | 'payroll'). Payroll exports need
// a period (month/year) to know which pay run to pull payslips from.
export const downloadReportCsv = async (type: 'employees' | 'requisitions' | 'leave' | 'payroll', params?: { month?: number; year?: number }) => {
  const query = new URLSearchParams({ type });
  if (params?.month) query.append('month', String(params.month));
  if (params?.year) query.append('year', String(params.year));

  const res = await fetchWithTenant(`${API_URL}/admin/reports/export?${query.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to generate export');
  }
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : `${type}-export.csv`;

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

// =============================================================================
// Benefits & Wellbeing
// =============================================================================

// ---------- Admin: plan catalog, enrollments, wellness programs, claims ----------

export const useBenefitsOverview = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['benefitsOverview'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/benefits/overview`);
      if (!res.ok) throw new Error('Failed to fetch benefits overview');
      return res.json();
    },
    enabled,
  });
};

export const useBenefitPlans = (status?: string) => {
  return useQuery({
    queryKey: ['benefitPlans', status || 'all'],
    queryFn: async () => {
      const query = status ? `?status=${status}` : '';
      const res = await fetchWithTenant(`${API_URL}/admin/benefits/plans${query}`);
      if (!res.ok) throw new Error('Failed to fetch benefit plans');
      return res.json();
    },
  });
};

export const useCreateBenefitPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetchWithTenant(`${API_URL}/admin/benefits/plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to create plan'); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['benefitPlans'] });
      queryClient.invalidateQueries({ queryKey: ['benefitsOverview'] });
    },
  });
};

export const useUpdateBenefitPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ planId, data }: { planId: string; data: any }) => {
      const res = await fetchWithTenant(`${API_URL}/admin/benefits/plans/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to update plan'); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['benefitPlans'] });
      queryClient.invalidateQueries({ queryKey: ['benefitsOverview'] });
    },
  });
};

export const useDeleteBenefitPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (planId: string) => {
      const res = await fetchWithTenant(`${API_URL}/admin/benefits/plans/${planId}`, { method: 'DELETE' });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to delete plan'); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['benefitPlans'] });
      queryClient.invalidateQueries({ queryKey: ['benefitsOverview'] });
    },
  });
};

export const useAdminEnrollments = (filters: { planId?: string; employeeId?: string; status?: string } = {}) => {
  return useQuery({
    queryKey: ['adminBenefitEnrollments', filters],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (filters.planId) query.append('planId', filters.planId);
      if (filters.employeeId) query.append('employeeId', filters.employeeId);
      if (filters.status) query.append('status', filters.status);
      const res = await fetchWithTenant(`${API_URL}/admin/benefits/enrollments?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch enrollments');
      return res.json();
    },
  });
};

export const useAdminEnrollEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { employeeId: string; planId: string; coverageLevel?: string; notes?: string }) => {
      const res = await fetchWithTenant(`${API_URL}/admin/benefits/enrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to enroll employee'); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBenefitEnrollments'] });
      queryClient.invalidateQueries({ queryKey: ['benefitsOverview'] });
    },
  });
};

export const useAdminUpdateEnrollmentStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ enrollmentId, status }: { enrollmentId: string; status: 'enrolled' | 'waived' | 'cancelled' }) => {
      const res = await fetchWithTenant(`${API_URL}/admin/benefits/enrollments/${enrollmentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to update enrollment'); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBenefitEnrollments'] });
      queryClient.invalidateQueries({ queryKey: ['benefitsOverview'] });
    },
  });
};

export const useAdminWellnessPrograms = () => {
  return useQuery({
    queryKey: ['adminWellnessPrograms'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/benefits/wellness/programs`);
      if (!res.ok) throw new Error('Failed to fetch wellness programs');
      return res.json();
    },
  });
};

export const useCreateWellnessProgram = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetchWithTenant(`${API_URL}/admin/benefits/wellness/programs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to create program'); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminWellnessPrograms'] });
      queryClient.invalidateQueries({ queryKey: ['benefitsOverview'] });
    },
  });
};

export const useUpdateWellnessProgram = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ programId, data }: { programId: string; data: any }) => {
      const res = await fetchWithTenant(`${API_URL}/admin/benefits/wellness/programs/${programId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to update program'); }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminWellnessPrograms'] }),
  });
};

export const useDeleteWellnessProgram = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (programId: string) => {
      const res = await fetchWithTenant(`${API_URL}/admin/benefits/wellness/programs/${programId}`, { method: 'DELETE' });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to delete program'); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminWellnessPrograms'] });
      queryClient.invalidateQueries({ queryKey: ['benefitsOverview'] });
    },
  });
};

export const useWellnessProgramParticipants = (programId?: string) => {
  return useQuery({
    queryKey: ['wellnessProgramParticipants', programId],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/benefits/wellness/programs/${programId}/participants`);
      if (!res.ok) throw new Error('Failed to fetch participants');
      return res.json();
    },
    enabled: !!programId,
  });
};

export const useAdminBenefitClaims = (filters: { status?: string; kind?: string; employeeId?: string } = {}) => {
  return useQuery({
    queryKey: ['adminBenefitClaims', filters],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (filters.status) query.append('status', filters.status);
      if (filters.kind) query.append('kind', filters.kind);
      if (filters.employeeId) query.append('employeeId', filters.employeeId);
      const res = await fetchWithTenant(`${API_URL}/admin/benefits/claims?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch claims');
      return res.json();
    },
  });
};

export const useReviewBenefitClaim = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ claimId, status, notes }: { claimId: string; status: 'approved' | 'rejected'; notes?: string }) => {
      const res = await fetchWithTenant(`${API_URL}/admin/benefits/claims/${claimId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to review claim'); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBenefitClaims'] });
      queryClient.invalidateQueries({ queryKey: ['benefitsOverview'] });
    },
  });
};

// ---------- Employee self-service ----------

export const useMyBenefitsSummary = () => {
  return useQuery({
    queryKey: ['myBenefitsSummary'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/employee/benefits/me/summary`);
      if (!res.ok) throw new Error('Failed to fetch benefits summary');
      return res.json();
    },
  });
};

export const useAvailableBenefitPlans = () => {
  return useQuery({
    queryKey: ['availableBenefitPlans'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/employee/benefits/plans`);
      if (!res.ok) throw new Error('Failed to fetch plans');
      return res.json();
    },
  });
};

export const useMyEnrollments = () => {
  return useQuery({
    queryKey: ['myEnrollments'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/employee/benefits/enrollments`);
      if (!res.ok) throw new Error('Failed to fetch enrollments');
      return res.json();
    },
  });
};

const invalidateMyBenefits = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['myBenefitsSummary'] });
  queryClient.invalidateQueries({ queryKey: ['myEnrollments'] });
};

export const useEnrollInPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { planId: string; coverageLevel?: string; notes?: string }) => {
      const res = await fetchWithTenant(`${API_URL}/employee/benefits/enrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to enroll'); }
      return res.json();
    },
    onSuccess: () => invalidateMyBenefits(queryClient),
  });
};

export const useCancelMyEnrollment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (enrollmentId: string) => {
      const res = await fetchWithTenant(`${API_URL}/employee/benefits/enrollments/${enrollmentId}/cancel`, { method: 'PATCH' });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to cancel enrollment'); }
      return res.json();
    },
    onSuccess: () => invalidateMyBenefits(queryClient),
  });
};

export const useMyDependents = () => {
  return useQuery({
    queryKey: ['myDependents'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/employee/benefits/dependents`);
      if (!res.ok) throw new Error('Failed to fetch dependents');
      return res.json();
    },
  });
};

export const useAddDependent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; relationship: string; dateOfBirth?: string }) => {
      const res = await fetchWithTenant(`${API_URL}/employee/benefits/dependents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to add dependent'); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myDependents'] });
      queryClient.invalidateQueries({ queryKey: ['myBenefitsSummary'] });
    },
  });
};

export const useDeleteDependent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dependentId: string) => {
      const res = await fetchWithTenant(`${API_URL}/employee/benefits/dependents/${dependentId}`, { method: 'DELETE' });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to remove dependent'); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myDependents'] });
      queryClient.invalidateQueries({ queryKey: ['myBenefitsSummary'] });
    },
  });
};

export const useWellnessPrograms = () => {
  return useQuery({
    queryKey: ['wellnessPrograms'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/employee/benefits/wellness/programs`);
      if (!res.ok) throw new Error('Failed to fetch wellness programs');
      return res.json();
    },
  });
};

const invalidateWellness = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['wellnessPrograms'] });
  queryClient.invalidateQueries({ queryKey: ['myBenefitsSummary'] });
};

export const useJoinWellnessProgram = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (programId: string) => {
      const res = await fetchWithTenant(`${API_URL}/employee/benefits/wellness/programs/${programId}/join`, { method: 'POST' });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to join program'); }
      return res.json();
    },
    onSuccess: () => invalidateWellness(queryClient),
  });
};

export const useUpdateMyProgramProgress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ programId, progress }: { programId: string; progress: number }) => {
      const res = await fetchWithTenant(`${API_URL}/employee/benefits/wellness/programs/${programId}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to update progress'); }
      return res.json();
    },
    onSuccess: () => invalidateWellness(queryClient),
  });
};

export const useLeaveWellnessProgram = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (programId: string) => {
      const res = await fetchWithTenant(`${API_URL}/employee/benefits/wellness/programs/${programId}/leave`, { method: 'POST' });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to leave program'); }
      return res.json();
    },
    onSuccess: () => invalidateWellness(queryClient),
  });
};

export const useMyBenefitClaims = () => {
  return useQuery({
    queryKey: ['myBenefitClaims'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/employee/benefits/claims`);
      if (!res.ok) throw new Error('Failed to fetch claims');
      return res.json();
    },
  });
};

export const useSubmitBenefitClaim = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { kind: 'health' | 'wellness'; category: string; amount: number; provider?: string; description?: string }) => {
      const res = await fetchWithTenant(`${API_URL}/employee/benefits/claims`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to submit claim'); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBenefitClaims'] });
      queryClient.invalidateQueries({ queryKey: ['myBenefitsSummary'] });
    },
  });
};

// =============================================================================
// Performance & Growth
// =============================================================================

// --- Goals / OKRs (self-service) ---

export const useMyGoals = () => {
  return useQuery({
    queryKey: ['myGoals'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/employee/goals`);
      if (!res.ok) throw new Error('Failed to fetch goals');
      return res.json();
    },
  });
};

export const useCreateGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetchWithTenant(`${API_URL}/employee/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to create goal'); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myGoals'] });
      queryClient.invalidateQueries({ queryKey: ['myPerformanceSummary'] });
    },
  });
};

export const useUpdateGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetchWithTenant(`${API_URL}/employee/goals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to update goal'); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myGoals'] });
      queryClient.invalidateQueries({ queryKey: ['teamGoals'] });
      queryClient.invalidateQueries({ queryKey: ['myPerformanceSummary'] });
    },
  });
};

export const useCompanyObjectives = () => {
  return useQuery({
    queryKey: ['companyObjectives'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/employee/goals/company`);
      if (!res.ok) throw new Error('Failed to fetch company objectives');
      return res.json();
    },
  });
};

// --- Manager: direct reports, team goals & reviews ---

export const useMyDirectReports = () => {
  return useQuery({
    queryKey: ['myDirectReports'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/employee/team/members`);
      if (!res.ok) throw new Error('Failed to fetch direct reports');
      return res.json();
    },
  });
};

export const useTeamGoals = () => {
  return useQuery({
    queryKey: ['teamGoals'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/employee/goals/team`);
      if (!res.ok) throw new Error('Failed to fetch team goals');
      return res.json();
    },
  });
};

export const useAssignTeamGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetchWithTenant(`${API_URL}/employee/goals/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to assign goal'); }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teamGoals'] }),
  });
};

export const useTeamPerformanceAnalytics = () => {
  return useQuery({
    queryKey: ['teamPerformanceAnalytics'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/employee/assessments/team-analytics`);
      if (!res.ok) throw new Error('Failed to fetch team analytics');
      return res.json();
    },
  });
};

export const useTeamPendingAssessments = () => {
  return useQuery({
    queryKey: ['teamPendingAssessments'],
    queryFn: async (): Promise<{ pending: any[]; ratingScale: { value: string; label: string; score: number }[] }> => {
      const res = await fetchWithTenant(`${API_URL}/employee/assessments/team-pending`);
      if (!res.ok) throw new Error('Failed to fetch pending team reviews');
      return res.json();
    },
  });
};

export const useSubmitManagerReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, managerRating, managerComment }: { id: string; managerRating: string; managerComment?: string }) => {
      const res = await fetchWithTenant(`${API_URL}/employee/assessments/${id}/manager-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ managerRating, managerComment }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to submit review'); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamPendingAssessments'] });
      queryClient.invalidateQueries({ queryKey: ['adminAssessments'] });
      queryClient.invalidateQueries({ queryKey: ['adminPerformanceAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['employeeAssessments'] });
    },
  });
};

// --- Personal performance dashboard ---

export const useMyPerformanceSummary = () => {
  return useQuery({
    queryKey: ['myPerformanceSummary'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/employee/performance/summary`);
      if (!res.ok) throw new Error('Failed to fetch performance summary');
      return res.json();
    },
  });
};

// --- Admin/HR: review cycles ---

export const useReviewCycles = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['reviewCycles'],
    queryFn: async (): Promise<{ cycles: any[]; ratingScale: { value: string; label: string; score: number }[] }> => {
      const res = await fetchWithTenant(`${API_URL}/admin/performance/cycles`);
      if (!res.ok) throw new Error('Failed to fetch review cycles');
      return res.json();
    },
    enabled,
  });
};

export const useCreateReviewCycle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetchWithTenant(`${API_URL}/admin/performance/cycles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to create cycle'); }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reviewCycles'] }),
  });
};

export const useUpdateReviewCycle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetchWithTenant(`${API_URL}/admin/performance/cycles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update cycle');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reviewCycles'] }),
  });
};

const invalidateCycles = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['reviewCycles'] });
  queryClient.invalidateQueries({ queryKey: ['adminPerformanceAnalytics'] });
  queryClient.invalidateQueries({ queryKey: ['activeCycleAssessment'] });
  queryClient.invalidateQueries({ queryKey: ['myPerformanceSummary'] });
};

export const useActivateReviewCycle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithTenant(`${API_URL}/admin/performance/cycles/${id}/activate`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to activate cycle');
      return res.json();
    },
    onSuccess: () => invalidateCycles(queryClient),
  });
};

export const useCloseReviewCycle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithTenant(`${API_URL}/admin/performance/cycles/${id}/close`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to close cycle');
      return res.json();
    },
    onSuccess: () => invalidateCycles(queryClient),
  });
};

export const useDeleteReviewCycle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithTenant(`${API_URL}/admin/performance/cycles/${id}`, { method: 'DELETE' });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to delete cycle'); }
      return res.json();
    },
    onSuccess: () => invalidateCycles(queryClient),
  });
};

// --- Admin/HR: company-wide performance analytics & browsing ---

export const useAdminPerformanceAnalytics = (cycleId?: string) => {
  return useQuery({
    queryKey: ['adminPerformanceAnalytics', cycleId],
    queryFn: async () => {
      const query = cycleId ? `?cycleId=${cycleId}` : '';
      const res = await fetchWithTenant(`${API_URL}/admin/performance/analytics${query}`);
      if (!res.ok) throw new Error('Failed to fetch performance analytics');
      return res.json();
    },
  });
};

export const useAdminAssessments = (filters: { cycleId?: string; status?: string } = {}) => {
  const params = new URLSearchParams(Object.entries(filters).filter(([, v]) => !!v) as [string, string][]).toString();
  return useQuery({
    queryKey: ['adminAssessments', filters],
    queryFn: async (): Promise<{ assessments: any[]; ratingScale: { value: string; label: string; score: number }[] }> => {
      const res = await fetchWithTenant(`${API_URL}/admin/performance/assessments${params ? `?${params}` : ''}`);
      if (!res.ok) throw new Error('Failed to fetch assessments');
      return res.json();
    },
  });
};

export const useAdminGoals = (scope?: string) => {
  return useQuery({
    queryKey: ['adminGoals', scope],
    queryFn: async () => {
      const query = scope ? `?scope=${scope}` : '';
      const res = await fetchWithTenant(`${API_URL}/admin/performance/goals${query}`);
      if (!res.ok) throw new Error('Failed to fetch goals');
      return res.json();
    },
  });
};

export const useCreateCompanyGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetchWithTenant(`${API_URL}/admin/performance/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to create objective'); }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminGoals'] }),
  });
};
