import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8787';
const MOCK_COMPANY_ID = 'comp-1234'; // Simulated logged-in tenant

const fetchWithTenant = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('zenhr_token');
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
    'x-company-id': MOCK_COMPANY_ID,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
};

// ---------------- Admin Asset Fetchers ----------------

export const fetchAllAssets = async () => {
  const res = await fetchWithTenant(`${API_URL}/admin/assets`);
  if (!res.ok) throw new Error('Failed to fetch assets');
  const body = await res.json();
  return body.data;
};

export const createAsset = async (data: any) => {
  const res = await fetchWithTenant(`${API_URL}/admin/assets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create asset');
  const body = await res.json();
  return body.data;
};

export const updateAsset = async (assetId: string, data: any) => {
  const res = await fetchWithTenant(`${API_URL}/admin/assets/${assetId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update asset');
  const body = await res.json();
  return body.data;
};

export const deleteAsset = async (assetId: string) => {
  const res = await fetchWithTenant(`${API_URL}/admin/assets/${assetId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete asset');
  const body = await res.json();
  return body;
};

// ---------------- Employee Asset Fetchers ----------------

export const fetchMyAssets = async () => {
  const res = await fetchWithTenant(`${API_URL}/employee/my-assets`);
  if (!res.ok) throw new Error('Failed to fetch my assets');
  const body = await res.json();
  return body.data;
};

// ---------------- React Query Hooks ----------------

export const useAdminAssets = () => {
  return useQuery({
    queryKey: ['admin-assets'],
    queryFn: fetchAllAssets,
  });
};

export const useCreateAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-assets'] });
    },
  });
};

export const useUpdateAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateAsset(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-assets'] });
    },
  });
};

export const useDeleteAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-assets'] });
    },
  });
};

export const useMyAssets = () => {
  return useQuery({
    queryKey: ['my-assets'],
    queryFn: fetchMyAssets,
  });
};
