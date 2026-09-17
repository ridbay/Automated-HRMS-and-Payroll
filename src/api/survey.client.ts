import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL, fetchWithTenant } from './http';

// ---------------- Admin Survey Fetchers ----------------

export const fetchAllSurveys = async () => {
  const res = await fetchWithTenant(`${API_URL}/admin/surveys`);
  if (!res.ok) throw new Error('Failed to fetch surveys');
  const body = await res.json();
  return body.data;
};

export const fetchSurveyResults = async (surveyId: string) => {
  const res = await fetchWithTenant(`${API_URL}/admin/surveys/${surveyId}/results`);
  if (!res.ok) throw new Error('Failed to fetch survey results');
  const body = await res.json();
  return body.data;
};

export const createSurvey = async (data: any) => {
  const res = await fetchWithTenant(`${API_URL}/admin/surveys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create survey');
  const body = await res.json();
  return body.data;
};

export const deleteSurvey = async (surveyId: string) => {
  const res = await fetchWithTenant(`${API_URL}/admin/surveys/${surveyId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete survey');
  const body = await res.json();
  return body;
};

// ---------------- Employee Survey Fetchers ----------------

export const fetchActiveSurveys = async () => {
  const res = await fetchWithTenant(`${API_URL}/employee/surveys`);
  if (!res.ok) throw new Error('Failed to fetch active surveys');
  const body = await res.json();
  return body.data;
};

export const fetchSurveyDetails = async (surveyId: string) => {
  const res = await fetchWithTenant(`${API_URL}/employee/surveys/${surveyId}`);
  if (!res.ok) throw new Error('Failed to fetch survey details');
  const body = await res.json();
  return body.data;
};

export const submitSurveyResponse = async ({ surveyId, answers }: { surveyId: string; answers: any[] }) => {
  const res = await fetchWithTenant(`${API_URL}/employee/surveys/${surveyId}/responses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) throw new Error('Failed to submit survey');
  const body = await res.json();
  return body.data;
};

// ---------------- React Query Hooks ----------------

export const useAdminSurveys = () => {
  return useQuery({
    queryKey: ['admin-surveys'],
    queryFn: fetchAllSurveys,
  });
};

export const useSurveyResults = (surveyId: string) => {
  return useQuery({
    queryKey: ['admin-surveys', surveyId, 'results'],
    queryFn: () => fetchSurveyResults(surveyId),
    enabled: !!surveyId,
  });
};

export const useCreateSurvey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSurvey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-surveys'] });
    },
  });
};

export const useDeleteSurvey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSurvey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-surveys'] });
    },
  });
};

export const useActiveSurveys = () => {
  return useQuery({
    queryKey: ['active-surveys'],
    queryFn: fetchActiveSurveys,
  });
};

export const useSurveyDetails = (surveyId: string) => {
  return useQuery({
    queryKey: ['survey-details', surveyId],
    queryFn: () => fetchSurveyDetails(surveyId),
    enabled: !!surveyId,
  });
};

export const useSubmitSurvey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitSurveyResponse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-surveys'] });
    },
  });
};
