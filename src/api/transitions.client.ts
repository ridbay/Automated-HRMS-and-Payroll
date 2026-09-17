import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL, fetchWithTenant } from './http';

const invalidateTransitions = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['transitions'] });
  queryClient.invalidateQueries({ queryKey: ['employees'] });
};

export const useTransitions = (type?: 'Onboarding' | 'Offboarding') => {
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
    mutationFn: async ({
      transitionId,
      taskId,
      status,
    }: {
      transitionId: string;
      taskId: string;
      status: 'pending' | 'completed';
    }) => {
      const res = await fetchWithTenant(
        `${API_URL}/admin/transitions/${transitionId}/tasks/${taskId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        }
      );
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
      const res = await fetchWithTenant(
        `${API_URL}/admin/transitions/${transitionId}/tasks`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );
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
      const res = await fetchWithTenant(
        `${API_URL}/admin/transitions/${id}/cancel`,
        { method: 'PATCH' }
      );
      if (!res.ok) throw new Error('Failed to cancel transition');
      return res.json();
    },
    onSuccess: () => invalidateTransitions(queryClient),
  });
};
