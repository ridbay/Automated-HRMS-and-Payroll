import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Candidate, Interview, JobRequisition } from '../types';
import { API_URL, fetchWithTenant } from './http';

// Shared invalidation: any ATS mutation should refresh candidates, interviews,
// offers, and job-requisition pipeline counts simultaneously.
export const invalidateAts = (
  queryClient: ReturnType<typeof useQueryClient>,
  candidateId?: string
) => {
  queryClient.invalidateQueries({ queryKey: ['candidates'] });
  queryClient.invalidateQueries({ queryKey: ['interviews'] });
  queryClient.invalidateQueries({ queryKey: ['offers'] });
  queryClient.invalidateQueries({ queryKey: ['jobRequisitions'] });
  queryClient.invalidateQueries({ queryKey: ['pendingJobRequisitions'] });
  queryClient.invalidateQueries({ queryKey: ['myJobRequisitions'] });
  if (candidateId) queryClient.invalidateQueries({ queryKey: ['candidate', candidateId] });
};

// --- Candidates ---

export const useCandidates = (
  filters: { requisitionId?: string; status?: string } = {}
) => {
  return useQuery({
    queryKey: ['candidates', filters],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (filters.requisitionId) query.append('requisitionId', filters.requisitionId);
      if (filters.status) query.append('status', filters.status);
      const res = await fetchWithTenant(
        `${API_URL}/admin/ats/candidates?${query.toString()}`
      );
      if (!res.ok) throw new Error('Failed to fetch candidates');
      const json = await res.json();
      return json.data as Candidate[];
    },
  });
};

export const useCandidate = (id: string | null) => {
  return useQuery({
    queryKey: ['candidate', id],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/ats/candidates/${id}`);
      if (!res.ok) throw new Error('Failed to fetch candidate');
      const json = await res.json();
      return json.data;
    },
    enabled: !!id,
  });
};

// Accepts either a plain object (JSON) or a FormData (when attaching a resume).
export const useCreateCandidate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, any> | FormData) => {
      const isFormData = data instanceof FormData;
      const res = await fetchWithTenant(`${API_URL}/admin/ats/candidates`, {
        method: 'POST',
        headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
        body: isFormData ? data : JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to add candidate');
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => invalidateAts(queryClient),
  });
};

export const useUpdateCandidateStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      note,
    }: {
      id: string;
      status: string;
      note?: string;
    }) => {
      const res = await fetchWithTenant(`${API_URL}/admin/ats/candidates/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update candidate status');
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: (_, variables) => invalidateAts(queryClient, variables.id),
  });
};

export const useRateCandidate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, rating }: { id: string; rating: number }) => {
      const res = await fetchWithTenant(`${API_URL}/admin/ats/candidates/${id}/rating`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      });
      if (!res.ok) throw new Error('Failed to rate candidate');
      const json = await res.json();
      return json.data;
    },
    onSuccess: (_, variables) => invalidateAts(queryClient, variables.id),
  });
};

export const candidateResumeUrl = (candidateId: string) =>
  `${API_URL}/admin/ats/candidates/${candidateId}/resume`;

// --- Interviews ---

export const useInterviews = (candidateId?: string) => {
  return useQuery({
    queryKey: ['interviews', candidateId],
    queryFn: async () => {
      const query = candidateId ? `?candidateId=${candidateId}` : '';
      const res = await fetchWithTenant(`${API_URL}/admin/ats/interviews${query}`);
      if (!res.ok) throw new Error('Failed to fetch interviews');
      const json = await res.json();
      return json.data as Interview[];
    },
  });
};

export const useScheduleInterview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      candidateId: string;
      type: string;
      stage: string;
      dateTime: string;
      durationMinutes?: number;
      interviewerIds?: string[];
      meetingLink?: string;
    }) => {
      const res = await fetchWithTenant(`${API_URL}/admin/ats/interviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to schedule interview');
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: (_, variables) => invalidateAts(queryClient, variables.candidateId),
  });
};

export const useUpdateInterviewStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetchWithTenant(`${API_URL}/admin/ats/interviews/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update interview status');
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => invalidateAts(queryClient),
  });
};

