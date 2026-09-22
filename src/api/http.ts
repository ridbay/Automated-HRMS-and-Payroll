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

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (res.status === 401 && !url.includes('/auth/login') && !url.includes('/auth/register')) {
    localStorage.removeItem('zenhr_token');
    localStorage.removeItem('zenhr_user');
    window.dispatchEvent(new Event('zenhr:unauthorized'));
  }

  return res;
};

// Downloads an authenticated protected asset (e.g. employee document or candidate resume)
// by fetching it with the Bearer JWT and creating a temporary Object URL.
export const downloadAuthenticatedBlob = async (url: string, defaultFilename: string = 'document') => {
  const res = await fetchWithTenant(url);
  if (!res.ok) {
    let errorMsg = 'Failed to download file';
    try {
      const data = await res.json();
      if (data.error) errorMsg = data.error;
    } catch {}
    throw new Error(errorMsg);
  }

  const blob = await res.blob();
  const disposition = res.headers.get('content-disposition');
  let filename = defaultFilename;
  if (disposition && disposition.includes('filename=')) {
    const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
    if (matches && matches[1]) {
      filename = matches[1].replace(/['"]/g, '');
    }
  }

  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
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
