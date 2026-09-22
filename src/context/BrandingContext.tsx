import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { API_URL, fetchWithTenant, resolveCompanyLogoUrl } from '../api/http';
import { useAuth } from './AuthContext';
import {
  applyThemeColor,
  getCachedThemeColor,
  isValidHexColor,
  DEFAULT_PRIMARY_COLOR,
} from '../utils/themeColors';

interface BrandingContextType {
  companyId: string | null;
  companyName: string;
  logoUrl: string | null;
  rawLogoKey: string | null;
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  refetchBranding: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [primaryColor, setPrimaryColorState] = useState<string>(getCachedThemeColor);
  const [companyName, setCompanyName] = useState<string>(() => {
    return localStorage.getItem('zenhr_brand_name') || 'ZenHR';
  });
  const [logoUrl, setLogoUrl] = useState<string | null>(() => {
    return localStorage.getItem('zenhr_brand_logo') || null;
  });
  const [rawLogoKey, setRawLogoKey] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Apply cached theme color immediately to prevent any flicker
  useEffect(() => {
    applyThemeColor(primaryColor);
  }, [primaryColor]);

  const setPrimaryColor = useCallback((color: string) => {
    if (isValidHexColor(color)) {
      setPrimaryColorState(color);
      applyThemeColor(color);
    }
  }, []);

  const refetchBranding = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const res = await fetchWithTenant(`${API_URL}/employee/company/branding`);
      if (!res.ok) return;

      const data = await res.json();
      if (!data) return;

      if (data.id) setCompanyId(data.id);
      if (data.name) {
        setCompanyName(data.name);
        localStorage.setItem('zenhr_brand_name', data.name);
      }
      if (data.logoUrl !== undefined) {
        setRawLogoKey(data.logoUrl);
        const resolved = resolveCompanyLogoUrl(data.id, data.logoUrl);
        setLogoUrl(resolved);
        if (resolved) {
          localStorage.setItem('zenhr_brand_logo', resolved);
        } else {
          localStorage.removeItem('zenhr_brand_logo');
        }
      }
      if (data.primaryColor && isValidHexColor(data.primaryColor)) {
        setPrimaryColorState(data.primaryColor);
        applyThemeColor(data.primaryColor);
      }
    } catch {
      // Graceful fallback to default/cached values
    }
  }, [isAuthenticated]);

  // Refetch branding whenever authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      refetchBranding();
    }
  }, [isAuthenticated, refetchBranding]);

  // Listen to custom logo or profile update events for instant sync
  useEffect(() => {
    const handleBrandingUpdated = () => {
      refetchBranding();
    };
    window.addEventListener('zenhr:branding_updated', handleBrandingUpdated);
    return () => window.removeEventListener('zenhr:branding_updated', handleBrandingUpdated);
  }, [refetchBranding]);

  return (
    <BrandingContext.Provider
      value={{
        companyId,
        companyName,
        logoUrl,
        rawLogoKey,
        primaryColor,
        setPrimaryColor,
        refetchBranding,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = (): BrandingContextType => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};
