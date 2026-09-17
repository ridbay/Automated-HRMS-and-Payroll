import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { JobRequisition } from '../types';
import { API_URL, fetchWithTenant } from './http';

// The API computes real per-stage candidate counts server-side.
// This guards older cached responses / requisitions with no candidates yet.
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

// All three requisition list views share the same table, so any mutation
// invalidates all of them to keep every screen in sync.
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

export const useJobRequisitions = (enabled: boolean = true) => {
  return useQuery({ queryKey: ['jobRequisitions'], queryFn: fetchJobRequisitions, enabled });
};

export const usePendingJobRequisitions = (enabled: boolean = true) => {
  return useQuery({ queryKey: ['pendingJobRequisitions'], queryFn: fetchPendingJobRequisitions, enabled });
};

export const useMyJobRequisitions = (enabled: boolean = true) => {
  return useQuery({ queryKey: ['myJobRequisitions'], queryFn: fetchMyJobRequisitions, enabled });
};

export const useDeleteJobRequisition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetchWithTenant(`${API_URL}/admin/job-requisitions/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete job requisition');
      return response.json();
    },
    onSuccess: () => invalidateJobRequisitions(queryClient),
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
    onSuccess: () => invalidateJobRequisitions(queryClient),
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
    onSuccess: () => invalidateJobRequisitions(queryClient),
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
    onSuccess: () => invalidateJobRequisitions(queryClient),
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
    onSuccess: () => invalidateJobRequisitions(queryClient),
  });
};