export const useSubmitScorecard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      interviewId,
      ...data
    }: {
      interviewId: string;
      technical?: number;
      communication?: number;
      cultural?: number;
      notes?: string;
      recommendation?: 'Hire' | 'Maybe' | 'No Hire';
    }) => {
      const res = await fetchWithTenant(
        `${API_URL}/admin/ats/interviews/${interviewId}/scorecard`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to submit scorecard');
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => invalidateAts(queryClient),
  });
};

// --- Offers ---

export const useOffers = () => {
  return useQuery({
    queryKey: ['offers'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/admin/ats/offers`);
      if (!res.ok) throw new Error('Failed to fetch offers');
      const json = await res.json();
      return json.data;
    },
  });
};

export const useCreateOffer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      candidateId: string;
      title: string;
      department?: string;
      salary: number;
      currency?: string;
      startDate?: string;
      expiryDate?: string;
      letterBody?: string;
    }) => {
      const res = await fetchWithTenant(`${API_URL}/admin/ats/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create offer');
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: (_, variables) => invalidateAts(queryClient, variables.candidateId),
  });
};

export const useSendOffer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithTenant(`${API_URL}/admin/ats/offers/${id}/send`, {
        method: 'POST',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to send offer');
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => invalidateAts(queryClient),
  });
};

export const useRespondToOffer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      decision,
    }: {
      id: string;
      decision: 'accepted' | 'declined';
    }) => {
      const res = await fetchWithTenant(`${API_URL}/admin/ats/offers/${id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to record offer response');
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => invalidateAts(queryClient),
  });
};

export const useRescindOffer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithTenant(`${API_URL}/admin/ats/offers/${id}/rescind`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to rescind offer');
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => invalidateAts(queryClient),
  });
};

// --- AI Assistant ---

export const useAskAI = () => {
  return useMutation({
    mutationFn: async (question: string) => {
      const res = await fetchWithTenant(`${API_URL}/ai/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to get a response from the assistant');
      }
      const json = await res.json();
      return json.data as { answer: string; toolsUsed: string[] };
    },
  });
};

// --- Public careers page (unauthenticated) ---

export const usePublicCareers = (companyIdentifier: string) => {
  return useQuery({
    queryKey: ['publicCareers', companyIdentifier],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/public/careers/${companyIdentifier}`);
      if (!res.ok) throw new Error('Company not found');
      const json = await res.json();
      return json.data as {
        company: { id: string; name: string; logoUrl?: string };
        positions: JobRequisition[];
      };
    },
    enabled: !!companyIdentifier,
  });
};

export const usePublicPosition = (
  companyIdentifier: string,
  requisitionId: string | null
) => {
  return useQuery({
    queryKey: ['publicPosition', companyIdentifier, requisitionId],
    queryFn: async () => {
      const res = await fetch(
        `${API_URL}/public/careers/${companyIdentifier}/${requisitionId}`
      );
      if (!res.ok) throw new Error('Position not found or no longer open');
      const json = await res.json();
      return json.data as {
        company: { id: string; name: string; logoUrl?: string };
        position: JobRequisition;
      };
    },
    enabled: !!companyIdentifier && !!requisitionId,
  });
};

export const useSubmitPublicApplication = () => {
  return useMutation({
    mutationFn: async ({
      companyIdentifier,
      requisitionId,
      formData,
    }: {
      companyIdentifier: string;
      requisitionId: string;
      formData: FormData;
    }) => {
      const res = await fetch(
        `${API_URL}/public/careers/${companyIdentifier}/${requisitionId}/apply`,
        { method: 'POST', body: formData }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to submit application');
      }
      const json = await res.json();
      return json.data;
    },
  });
};
