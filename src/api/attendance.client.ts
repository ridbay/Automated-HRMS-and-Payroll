import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL, fetchWithTenant } from './http';

const invalidateAdminAttendance = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['adminAttendance'] });
  queryClient.invalidateQueries({ queryKey: ['adminAttendanceSummary'] });
};

// --- Employee self-service attendance ---

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myAttendance'] }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myAttendance'] }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myOvertime'] }),
  });
};

// --- Manager: team attendance ---

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
    mutationFn: async ({
      id,
      status,
      managerComment,
      hours,
    }: {
      id: string;
      status: 'approved' | 'rejected';
      managerComment?: string;
      hours?: number;
    }) => {
      const res = await fetchWithTenant(
        `${API_URL}/employee/attendance/team-requests/${id}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, managerComment, hours }),
        }
      );
      if (!res.ok) throw new Error('Failed to update overtime request status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamPendingOvertime'] });
      queryClient.invalidateQueries({ queryKey: ['teamAttendanceToday'] });
    },
  });
};

// --- Admin/HR: company-wide attendance ---

export const useAdminAttendance = (
  filters: { date?: string; from?: string; to?: string; employeeId?: string } = {}
) => {
  const params = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => !!v) as [string, string][]
  ).toString();
  return useQuery({
    queryKey: ['adminAttendance', filters],
    queryFn: async () => {
      const res = await fetchWithTenant(
        `${API_URL}/admin/attendance${params ? `?${params}` : ''}`
      );
      if (!res.ok) throw new Error('Failed to fetch attendance records');
      return res.json();
    },
  });
};

export const useAdminAttendanceSummary = (date: string) => {
  return useQuery({
    queryKey: ['adminAttendanceSummary', date],
    queryFn: async () => {
      const res = await fetchWithTenant(
        `${API_URL}/admin/attendance/summary?date=${date}`
      );
      if (!res.ok) throw new Error('Failed to fetch attendance summary');
      return res.json();
    },
    enabled: !!date,
  });
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
      const res = await fetchWithTenant(`${API_URL}/admin/attendance/${id}`, {
        method: 'DELETE',
      });
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
      const res = await fetchWithTenant(
        `${API_URL}/admin/attendance/overtime${status ? `?status=${status}` : ''}`
      );
      if (!res.ok) throw new Error('Failed to fetch overtime requests');
      return res.json();
    },
  });
};

export const useUpdateAdminOvertimeStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      managerComment,
      hours,
    }: {
      id: string;
      status: 'approved' | 'rejected';
      managerComment?: string;
      hours?: number;
    }) => {
      const res = await fetchWithTenant(
        `${API_URL}/admin/attendance/overtime/${id}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, managerComment, hours }),
        }
      );
      if (!res.ok) throw new Error('Failed to update overtime request');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminOvertime'] }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendancePolicy'] }),
  });
};
