// Shared HTTP primitives used by every domain client module.
// Import from here, NOT from client.ts directly.

export const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8787';

export const fetchWithTenant = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('zenhr_token');
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
};
