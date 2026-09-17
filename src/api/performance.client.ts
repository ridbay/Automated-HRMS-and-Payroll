import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL, fetchWithTenant } from './http';

const invalidateCycles = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['reviewCycles'] });
  queryClient.invalidateQueries({ queryKey: ['adminPerformanceAnalytics'] });
  queryClient.invalidateQueries({ queryKey: ['activeCycleAssessment'] });
  queryClient.invalidateQueries({ queryKey: ['myPerformanceSummary'] });
};

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
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create goal');
      }
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
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update goal');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myGoals'] });
      queryClient.invalidateQueries({ queryKey: ['teamGoals'] });
      queryClient.invalidateQueries({ queryKey: ['myPerformanceSummary'] });
    },
  });
};

export const useMyObjectives = () => {
  return useQuery({
    queryKey: ['myObjectives'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/employee/goals/objectives`);
      if (!res.ok) throw new Error('Failed to fetch objectives');
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
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to assign goal');
      }
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
    queryFn: async (): Promise<{
      pending: any[];
      ratingScale: { value: string; label: string; score: number }[];
    }> => {
      const res = await fetchWithTenant(`${API_URL}/employee/assessments/team-pending`);
      if (!res.ok) throw new Error('Failed to fetch pending team reviews');
      return res.json();
    },
  });
};

export const useSubmitManagerReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      managerRating,
      managerComment,
    }: {
      id: string;
      managerRating: string;
      managerComment?: string;
    }) => {
      const res = await fetchWithTenant(
        `${API_URL}/employee/assessments/${id}/manager-review`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ managerRating, managerComment }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to submit review');
      }
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

// --- Self-service: personal assessments ---

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
      Authorization: `Bearer ${token}`,
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
      Authorization: `Bearer ${token}`,
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
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to submit assessment');
  return res.json();
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

// --- Admin: review cycles ---

export const useReviewCycles = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['reviewCycles'],
    queryFn: async (): Promise<{
      cycles: any[];
      ratingScale: { value: string; label: string; score: number }[];
    }> => {
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
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create cycle');
      }
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

export const useActivateReviewCycle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithTenant(
        `${API_URL}/admin/performance/cycles/${id}/activate`,
        { method: 'POST' }
      );
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
      const res = await fetchWithTenant(
        `${API_URL}/admin/performance/cycles/${id}/close`,
        { method: 'POST' }
      );
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
      const res = await fetchWithTenant(
        `${API_URL}/admin/performance/cycles/${id}`,
        { method: 'DELETE' }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete cycle');
      }
      return res.json();
    },
    onSuccess: () => invalidateCycles(queryClient),
  });
};

// --- Admin: company-wide analytics & browsing ---

export const useAdminPerformanceAnalytics = (cycleId?: string) => {
  return useQuery({
    queryKey: ['adminPerformanceAnalytics', cycleId],
    queryFn: async () => {
      const query = cycleId ? `?cycleId=${cycleId}` : '';
      const res = await fetchWithTenant(
        `${API_URL}/admin/performance/analytics${query}`
      );
      if (!res.ok) throw new Error('Failed to fetch performance analytics');
      return res.json();
    },
  });
};

export const useAdminAssessments = (
  filters: { cycleId?: string; status?: string } = {}
) => {
  const params = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => !!v) as [string, string][]
  ).toString();
  return useQuery({
    queryKey: ['adminAssessments', filters],
    queryFn: async (): Promise<{
      assessments: any[];
      ratingScale: { value: string; label: string; score: number }[];
    }> => {
      const res = await fetchWithTenant(
        `${API_URL}/admin/performance/assessments${params ? `?${params}` : ''}`
      );
      if (!res.ok) throw new Error('Failed to fetch assessments');
      return res.json();
    },
  });
};

export const useAdminGoals = (scope?: string, departmentId?: string) => {
  return useQuery({
    queryKey: ['adminGoals', scope, departmentId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (scope) params.set('scope', scope);
      if (departmentId) params.set('departmentId', departmentId);
      const query = params.toString();
      const res = await fetchWithTenant(
        `${API_URL}/admin/performance/goals${query ? `?${query}` : ''}`
      );
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
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create objective');
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminGoals'] }),
  });
};

// --- Cycle stage timeline ---

export const useCycleStages = (cycleId?: string) => {
  return useQuery({
    queryKey: ['cycleStages', cycleId],
    queryFn: async () => {
      const res = await fetchWithTenant(
        `${API_URL}/admin/performance/cycles/${cycleId}/stages`
      );
      if (!res.ok) throw new Error('Failed to fetch cycle stages');
      return res.json();
    },
    enabled: !!cycleId,
  });
};

export const useUpdateCycleStage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      cycleId,
      stageId,
      data,
    }: {
      cycleId: string;
      stageId: string;
      data: { startDate?: string | null; dueDate?: string | null };
    }) => {
      const res = await fetchWithTenant(
        `${API_URL}/admin/performance/cycles/${cycleId}/stages/${stageId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );
      if (!res.ok) throw new Error('Failed to update stage');
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cycleStages', variables.cycleId] });
      queryClient.invalidateQueries({ queryKey: ['activeCycleAssessment'] });
    },
  });
};

