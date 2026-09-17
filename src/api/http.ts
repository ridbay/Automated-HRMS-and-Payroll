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

// `company.logoUrl` holds one of two shapes depending on how it was set:
// a base64 data URI (legacy inline-storage path) or an R2 object key (the
// real upload pipeline, POST /admin/company/logo). An R2 key isn't directly
// servable — it must be fetched through the streaming route instead.
export const resolveCompanyLogoUrl = (companyId: string, logoUrl?: string | null): string | null => {
  if (!logoUrl) return null;
  if (logoUrl.startsWith('data:') || logoUrl.startsWith('http')) return logoUrl;
  return `${API_URL}/public/company/${companyId}/logo`;
};
