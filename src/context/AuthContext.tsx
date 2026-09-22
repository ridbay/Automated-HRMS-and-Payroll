import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { User } from "../types/index";

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8787';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (patch: Partial<User>) => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('zenhr_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('zenhr_token');
  });

  const login = useCallback((userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('zenhr_user', JSON.stringify(userData));
    localStorage.setItem('zenhr_token', authToken);

    // Fetch the real employee profile in the background to hydrate avatar
    const companyId = (userData as any).companyId || 'comp-1234';
    fetch(`${API}/employee/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'x-company-id': companyId,
      },
    })
      .then(r => r.ok ? r.json() : null)
      .then(profile => {
        if (!profile) return;
        // Preserve fields that gate app-level routing (e.g. `status`, checked in
        // App.tsx to route brand-new hires into the onboarding flow) — not just
        // cosmetic fields like avatar.
        const patched: User = {
          ...userData,
          avatar: profile.avatar ?? userData.avatar,
          status: profile.status ?? userData.status,
        };
        setUser(patched);
        localStorage.setItem('zenhr_user', JSON.stringify(patched));
      })
      .catch(() => {/* silent */ });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('zenhr_user');
    localStorage.removeItem('zenhr_token');
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('zenhr:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('zenhr:unauthorized', handleUnauthorized);
  }, [logout]);

  // Patch user fields (e.g. after avatar upload)
  const updateUser = useCallback((patch: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      localStorage.setItem('zenhr_user', JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, updateUser, isAuthenticated: !!user && !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
