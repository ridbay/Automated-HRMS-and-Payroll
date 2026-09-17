import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL, fetchWithTenant } from './http';

// --- Employee self-service leave ---

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
      if (!res.ok) {
        let message = 'Failed to apply for leave';
        try {
          const body = await res.json();
          if (body?.error) message = body.error;
        } catch { /* non-JSON error body */ }
        throw new Error(message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myLeave'] });
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
    mutationFn: async ({
      id,
      status,
      managerComment,
    }: {
      id: string;
      status: 'approved' | 'rejected';
      managerComment?: string;
    }) => {
      const res = await fetchWithTenant(
        `${API_URL}/employee/leave/team-requests/${id}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, managerComment }),
        }
      );
      if (!res.ok) throw new Error('Failed to update leave request status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamPendingLeaves'] });
      queryClient.invalidateQueries({ queryKey: ['teamLeaves'] });
    },
  });
};

// --- Admin leave management ---

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

export const useUpdateLeaveBalances = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, balances }: any) => {
      const res = await fetchWithTenant(
        `${API_URL}/admin/leaves/employee/${employeeId}/balances`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ balances }),
        }
      );
      if (!res.ok) throw new Error('Failed to update leave balances');
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['adminLeaveBalances', variables.employeeId],
      });
    },
  });
};
