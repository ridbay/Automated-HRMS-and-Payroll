import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL, fetchWithTenant } from './http';

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
    mutationFn: async (data: { subject: string; description: string; priority?: string }) => {
      const res = await fetchWithTenant(`${API_URL}/support/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create support ticket');
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
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update support ticket');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['supportTickets'] }),
  });
};

export const useTicketMessages = (ticketId?: string) => {
  return useQuery({
    queryKey: ['ticketMessages', ticketId],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/support/tickets/${ticketId}/messages`);
      if (!res.ok) throw new Error('Failed to fetch ticket messages');
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
      if (!res.ok) throw new Error('Failed to send message');
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ticketMessages', variables.ticketId] });
    },
  });
};
