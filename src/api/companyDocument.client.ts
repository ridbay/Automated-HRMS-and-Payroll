import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL, fetchWithTenant } from './http';

export const fetchCompanyDocuments = async () => {
  const res = await fetchWithTenant(`${API_URL}/admin/documents`);
  if (!res.ok) throw new Error('Failed to fetch documents');
  const body = await res.json();
  return body.data;
};

export const createCompanyDocument = async ({ title, content, file }: { title: string; content: string; file?: File | null }) => {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('content', content);
  if (file) formData.append('file', file);

  const res = await fetchWithTenant(`${API_URL}/admin/documents`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to upload document');
  }
  const body = await res.json();
  return body.data;
};

export const deleteCompanyDocument = async (id: string) => {
  const res = await fetchWithTenant(`${API_URL}/admin/documents/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete document');
  return res.json();
};

export const useCompanyDocuments = () => {
  return useQuery({
    queryKey: ['company-documents'],
    queryFn: fetchCompanyDocuments,
  });
};

export const useCreateCompanyDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCompanyDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-documents'] });
    },
  });
};

export const useDeleteCompanyDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCompanyDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-documents'] });
    },
  });
};