// --- 360: peer + upward reviews ---

export const useNominatePeers = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (peerIds: string[]) => {
      const res = await fetchWithTenant(`${API_URL}/employee/peer-reviews/nominate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ peerIds }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to nominate peer reviewers');
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myNominations'] }),
  });
};

export const useMyNominations = () => {
  return useQuery({
    queryKey: ['myNominations'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/employee/peer-reviews/my-nominations`);
      if (!res.ok) throw new Error('Failed to fetch nominations');
      return res.json();
    },
  });
};

export const useTeamPendingPeerApprovals = () => {
  return useQuery({
    queryKey: ['teamPendingPeerApprovals'],
    queryFn: async () => {
      const res = await fetchWithTenant(
        `${API_URL}/employee/peer-reviews/team-pending-approval`
      );
      if (!res.ok) throw new Error('Failed to fetch pending peer approvals');
      return res.json();
    },
  });
};

export const useApprovePeerNomination = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
      const res = await fetchWithTenant(
        `${API_URL}/employee/peer-reviews/${id}/approve`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approve }),
        }
      );
      if (!res.ok) throw new Error('Failed to update nomination');
      return res.json();
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['teamPendingPeerApprovals'] }),
  });
};

export const useReviewsAssignedToMe = () => {
  return useQuery({
    queryKey: ['reviewsAssignedToMe'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/employee/peer-reviews/assigned-to-me`);
      if (!res.ok) throw new Error('Failed to fetch assigned reviews');
      return res.json();
    },
  });
};

export const useSubmitPeerReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      rating,
      strengths,
      improvements,
      comment,
    }: {
      id: string;
      rating: string;
      strengths?: string;
      improvements?: string;
      comment?: string;
    }) => {
      const res = await fetchWithTenant(
        `${API_URL}/employee/peer-reviews/${id}/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating, strengths, improvements, comment }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to submit review');
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reviewsAssignedToMe'] }),
  });
};

export const useSubmitUpwardReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      rating: string;
      strengths?: string;
      improvements?: string;
      comment?: string;
    }) => {
      const res = await fetchWithTenant(`${API_URL}/employee/peer-reviews/upward`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to submit upward review');
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reviewsAssignedToMe'] }),
  });
};

export const useMyReceivedReviews = () => {
  return useQuery({
    queryKey: ['myReceivedReviews'],
    queryFn: async () => {
      const res = await fetchWithTenant(`${API_URL}/employee/peer-reviews/received`);
      if (!res.ok) throw new Error('Failed to fetch received reviews');
      return res.json();
    },
  });
};

export const useAdminPeerReviews = (cycleId?: string) => {
  return useQuery({
    queryKey: ['adminPeerReviews', cycleId],
    queryFn: async () => {
      const query = cycleId ? `?cycleId=${cycleId}` : '';
      const res = await fetchWithTenant(
        `${API_URL}/admin/performance/peer-reviews${query}`
      );
      if (!res.ok) throw new Error('Failed to fetch peer reviews');
      return res.json();
    },
  });
};

// --- KPI/appraisal evidence ---

export const useAssessmentEvidence = (assessmentId?: string) => {
  return useQuery({
    queryKey: ['assessmentEvidence', assessmentId],
    queryFn: async () => {
      const res = await fetchWithTenant(
        `${API_URL}/employee/assessments/${assessmentId}/evidence`
      );
      if (!res.ok) throw new Error('Failed to fetch evidence');
      return res.json();
    },
    enabled: !!assessmentId,
  });
};

export const useUploadEvidence = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      assessmentId,
      file,
      name,
      type,
    }: {
      assessmentId: string;
      file: File;
      name: string;
      type: string;
    }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
      formData.append('type', type);
      formData.append('assessmentId', assessmentId);
      const res = await fetchWithTenant(`${API_URL}/employee/me/documents`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to upload evidence');
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['assessmentEvidence', variables.assessmentId],
      });
    },
  });
};
