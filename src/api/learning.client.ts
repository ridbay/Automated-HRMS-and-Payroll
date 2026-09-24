import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL, fetchWithTenant } from './http';

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

export const updateCourse = async ({ id, data }: { id: string; data: any }) => {
  const res = await fetchWithTenant(`${API_URL}/admin/courses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update course');
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

export const assignCourse = async ({ courseId, employeeIds }: { courseId: string; employeeIds: string[] }) => {
  const res = await fetchWithTenant(`${API_URL}/admin/courses/${courseId}/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeIds }),
  });
  if (!res.ok) {
    let message = 'Failed to assign course';
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch { /* non-JSON error body */ }
    throw new Error(message);
  }
  const body = await res.json();
  return body.data;
};

export const fetchCourseEnrollments = async (courseId: string) => {
  const res = await fetchWithTenant(`${API_URL}/admin/courses/${courseId}/enrollments`);
  if (!res.ok) throw new Error('Failed to fetch course enrollments');
  const body = await res.json();
  return body.data;
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

export const fetchLMSOverview = async () => {
  const res = await fetchWithTenant(`${API_URL}/admin/courses/overview`);
  if (!res.ok) throw new Error('Failed to fetch LMS overview');
  const body = await res.json();
  return body.data;
};

export const unassignCourse = async ({ courseId, enrollmentId }: { courseId: string; enrollmentId: string }) => {
  const res = await fetchWithTenant(`${API_URL}/admin/courses/${courseId}/enrollments/${enrollmentId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to unassign course');
  const body = await res.json();
  return body;
};

export const assignDepartment = async ({ courseId, department }: { courseId: string; department: string }) => {
  const res = await fetchWithTenant(`${API_URL}/admin/courses/${courseId}/assign-department`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ department }),
  });
  if (!res.ok) {
    let message = 'Failed to assign department';
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch { /* ignore */ }
    throw new Error(message);
  }
  const body = await res.json();
  return body.data;
};

export const fetchTeamCourses = async () => {
  const res = await fetchWithTenant(`${API_URL}/employee/courses/team`);
  if (!res.ok) throw new Error('Failed to fetch team courses');
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

export const useLMSOverview = () => {
  return useQuery({
    queryKey: ['lms-overview'],
    queryFn: fetchLMSOverview,
  });
};

export const useCreateCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['lms-overview'] });
    },
  });
};

export const useUpdateCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['lms-overview'] });
    },
  });
};

export const useDeleteCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['lms-overview'] });
    },
  });
};

export const useAssignCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignCourse,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course-enrollments', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['lms-overview'] });
    },
  });
};

export const useUnassignCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unassignCourse,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course-enrollments', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['lms-overview'] });
    },
  });
};

export const useAssignDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignDepartment,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course-enrollments', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['lms-overview'] });
    },
  });
};

export const useCourseEnrollments = (courseId: string | null) => {
  return useQuery({
    queryKey: ['course-enrollments', courseId],
    queryFn: () => fetchCourseEnrollments(courseId as string),
    enabled: !!courseId,
  });
};

export const useMyCourses = () => {
  return useQuery({
    queryKey: ['my-courses'],
    queryFn: fetchMyCourses,
  });
};

export const useTeamCourses = () => {
  return useQuery({
    queryKey: ['team-courses'],
    queryFn: fetchTeamCourses,
  });
};

export const useUpdateCourseProgress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCourseProgress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
      queryClient.invalidateQueries({ queryKey: ['team-courses'] });
      queryClient.invalidateQueries({ queryKey: ['lms-overview'] });
    },
  });
};
