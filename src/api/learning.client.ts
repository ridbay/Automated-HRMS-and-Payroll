import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8787';
const MOCK_COMPANY_ID = 'comp-1234';

const fetchWithTenant = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('zenhr_token');
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
    'x-company-id': MOCK_COMPANY_ID,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, { ...options, headers });
};

// ---------------- Admin LMS Fetchers ----------------

export const fetchAllCourses = async () => {
  const res = await fetchWithTenant(`${API_URL}/admin/courses`);
  if (!res.ok) throw new Error('Failed to fetch courses');
  const body = await res.json();
  return body.data;
};

export const createCourse = async (data: any) => {
  const res = await fetchWithTenant(`${API_URL}/admin/courses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create course');
  const body = await res.json();
  return body.data;
};

export const deleteCourse = async (courseId: string) => {
  const res = await fetchWithTenant(`${API_URL}/admin/courses/${courseId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete course');
  const body = await res.json();
  return body;
};

// ---------------- Employee LMS Fetchers ----------------

export const fetchMyCourses = async () => {
  const res = await fetchWithTenant(`${API_URL}/employee/courses`);
  if (!res.ok) throw new Error('Failed to fetch my courses');
  const body = await res.json();
  return body.data;
};

export const updateCourseProgress = async ({ enrollmentId, progress }: { enrollmentId: string; progress: number }) => {
  const res = await fetchWithTenant(`${API_URL}/employee/courses/enrollments/${enrollmentId}/progress`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ progress }),
  });
  if (!res.ok) throw new Error('Failed to update progress');
  const body = await res.json();
  return body.data;
};

// ---------------- React Query Hooks ----------------

export const useAdminCourses = () => {
  return useQuery({
    queryKey: ['admin-courses'],
    queryFn: fetchAllCourses,
  });
};

export const useCreateCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
    },
  });
};

export const useDeleteCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
    },
  });
};

export const useMyCourses = () => {
  return useQuery({
    queryKey: ['my-courses'],
    queryFn: fetchMyCourses,
  });
};

export const useUpdateCourseProgress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCourseProgress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
    },
  });
};
