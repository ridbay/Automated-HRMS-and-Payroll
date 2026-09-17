import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL, fetchWithTenant } from './http';

const invalidateMyBenefits = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['myBenefitsSummary'] });
  queryClient.invalidateQueries({ queryKey: ['myEnrollments'] });
};

const invalidateWellness = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['wellnessPrograms'] });
  queryClient.invalidateQueries({ queryKey: ['myBenefitsSummary'] });
};

// --- Admin: plan catalog ---

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
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create plan');
      }
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
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update plan');
      }
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
      const res = await fetchWithTenant(`${API_URL}/admin/benefits/plans/${planId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete plan');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['benefitPlans'] });
      queryClient.invalidateQueries({ queryKey: ['benefitsOverview'] });
    },
  });
};

// --- Admin: enrollments ---

export const useAdminEnrollments = (
  filters: { planId?: string; employeeId?: string; status?: string } = {}
) => {
  return useQuery({
    queryKey: ['adminBenefitEnrollments', filters],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (filters.planId) query.append('planId', filters.planId);
      if (filters.employeeId) query.append('employeeId', filters.employeeId);
      if (filters.status) query.append('status', filters.status);
      const res = await fetchWithTenant(
        `${API_URL}/admin/benefits/enrollments?${query.toString()}`
      );
      if (!res.ok) throw new Error('Failed to fetch enrollments');
      return res.json();
    },
  });
};

export const useAdminEnrollEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      employeeId: string;
      planId: string;
      coverageLevel?: string;
      notes?: string;
    }) => {
      const res = await fetchWithTenant(`${API_URL}/admin/benefits/enrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to enroll employee');
      }
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
    mutationFn: async ({
      enrollmentId,
      status,
    }: {
      enrollmentId: string;
      status: 'enrolled' | 'waived' | 'cancelled';
    }) => {
      const res = await fetchWithTenant(
        `${API_URL}/admin/benefits/enrollments/${enrollmentId}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update enrollment');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBenefitEnrollments'] });
      queryClient.invalidateQueries({ queryKey: ['benefitsOverview'] });
    },
  });
};

// --- Admin: wellness programs ---

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
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create program');
      }
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
      const res = await fetchWithTenant(
        `${API_URL}/admin/benefits/wellness/programs/${programId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update program');
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminWellnessPrograms'] }),
  });
};

export const useDeleteWellnessProgram = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (programId: string) => {
      const res = await fetchWithTenant(
        `${API_URL}/admin/benefits/wellness/programs/${programId}`,
        { method: 'DELETE' }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete program');
      }
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
      const res = await fetchWithTenant(
        `${API_URL}/admin/benefits/wellness/programs/${programId}/participants`
      );
      if (!res.ok) throw new Error('Failed to fetch participants');
      return res.json();
    },
    enabled: !!programId,
  });
};

// --- Admin: benefit claims ---

export const useAdminBenefitClaims = (
  filters: { status?: string; kind?: string; employeeId?: string } = {}
) => {
  return useQuery({
    queryKey: ['adminBenefitClaims', filters],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (filters.status) query.append('status', filters.status);
      if (filters.kind) query.append('kind', filters.kind);
      if (filters.employeeId) query.append('employeeId', filters.employeeId);
      const res = await fetchWithTenant(
        `${API_URL}/admin/benefits/claims?${query.toString()}`
      );
      if (!res.ok) throw new Error('Failed to fetch claims');
      return res.json();
    },
  });
};

export const useReviewBenefitClaim = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      claimId,
      status,
      notes,
    }: {
      claimId: string;
      status: 'approved' | 'rejected';
      notes?: string;
    }) => {
      const res = await fetchWithTenant(
        `${API_URL}/admin/benefits/claims/${claimId}/review`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, notes }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to review claim');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBenefitClaims'] });
      queryClient.invalidateQueries({ queryKey: ['benefitsOverview'] });
    },
  });
};

// --- Employee self-service benefits ---

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

export const useEnrollInPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { planId: string; coverageLevel?: string; notes?: string }) => {
      const res = await fetchWithTenant(`${API_URL}/employee/benefits/enrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to enroll');
      }
      return res.json();
    },
    onSuccess: () => invalidateMyBenefits(queryClient),
  });
};

export const useCancelMyEnrollment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (enrollmentId: string) => {
      const res = await fetchWithTenant(
        `${API_URL}/employee/benefits/enrollments/${enrollmentId}/cancel`,
        { method: 'PATCH' }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to cancel enrollment');
      }
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
    mutationFn: async (data: {
      name: string;
      relationship: string;
      dateOfBirth?: string;
    }) => {
      const res = await fetchWithTenant(`${API_URL}/employee/benefits/dependents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to add dependent');
      }
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
      const res = await fetchWithTenant(
        `${API_URL}/employee/benefits/dependents/${dependentId}`,
        { method: 'DELETE' }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to remove dependent');
      }
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

export const useJoinWellnessProgram = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (programId: string) => {
      const res = await fetchWithTenant(
        `${API_URL}/employee/benefits/wellness/programs/${programId}/join`,
        { method: 'POST' }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to join program');
      }
      return res.json();
    },
    onSuccess: () => invalidateWellness(queryClient),
  });
};

export const useUpdateMyProgramProgress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      programId,
      progress,
    }: {
      programId: string;
      progress: number;
    }) => {
      const res = await fetchWithTenant(
        `${API_URL}/employee/benefits/wellness/programs/${programId}/progress`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ progress }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update progress');
      }
      return res.json();
    },
    onSuccess: () => invalidateWellness(queryClient),
  });
};

export const useLeaveWellnessProgram = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (programId: string) => {
      const res = await fetchWithTenant(
        `${API_URL}/employee/benefits/wellness/programs/${programId}/leave`,
        { method: 'POST' }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to leave program');
      }
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
    mutationFn: async (data: {
      kind: 'health' | 'wellness';
      category: string;
      amount: number;
      provider?: string;
      description?: string;
    }) => {
      const res = await fetchWithTenant(`${API_URL}/employee/benefits/claims`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to submit claim');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBenefitClaims'] });
      queryClient.invalidateQueries({ queryKey: ['myBenefitsSummary'] });
    },
  });
};
