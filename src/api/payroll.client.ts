import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL, fetchWithTenant } from './http';

// Shared cache invalidation for payroll run state changes.
const invalidatePayrollRuns = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
  queryClient.invalidateQueries({ queryKey: ['payrollRun'] });
  queryClient.invalidateQueries({ queryKey: ['payrollDashboard'] });
  queryClient.invalidateQueries({ queryKey: ['complianceTasks'] });
  queryClient.invalidateQueries({ queryKey: ['loans'] });
};

// --- Preview & Dashboard ---

export const previewPayroll = async (month?: number, year?: number) => {
  const query = new URLSearchParams();
  if (month) query.append('month', month.toString());
  if (year) query.append('year', year.toString());
  const res = await fetchWithTenant(`${API_URL}/admin/payroll/preview?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to preview payroll');
  const json = await res.json();
  return json.data;
};

export const usePayrollPreview = (month?: number, year?: number) => {
  return useQuery({
    queryKey: ['payrollPreview', month, year],
    queryFn: () => previewPayroll(month, year),
  });
};

export const useRecomputePayrollPreview = () => {
  return useMutation({
    mutationFn: async (payload: {
      periodMonth: number;
      periodYear: number;
      overrides?: Record<string, any>;
    }) => {
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
      const res = await fetchWithTenant(
        `${API_URL}/admin/payroll/dashboard?${query.toString()}`
      );
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
      const res = await fetchWithTenant(
        `${API_URL}/admin/payroll/salary-components/${id}`,
        { method: 'DELETE' }
      );
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
      const res = await fetchWithTenant(`${API_URL}/admin/payroll/pay-grades/${id}`, {
        method: 'DELETE',
      });
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
      const res = await fetchWithTenant(`${API_URL}/admin/payroll/loans/${id}`, {
        method: 'DELETE',
      });
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
      const res = await fetchWithTenant(
        `${API_URL}/admin/payroll/loans/${loanId}/repayments`
      );
      if (!res.ok) throw new Error('Failed to fetch loan repayments');
      const json = await res.json();
      return json.data;
    },
    enabled: !!loanId,
  });
};

// --- Payroll Runs ---

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

export const useSubmitPayrollRun = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      periodMonth: number;
      periodYear: number;
      overrides?: Record<string, any>;
      notes?: string;
    }) => {
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
      const res = await fetchWithTenant(
        `${API_URL}/admin/payroll/runs/${runId}/approve`,
        { method: 'POST' }
      );
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
      const res = await fetchWithTenant(
        `${API_URL}/admin/payroll/runs/${runId}/mark-paid`,
        { method: 'POST' }
      );
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

export const useDisbursePayrollRun = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (runId: string) => {
      const res = await fetchWithTenant(
        `${API_URL}/admin/payroll/runs/${runId}/disburse`,
        { method: 'POST' }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to disburse payroll run');
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => invalidatePayrollRuns(queryClient),
  });
};

// --- Monnify bank utilities ---

export const useMonnifyBanks = () => {
  return useQuery({
    queryKey: ['monnify', 'banks'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/payroll/banks`);
      if (!res.ok) throw new Error('Failed to fetch bank list');
      const json = await res.json();
      return json.data as Array<{ name: string; code: string }>;
    },
    staleTime: 1000 * 60 * 60, // 1 hour — bank list rarely changes
  });
};

export const validateBankAccount = async (accountNumber: string, bankCode: string) => {
  const res = await fetchWithTenant(
    `${API_URL}/admin/payroll/validate-account?accountNumber=${encodeURIComponent(accountNumber)}&bankCode=${encodeURIComponent(bankCode)}`
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Account validation failed');
  }
  const json = await res.json();
  return json.data as { accountName: string; accountNumber: string; bankCode: string };
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

// Statutory remittance schedules — one CSV per scheme (PAYE/Pension/NHF/NSITF/ITF).
export const downloadRemittanceSchedule = async (
  runId: string,
  type: 'paye' | 'pension' | 'nhf' | 'nsitf' | 'itf'
) => {
  const res = await fetchWithTenant(
    `${API_URL}/admin/payroll/runs/${runId}/remittance/${type}`
  );
  if (!res.ok) throw new Error(`Failed to generate ${type} remittance schedule`);
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : `${type}-remittance-${runId}.csv`;
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

// --- Employee self-service payroll ---

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

// --- Reports & Analytics ---

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

export const downloadReportCsv = async (
  type: 'employees' | 'requisitions' | 'leave' | 'payroll',
  params?: { month?: number; year?: number }
) => {
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
